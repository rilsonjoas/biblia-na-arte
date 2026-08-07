#!/usr/bin/env tsx
/**
 * Lê as ~1000 notas de pintura do vault Obsidian, aplica as decisões da
 * auditoria de direitos autorais (ver "Auditoria de Direitos Autorais -
 * Bíblia na Arte" no vault, 2026-08-07), copia as imagens aprovadas pra
 * web/public/images/ e escreve um JSON com os dados prontos pra importar
 * no Postgres (import-seed-data.ts, que roda perto do banco no VPS).
 *
 * Só roda no desktop do Rilson (é onde o vault mora) — não faz parte do
 * deploy, é uma etapa de curadoria manual.
 *
 * Uso: pnpm --filter server exec tsx scripts/export-vault-data.ts
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { resolveBibleBook } from '../src/db/seed-data/bible-books.js';

const VAULT_PINTURAS = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';
const VAULT_ANEXOS = '/home/narniano/Documentos/Rilson/0 - Anexos';
const OUTPUT_IMAGES_DIR = path.resolve(import.meta.dirname, '../../web/public/images');
const OUTPUT_JSON = path.resolve(import.meta.dirname, 'vault-export.json');

// ---------------------------------------------------------------------
// Listas de exclusão — fonte da verdade é a nota de auditoria no vault.
// Nomes exatamente como aparecem no campo `autor:` corrigido (wikilink).
// ---------------------------------------------------------------------

/** Lista 🔴 completa (alto risco) + Wang/Latimore (licenciamento pendente,
 * ainda sem resposta) + Nobleheart (achado durante a migração — artista
 * pseudônimo contemporâneo de arte devocional web, mesmo perfil de risco
 * dos outros, nunca foi auditado por não aparecer com esse nome antes). */
const EXCLUDED_ARTISTS = new Set([
  'Kirk Richards',
  'Andrei Bodko',
  'Ivanka Demchuk',
  'Elizabeth Wang', // licenciamento pendente (Radiant Light)
  'Candido Portinari',
  'Cândido Portinari',
  'Yongsung Kim',
  'Kateryna Kuziv',
  'Borys Sheremeta',
  'Lyuba Yatskiv',
  'Salvador Dalí',
  'Janet McKenzie',
  'Timothy Schmalz',
  'The Chosen', // nem é pintura, still de série de TV
  'Kelly Latimore', // licenciamento pendente
  'Josh Tiessen',
  'Danny Hahlbohm',
  'Dan Hillier',
  'Pablo Sanaguano',
  'Soichi Watanabe',
  'He Qi',
  'Henk Helmantel',
  'Maximino Cerezo Barredo',
  'Liz Lemon Swindle',
  'Walter Rane',
  'Arnold Friberg',
  'Mariusz Lewandowski',
  'Kim Ki-chang',
  'Takato Yamamoto',
  'Aaron Douglas',
  'Charles S Ndege',
  'Olya Kravchenko',
  'Olivia McLeod',
  'Natalya Rusetska',
  'Luke Hua Xiaoxian',
  'Nobleheart', // achado 2026-08-08, mesmo perfil dos outros contemporâneos
]);

/** Nomes que, depois de resolvidos (frontmatter ou fallback pelo nome do
 * arquivo), indicam "sem autor identificado" — tratado como allowlist, não
 * blocklist: por padrão TODA pintura de autor desconhecido fica de fora,
 * só entram as explicitamente confirmadas seguras abaixo. */
const UNKNOWN_AUTHOR_VALUES = new Set(['autor desconhecido', 'desconhecido']);

/** As 16 pinturas de autor desconhecido confirmadas seguras na auditoria
 * (pré-1900 por data no frontmatter, ou mural/mosaico identificado com
 * artista+data que elimina qualquer dúvida — ver nota de auditoria,
 * seção ⚫). Qualquer outra pintura de autor desconhecido (as 4 que
 * ficaram sem resolução + as descobertas depois, durante a escrita deste
 * script) fica de fora por padrão. */
const ALLOWED_UNKNOWN_AUTHOR_FILENAMES = new Set([
  'Autor Desconhecido - Ceia em Emaús no Tabernáculo de Cherves (Supper at Emmaus on the Tabernacle of Cherves).md',
  'Autor Desconhecido - Criação do Universo (Creation of the Universe).md',
  'Autor Desconhecido - Entrada de Jesus em Jerusalém, 1856 (Entry of Jesus into Jerusalem).md',
  'Autor Desconhecido - Jesus Amaldiçoa a Figueira (Jesus Curses the Fig Tree).md',
  'Autor Desconhecido - Judas recebendo 30 moedas de prata (Judas recebendo 30 moedas de prata).md',
  'Autor Desconhecido - Maria unge os pés de Jesus (Mary Anoints the Feet of Jesus).md',
  'Autor Desconhecido - O sonho de José e a jornada até Belém (O sonho de José e a jornada até Belém).md',
  'Autor Desconhecido - Os temperados e os intemperados (Os temperados e os intemperados).md',
  'Autor Desconhecido - Paulo e Barnabé tomados por deuses (Paul and Barnabas at Lystra).md',
  'Autor Desconhecido - Transfiguração de Cristo (Transfiguration of Christ).md',
  'Autor desconhecido - A natividade.md',
  'Autor desconhecido - Os alegres mártires de Nagasaki  The Joyful Martyrs of Nagasaki (The Joyful Martyrs of Nagasaki).md',
  'Desconhecido - A Adoração do Cordeiro (Adoration of the Lamb).md',
  'Desconhecido - A Incredulidade de Tomé.md',
  'Autor Desconhecido - A Transfiguração (The Transfiguration).md', // mosaico do Monte Tabor, Umberto Noni, 1924
  'Autor Desconhecido - Pentecoste (Pentecoste).md', // capela de Eugenio Cisterna, Lourdes, 1893-1907
]);

/** Autor -> { licença, texto de atribuição } pra quem não é domínio
 * público simples mas está aprovado com licença explícita. */
const LICENSED_ARTISTS: Record<string, { licenseType: string; attributionText: string }> = {
  'Andrei Mironov': {
    licenseType: 'cc-by-sa-4.0',
    attributionText:
      'Andrei Mironov, CC BY-SA 4.0, via Wikimedia Commons (https://commons.wikimedia.org/wiki/Category:Religious_paintings_by_Andrei_Mironov)',
  },
};

// ---------------------------------------------------------------------

interface RawFrontmatter {
  autor?: string;
  ano?: string | number;
  data?: string | number;
  titulo_original?: string;
  livros?: string[];
  capítulos?: string[];
  tags?: string[];
}

interface ExportedReference {
  book: string;
  bookSlug: string;
  chapter: number;
  verses?: string;
}

interface ExportedArtwork {
  slug: string;
  title: string;
  artistOrDirector: string;
  year?: string;
  category: 'painting';
  description: string;
  imageFile: string; // nome do arquivo já copiado pra web/public/images/
  licenseType: string;
  attributionText?: string;
  references: ExportedReference[];
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function extractFrontmatter(content: string): RawFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return parseYaml(match[1]) as RawFrontmatter;
  } catch {
    return null;
  }
}

function extractWikilink(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const m = value.match(/\[\[([^\]]*)\]\]/);
  return (m ? m[1] : value).trim();
}

function extractDescription(content: string): string {
  const afterFrontmatter = content.replace(/^---\n[\s\S]*?\n---/, '').trim();
  const descMatch = afterFrontmatter.match(/###\s*Descrição da Obra\s*\n+([\s\S]*?)(?=\n---|\n###|$)/);
  if (descMatch) return descMatch[1].trim().slice(0, 2000);
  // Fallback: primeiro parágrafo de texto depois da imagem embutida
  const withoutImage = afterFrontmatter.replace(/!\[\[[^\]]+\]\]/, '').trim();
  const firstParagraph = withoutImage.split(/\n{2,}/).find((p) => p.trim().length > 20);
  return (firstParagraph ?? '').trim().slice(0, 2000);
}

/** "Gênesis 18" -> {book: "Gênesis", chapter: 18}
 *  "Jó 2 1"     -> {book: "Jó", chapter: 2, verse: "1"}
 *  "1 Samuel 17" -> {book: "1 Samuel", chapter: 17}         */
function parseChapterLink(raw: unknown): { book: string; chapter: number; verse?: string } | null {
  const inner = extractWikilink(raw);
  const m = inner.match(/^(.+?)\s+(\d+)(?:\s+(\d+))?$/);
  if (!m) return null;
  return { book: m[1].trim(), chapter: Number(m[2]), verse: m[3] };
}

function findImageFile(content: string): string | null {
  const m = content.match(/!\[\[([^\]|]+\.(?:jpe?g|png|gif|webp|svg))/i);
  if (!m) return null;
  const basename = path.basename(m[1]);
  const fullPath = path.join(VAULT_ANEXOS, basename);
  return existsSync(fullPath) ? fullPath : null;
}

/** Só confia no nome do arquivo como fallback de autor quando ele segue a
 * convenção "Autor - Título.md" — senão devolve vazio em vez de usar o
 * título inteiro como se fosse nome de artista. */
function deriveArtistFromFilename(filename: string): string {
  const nameWithoutExt = filename.replace(/\.md$/, '');
  if (!nameWithoutExt.includes(' - ')) return '';
  return nameWithoutExt.split(' - ')[0].trim();
}

function normalizeForComparison(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function main() {
  mkdirSync(OUTPUT_IMAGES_DIR, { recursive: true });

  const files = readdirSync(VAULT_PINTURAS).filter((f) => f.endsWith('.md'));

  const artworks: ExportedArtwork[] = [];
  const skipped: { file: string; reason: string }[] = [];
  const unresolvedBooks = new Set<string>();

  for (const file of files) {
    const fullPath = path.join(VAULT_PINTURAS, file);
    const content = readFileSync(fullPath, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter || !frontmatter.autor) {
      skipped.push({ file, reason: 'sem frontmatter válido ou sem campo autor' });
      continue;
    }

    let artist = extractWikilink(frontmatter.autor);
    if (!artist) artist = deriveArtistFromFilename(file);

    if (!artist) {
      skipped.push({ file, reason: 'autor não identificável (frontmatter vazio + nome de arquivo sem convenção)' });
      continue;
    }

    if (EXCLUDED_ARTISTS.has(artist)) {
      skipped.push({ file, reason: `artista excluído: ${artist}` });
      continue;
    }

    if (UNKNOWN_AUTHOR_VALUES.has(normalizeForComparison(artist)) && !ALLOWED_UNKNOWN_AUTHOR_FILENAMES.has(file)) {
      skipped.push({ file, reason: 'autor desconhecido, não confirmado seguro na auditoria' });
      continue;
    }

    const imageSourcePath = findImageFile(content);
    if (!imageSourcePath) {
      skipped.push({ file, reason: 'sem imagem válida em 0 - Anexos' });
      continue;
    }

    // Nem todo arquivo segue "Autor - Título.md" (ex. "Jesus chorou.md",
    // autor só no frontmatter) — se não tem " - ", o nome inteiro é o
    // título, não fica vazio.
    const nameWithoutExt = file.replace(/\.md$/, '');
    const title = nameWithoutExt.includes(' - ')
      ? nameWithoutExt.split(' - ').slice(1).join(' - ')
      : nameWithoutExt;
    const slug = slugify(`${artist}-${title}`);
    const ext = path.extname(imageSourcePath);
    const imageFile = `${slug}${ext}`;

    copyFileSync(imageSourcePath, path.join(OUTPUT_IMAGES_DIR, imageFile));

    const references: ExportedReference[] = [];
    const capitulos = Array.isArray(frontmatter.capítulos) ? frontmatter.capítulos : [];
    for (const raw of capitulos) {
      const parsed = parseChapterLink(raw);
      if (!parsed) continue;
      const book = resolveBibleBook(parsed.book);
      if (!book) {
        unresolvedBooks.add(parsed.book);
        continue;
      }
      references.push({
        book: book.name,
        bookSlug: book.slug,
        chapter: parsed.chapter,
        verses: parsed.verse,
      });
    }

    const licensed = LICENSED_ARTISTS[artist];
    const yearRaw = frontmatter.ano ?? frontmatter.data;
    const year = yearRaw !== undefined && yearRaw !== '' ? String(yearRaw) : undefined;

    artworks.push({
      slug,
      title,
      artistOrDirector: artist,
      year,
      category: 'painting',
      description: extractDescription(content) || `${title}, de ${artist}.`,
      imageFile,
      licenseType: licensed?.licenseType ?? 'public-domain',
      attributionText: licensed?.attributionText,
      references,
    });
  }

  writeFileSync(OUTPUT_JSON, JSON.stringify({ artworks, exportedAt: new Date().toISOString() }, null, 2));

  console.log(`✅ ${artworks.length} pinturas exportadas`);
  console.log(`⏭️  ${skipped.length} puladas`);
  console.log(`📁 Imagens copiadas pra: ${OUTPUT_IMAGES_DIR}`);
  console.log(`📄 JSON: ${OUTPUT_JSON}`);
  if (unresolvedBooks.size > 0) {
    console.log(`⚠️  Livros bíblicos não reconhecidos (referência pulada, obra mantida):`, [...unresolvedBooks]);
  }

  const skipCounts = skipped.reduce<Record<string, number>>((acc, s) => {
    const key = s.reason.split(':')[0];
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  console.log('📊 Motivos de exclusão:', skipCounts);
}

main();
