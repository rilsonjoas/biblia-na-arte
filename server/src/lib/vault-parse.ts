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

/** Remove o número desambiguador que o vault acrescenta quando há mais de
 *  uma obra com o mesmo título ("O bom samaritano 2" -> "O bom samaritano").
 *  Só mexe em números de 1-2 dígitos no fim — anos de 4 dígitos ("...em
 *  1500") e títulos como "Salmo 148" ficam intactos. */
function stripTrailingNumber(value: string): string {
  return value.replace(/\s+(\d{1,2})\s*$/, '').trim();
}

/** Separa o título da obra do título original do pintor (entre parênteses no
 *  nome do arquivo) e remove o número desambiguador. O desambiguador pode
 *  aparecer no fim do título ("O bom samaritano 2"), depois do parêntese
 *  ("A Ceia em Emaús (De maaltijd te Emmaüs) 2") ou dentro dele
 *  ("O bom samaritano (The Good Samaritan 2)") — em todos os casos a
 *  desambiguação final é por ano (frontmatter), não pelo número do arquivo.
 *
 *  "O bom samaritano (The Good Samaritan 2)" -> { title: "O bom samaritano", subtitle: "The Good Samaritan" }
 *  "A Ceia em Emaús (De maaltijd te Emmaüs) 2" -> { title: "A Ceia em Emaús", subtitle: "De maaltijd te Emmaüs" }
 *  "O bom samaritano 2" -> { title: "O bom samaritano", subtitle: undefined }
 *  "José explica o sonho do Faraó" -> { title: "José explica o sonho do Faraó", subtitle: undefined }
 */
export function parseTitleParts(rawTitle: string): { title: string; subtitle?: string } {
  const trimmed = rawTitle.trim();
  const parenMatch = trimmed.match(/^(.*?)\s*\(([^()]*)\)\s*(\d{1,2})?$/);
  if (parenMatch?.[1] && parenMatch[2] !== undefined) {
    const title = stripTrailingNumber(parenMatch[1]) || trimmed;
    const subtitle = stripTrailingNumber(parenMatch[2]);
    // "(O bezerro de ouro)" repetindo o título não é subtítulo — é ruído.
    return subtitle && subtitle !== title ? { title, subtitle } : { title };
  }
  return { title: stripTrailingNumber(trimmed) };
}

/** Extrai os trechos em citação (> ...) da seção "Contexto Bíblico".
 *  Ignora notas-stub do tipo "Ver [[Livro]]" e comentários teológicos abaixo das citações.
 *  Desembrulha wikilinks para formato markdown limpo (ex: [[João 8]] -> João 8).
 */
export function extractPassageText(content: string): string | null {
  const match = content.match(/###\s*(?:📖\s*)?Contexto Bíblico\s*\n+([\s\S]*?)(?=\n---|\n###|$)/i);
  if (!match?.[1]) return null;

  const section = match[1].trim();
  if (!section || section.startsWith('Ver [[')) return null;

  const lines = section.split('\n');
  const quotes: string[] = [];
  let currentQuote: string[] = [];

  // Linha de citação de referência dentro do blockquote (ex.: "- **[[Gênesis
  // 33]]:1", sem fechar o **) — convenção usada em ~100 notas do vault pra
  // marcar de qual verso é a citação. É redundante com o capítulo já mostrado
  // como badge na página da obra, e o "**" sem fechar quebra a renderização
  // markdown (asteriscos literais aparecendo na tela). Descartada aqui, não
  // editando nota por nota. Achado real 2026-08-16, testando em produção.
  const isReferenceCitationLine = (text: string) => /^-\s*\*\*/.test(text);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      const inner = trimmed.replace(/^>\s?/, '');
      if (!isReferenceCitationLine(inner)) {
        currentQuote.push(inner);
      }
    } else if (trimmed === '' && currentQuote.length > 0) {
      quotes.push(currentQuote.join('\n'));
      currentQuote = [];
    } else if (trimmed !== '' && !trimmed.startsWith('>')) {
      // Linha de comentário pós-citação — interrompe a coleta de citações bíblicas
      if (currentQuote.length > 0) {
        quotes.push(currentQuote.join('\n'));
        currentQuote = [];
      }
      break;
    }
  }
  if (currentQuote.length > 0) {
    quotes.push(currentQuote.join('\n'));
  }

  if (quotes.length === 0) return null;

  const cleaned = quotes
    .join('\n\n')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\*\*([^*]+)\*\*:(\d+[\d\-,]*)/g, '**$1:$2**')
    .trim();

  return cleaned.length > 0 ? cleaned.slice(0, 3000) : null;
}

/** Procura a imagem embutida (`![[arquivo.jpg|600]]`) em 0 - Anexos. */
export function findImageFile(content: string, anexosDir: string): string | null {
  const m = content.match(/!\[\[([^\]|]+\.(?:jpe?g|png|gif|webp|svg))/i);
  if (!m?.[1]) return null;
  const basename = path.basename(m[1]);
  const fullPath = path.join(anexosDir, basename);
  return existsSync(fullPath) ? fullPath : null;
}

