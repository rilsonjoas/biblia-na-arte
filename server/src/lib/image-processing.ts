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
 *  (só cosmético — a rota serve por nome de arquivo, não por convenção).
 *  `rename()` em vez de copiar+apagar: mesmo filesystem (mesmo volume
 *  Docker), então é atômico e mais barato. */
export async function promoteSubmissionImage(
  pendingPath: string,
  approvedDir: string,
  artistName: string,
  title: string,
): Promise<string> {
  await mkdir(approvedDir, { recursive: true });

  const base = slugify(`${artistName || 'artista-desconhecido'}-${title}`);
  const filename = `${base}.webp`;
  await rename(pendingPath, path.join(approvedDir, filename));

  return filename;
}
