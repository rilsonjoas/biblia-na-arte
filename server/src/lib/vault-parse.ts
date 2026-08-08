/**
 * Funções puras de parse das notas de pintura do vault Obsidian — extraídas
 * de scripts/export-vault-data.ts pra serem testáveis em isolamento (Vitest).
 * Nada aqui faz I/O de arquivo ou depende do caminho do vault.
 */
import path from 'node:path';
import { existsSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

export interface RawFrontmatter {
  autor?: string;
  ano?: string | number;
  data?: string | number;
  titulo_original?: string;
  livros?: string[];
  capítulos?: string[];
  tags?: string[];
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function extractFrontmatter(content: string): RawFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match?.[1]) return null;
  try {
    return parseYaml(match[1]) as RawFrontmatter;
  } catch {
    return null;
  }
}

export function extractWikilink(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const m = value.match(/\[\[([^\]]*)\]\]/);
  return (m?.[1] ?? value).trim();
}

/** Extrai a seção "### Descrição da Obra". Fallback: primeiro parágrafo de
 *  texto depois da imagem embutida. Mesmo comportamento do script original. */
export function extractDescription(content: string): string {
  const afterFrontmatter = content.replace(/^---\n[\s\S]*?\n---/, '').trim();
  const descMatch = afterFrontmatter.match(/###\s*Descrição da Obra\s*\n+([\s\S]*?)(?=\n---|\n###|$)/);
  if (descMatch?.[1]) return descMatch[1].trim().slice(0, 2000);
  // Fallback: primeiro parágrafo de texto depois da imagem embutida
  const withoutImage = afterFrontmatter.replace(/!\[\[[^\]]+\]\]/, '').trim();
  const firstParagraph = withoutImage.split(/\n{2,}/).find((p) => p.trim().length > 20);
  return (firstParagraph ?? '').trim().slice(0, 2000);
}

/** "Gênesis 18" -> {book: "Gênesis", chapter: 18}
 *  "Jó 2 1"     -> {book: "Jó", chapter: 2, verse: "1"}
 *  "1 Samuel 17" -> {book: "1 Samuel", chapter: 17}          */
export function parseChapterLink(raw: unknown): { book: string; chapter: number; verse?: string } | null {
  const inner = extractWikilink(raw);
  const m = inner.match(/^(.+?)\s+(\d+)(?:\s+(\d+))?$/);
  if (!m) return null;
  const book = m[1]?.trim();
  const chapter = m[2] ? Number(m[2]) : NaN;
  if (!book || !Number.isInteger(chapter) || chapter <= 0) return null;
  const verse = m[3];
  const result: { book: string; chapter: number; verse?: string } = { book, chapter };
  if (verse) result.verse = verse;
  return result;
}

/** Só confia no nome do arquivo como fallback de autor quando ele segue a
 *  convenção "Autor - Título.md" — senão devolve vazio em vez de usar o
 *  título inteiro como se fosse nome de artista. */
export function deriveArtistFromFilename(filename: string): string {
  const nameWithoutExt = filename.replace(/\.md$/, '');
  if (!nameWithoutExt.includes(' - ')) return '';
  return nameWithoutExt.split(' - ')[0]?.trim() ?? '';
}

export function normalizeForComparison(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** "Autor - Título.md" -> "Título"; sem " - ", o nome inteiro é o título.
 *  (O parse inteligente que tira " N" e o parêntese do título original é a
 *  Fase 1 do ROADMAP — aqui preservamos o comportamento atual.) */
export function titleFromFilename(filename: string): string {
  const nameWithoutExt = filename.replace(/\.md$/, '');
  return nameWithoutExt.includes(' - ')
    ? nameWithoutExt.split(' - ').slice(1).join(' - ')
    : nameWithoutExt;
}

/** Procura a imagem embutida (`![[arquivo.jpg|600]]`) em 0 - Anexos. */
export function findImageFile(content: string, anexosDir: string): string | null {
  const m = content.match(/!\[\[([^\]|]+\.(?:jpe?g|png|gif|webp|svg))/i);
  if (!m?.[1]) return null;
  const basename = path.basename(m[1]);
  const fullPath = path.join(anexosDir, basename);
  return existsSync(fullPath) ? fullPath : null;
}
