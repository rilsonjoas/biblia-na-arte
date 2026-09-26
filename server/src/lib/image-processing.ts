import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { mkdir, rename } from 'node:fs/promises';
import { slugify } from './vault-parse.js';

// Mesmas configurações do export do vault (export-vault-data.ts) — uma
// obra submetida pelo painel precisa ficar visualmente indistinguível de
// uma obra curada do vault. Duplicar essas duas constantes aqui é
// deliberado: são scripts/entry points diferentes, e o acoplamento de
// importar um script standalone de dentro do server não vale a pena só
// por isso.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;

export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidImageError';
  }
}

/** Falha ao buscar a imagem original (`web`, fora do processo desta API)
 *  pra gerar a versão social — mesmo tratamento de `BibleTextUpstreamError`
 *  (502, não 500: o problema é da fonte, não desta API). */
export class SocialImageUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SocialImageUpstreamError';
  }
}

// Limites reais do Instagram Graph API pra post de feed (Facebook usa a
// mesma faixa) — fora disso o `/media` retorna 400 "Invalid Aspect
// Ratio" (achado em produção 2026-09-26: pintura panorâmica de 2.39:1
// derrubou o post do dia enquanto o Threads, mais tolerante, publicou
// normal). Documentado pela própria Meta como 4:5 (retrato) a 1.91:1
// (paisagem).
const MIN_ASPECT_RATIO = 4 / 5;
const MAX_ASPECT_RATIO = 1.91;

// Mesmo tom de `--background` do design system do site (`web/src/index.css`,
// hsl(35 20% 97%)) convertido pra RGB — a moldura tem que combinar com a
// identidade visual, não ser um branco genérico de "correção técnica".
const LETTERBOX_BACKGROUND = { r: 249, g: 248, b: 246 };

/** Gera a versão de uma obra segura pra publicar no Instagram/Facebook:
 *  se a proporção já estiver dentro do aceito, devolve a imagem original
 *  sem alteração; se estiver fora (pintura muito panorâmica ou muito
 *  vertical), adiciona uma moldura sólida na cor de fundo do site até
 *  caber no limite, preservando a obra inteira sem cortar nada. Sempre
 *  devolve JPEG (formato que o Graph API espera). */
export async function generateSocialImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    throw new InvalidImageError('Não foi possível ler as dimensões da imagem.');
  }

  const ratio = width / height;

  if (ratio >= MIN_ASPECT_RATIO && ratio <= MAX_ASPECT_RATIO) {
    return image.jpeg({ quality: 90 }).toBuffer();
  }

  // Ratio > MAX: imagem larga demais — mantém a largura, cresce a altura.
  // Ratio < MIN: imagem alta demais — mantém a altura, cresce a largura.
  const targetRatio = ratio > MAX_ASPECT_RATIO ? MAX_ASPECT_RATIO : MIN_ASPECT_RATIO;
  const canvasWidth = ratio > MAX_ASPECT_RATIO ? width : Math.round(height * targetRatio);
  const canvasHeight = ratio > MAX_ASPECT_RATIO ? Math.round(width / targetRatio) : height;

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: LETTERBOX_BACKGROUND,
    },
  })
    .composite([{ input: await image.toBuffer(), gravity: 'center' }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

/** Converte um upload (buffer bruto, qualquer formato que o sharp lê)
 *  pro mesmo padrão WebP do resto do acervo, salvando num diretório
 *  próprio — nunca direto em `web/public/images` (só entra lá quando a
 *  submissão for aprovada). Nome de arquivo aleatório (não baseado em
 *  slug/título) porque nesse estágio a obra ainda pode nem ter título
 *  definitivo. */
export async function processSubmissionImage(buffer: Buffer, uploadsDir: string): Promise<string> {
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${randomUUID()}.webp`;

  try {
    await sharp(buffer)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(path.join(uploadsDir, filename));
  } catch (err) {
    throw new InvalidImageError(`Não foi possível processar a imagem: ${(err as Error).message}`);
  }

  return filename;
}

/** Move a imagem de uma submissão aprovada da pasta privada
 *  (`SUBMISSION_UPLOADS_DIR`) pra pasta pública própria da API
 *  (`APPROVED_SUBMISSION_UPLOADS_DIR`, servida por `routes/uploads.ts`),
 *  renomeando pro mesmo padrão `artista-titulo.webp` das obras do vault
 *  (cosmético — a rota serve por nome de arquivo, não por convenção).
 *  `rename()` em vez de copiar+apagar: mesmo filesystem (mesmo volume
 *  Docker), então é atômico e mais barato.
 *
 *  `submissionId` (sempre único, já existe antes da aprovação) entra
 *  como sufixo curto do nome — achado real 2026-09-05: sem isso, duas
 *  submissões com o mesmo artista+título (ou ambas "autor
 *  desconhecido" + título igual) geram o mesmo slug, e a segunda
 *  aprovação sobrescreve o arquivo da primeira em silêncio — nenhum
 *  erro, só a obra antiga passa a apontar pra imagem errada. */
export async function promoteSubmissionImage(
  pendingPath: string,
  approvedDir: string,
  artistName: string,
  title: string,
  submissionId: string,
): Promise<string> {
  await mkdir(approvedDir, { recursive: true });

  const base = slugify(`${artistName || 'artista-desconhecido'}-${title}`);
  const suffix = submissionId.replace(/-/g, '').slice(0, 8);
  const filename = `${base}-${suffix}.webp`;
  await rename(pendingPath, path.join(approvedDir, filename));

  return filename;
}
