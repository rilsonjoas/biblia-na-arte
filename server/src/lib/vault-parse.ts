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
  // "Onde ver pessoalmente" (roadmap Fase 5) — texto livre, ex.
  // "Cleveland Museum of Art, Cleveland, EUA". Opcional.
  localizacao?: string;
  // Link da página oficial do museu/acervo/Wikidata pra obra — fonte
  // primária de citação. Alimenta o link "fonte oficial" ao lado de
  // "Onde ver" na UI. Achado 2026-09-01: o comentário original desta
  // interface já suspeitava que isso "nunca era populado pelo pipeline"
  // — a causa era o nome do campo: declarado aqui como `fonte`, mas o
  // campo real usado em toda nota do vault sempre foi `fonte_localizacao`.
  // Corrigido pra bater com a realidade — 869 de 904 obras passaram a
  // exportar sourceUrl (eram só 10, as poucas notas que por acaso usavam
  // o nome errado).
  fonte_localizacao?: string;
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
  const match = content.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
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
/** Detecta "conteúdo" que na verdade não é descrição nenhuma — nota-stub
 * genuína (seção vazia, capturando só o "---" do divisor seguinte por
 * causa do `\s*` guloso do regex principal) ou placeholder de navegação
 * interna do Obsidian ("Ver [[Livro]], [[Livro Capítulo]]."). Achado real
 * 2026-08-16, testando descrições curtas em produção: sem essa checagem,
 * 29 obras mostravam literalmente "---" como descrição, e ~138 mostravam
 * o placeholder de navegação cru. */
function isPlaceholderText(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/^-{2,}$/.test(t)) return true;
  if (/^Ver\s+(\[\[[^\]]+\]\](,\s*)?)+\.?$/i.test(t)) return true;
  if (/^#{1,6}\s/.test(t)) return true;
  return false;
}

/** Desembrulha wikilinks do Obsidian pra markdown limpo (ex: [[João 8]] ->
 *  João 8) — sem isso, `[[...]]` vaza cru pra tela: o `Markdown.tsx` do
 *  frontend só sabe renderizar markdown padrão, não sintaxe do Obsidian.
 *  Achado 2026-08-23: já existia só dentro de `extractPassageText`, mas
 *  o mesmo problema afeta qualquer texto livre em prosa que cite algo
 *  entre colchetes duplos (ex. "Saudade" do Almeida Júnior cita
 *  `[[C. S. Lewis]]` na própria Descrição da Obra) — extraído aqui pra
 *  reusar em toda função de extração de texto livre, não só citações. */
function unwrapWikilinks(text: string): string {
  // [[Nota Real|Texto Exibido]] -> Texto Exibido (achado 2026-08-23: sem
  // isso, a nota de "O Erguimento da Cruz" mostrava
  // "Rembrandt van Rijn - A Descida da Cruz (De kruisafname)|A Descida da
  // Cruz" cru na tela — só a barra ficava clara, não a intenção do alias).
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => alias ?? target);
}

// Frases que só aparecem em texto promocional/legenda de terceiros colado
// sem querer numa nota (site de venda de reprodução, agregador de museu) —
// nunca em prosa própria escrita pra este projeto.
const BAD_LINE_MARKERS = [
  'meisterdrucke',
  'fine art print',
  'gallerix.org',
  'image resolution',
  'artsandculture.google.com',
  'google arts & culture',
  'is pleased to',
  'scholarship and research',
];

function isBadLine(line: string): boolean {
  const l = line.toLowerCase();
  if (BAD_LINE_MARKERS.some((marker) => l.includes(marker))) return true;
  if (l.includes('buy ') && l.includes('as fine art')) return true;
  return false;
}

/** Sanitiza descrições removendo blocos promocionais colados sem querer de
 *  sites de terceiros (venda de reprodução, agregador de museu como Google
 *  Arts & Culture) e comentários editoriais internos.
 *
 *  Achado real 2026-08-23: a versão anterior usava uma regex só pra achar
 *  blocos `> [!info]` inteiros, mas ela só removia a PRIMEIRA linha do
 *  callout quando ele tinha várias linhas de blockquote seguidas (`> ...`
 *  em cada linha) — o resto ficava órfão e vazava pro site (achado pelo
 *  Rilson: "O Faraó e as parteiras" mostrando o aviso do Google Arts &
 *  Culture completo na página). Reescrito linha por linha: qualquer linha
 *  dentro de um bloco `> [!tipo]` é removida até a primeira linha que não
 *  começa com `>` (fim do blockquote) — funciona com qualquer número de
 *  linhas, não só uma. */
export function sanitizeDescription(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const kept: string[] = [];
  let i = 0;

  // Frase de abertura marcada como aside editorial — achado real
  // 2026-08-23: "**Nota enriquecida em...**", "**Correção de dado/
  // referência (...)**", vazando pro site em várias notas (algumas
  // escritas nesta sessão, outras de sessões anteriores). Essas etiquetas
  // descrevem o HISTÓRICO DE EDIÇÃO da nota, não a obra — nunca devem
  // chegar ao visitante do site. Remove só a frase da etiqueta (até o
  // primeiro ". "), não o parágrafo inteiro: em vários casos reais a
  // etiqueta abre o MESMO parágrafo que já tem conteúdo real da obra
  // logo em seguida (ex.: "**Nota enriquecida...** — ...sem citação.
  // Óleo sobre tela de Jan Steen..." — só a 1ª frase é lixo).
  const META_ASIDE_RE = /^>?\s*\*\*(Nota|Correção|Achado|Atualização|Editorial)\b[^.]*\.\s*/i;

  // Achado 2026-09-01 (Rilson, produção): a linha "*Fonte: [Título](url)*"
  // que toda nota tem no fim de "Descrição da Obra" vazava direto pro
  // campo `description` do site — virava um link solto no meio do texto
  // corrido, sem nenhum destaque visual. É informação redundante: o site
  // já tem `sourceUrl`/`fonte_localizacao` como campo próprio, com seu
  // próprio botão dedicado ("Ver Fonte Original do Museu") — a linha
  // dentro da prosa nunca deveria ter chegado ao visitante.
  // Prefixo simples, não a estrutura inteira do link: URLs com parênteses
  // internos (comum em desambiguação da Wikipedia, ex. "..._(Rembrandt)")
  // quebravam um regex que tentava casar `[texto](url)` por completo, e
  // citações com mais de 1 link ("Fonte: [A](url) / [B](url)") ou texto
  // extra depois do link (", crédito Tate Collections") escapavam também
  // (achado ao rodar o export de verdade: 14 obras ainda vazavam a linha
  // depois do fix "completo" original). Qualquer linha que COMECE com
  // "Fonte:" é sempre só a citação, nunca mais nada — corta a linha
  // inteira sem tentar entender o que vem depois.
  const FONTE_LINE_RE = /^\*?Fonte:/i;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (FONTE_LINE_RE.test(trimmed)) {
      i++;
      continue;
    }

    if (META_ASIDE_RE.test(trimmed)) {
      // Remove a etiqueta E o `>` de blockquote que porventura vier junto —
      // o que sobrar não é mais "uma citação", é prosa normal que só
      // compartilhava linha com a etiqueta.
      const strippedLine = trimmed.replace(META_ASIDE_RE, '');
      if (strippedLine.trim() !== '') kept.push(strippedLine);
      i++;
      continue;
    }

    if (/^>\s*\[!\w+\]/.test(trimmed)) {
      // Bloco de callout Obsidian inteiro: a linha [!tipo] + todas as
      // linhas seguintes que continuam com `>`. Junta o bloco INTEIRO
      // antes de decidir se é lixo — checar só a 1ª linha deixava
      // passar blocos onde o marcador só aparece numa linha de baixo
      // (achado real 2026-08-23: "★ Image resolution..." e o link do
      // gallerix.org vinham depois da linha de título do callout).
      let j = i + 1;
      while (j < lines.length && (lines[j] ?? '').trim().startsWith('>')) j++;
      const block = lines.slice(i, j).join('\n');
      if (!isBadLine(block)) kept.push(...lines.slice(i, j));
      i = j;
      continue;
    }

    if (isBadLine(trimmed)) {
      i++;
      continue;
    }
    // Comentário Obsidian %%...%% usado como anotação editorial interna —
    // nunca deve aparecer no site público.
    if (/^%%[\s\S]*%%$/.test(trimmed)) {
      i++;
      continue;
    }

    kept.push(line);
    i++;
  }

  return kept
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, '') // comentários HTML, mesma lógica
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractHistoricalContext(content: string): string | null {
  const afterFrontmatter = content.replace(/^---\n[\s\S]*?\n---/, '').trim();
  const histMatch = afterFrontmatter.match(/###\s*Contexto Histórico\s*\n+([\s\S]*?)(?=\n---|\n###|$)/i);
  const captured = histMatch?.[1]?.trim();
  if (captured && !isPlaceholderText(captured)) {
    return sanitizeDescription(unwrapWikilinks(captured)).slice(0, 2000);
  }
  return null;
}

export function extractDescription(content: string): string {
  const afterFrontmatter = content.replace(/^---\n[\s\S]*?\n---/, '').trim();
  const descMatch = afterFrontmatter.match(/###\s*Descrição da Obra\s*\n+([\s\S]*?)(?=\n---|\n###|$)/);
  let captured = descMatch?.[1]?.trim();

  if (!captured || isPlaceholderText(captured)) {
    const withoutImage = afterFrontmatter.replace(/!\[\[[^\]]+\]\]/, '').trim();
    const firstParagraph = withoutImage
      .split(/\n{2,}/)
      .find((p) => p.trim().length > 20 && !isPlaceholderText(p.trim()));
    captured = firstParagraph ?? '';
  }

  let fullDesc = sanitizeDescription(unwrapWikilinks(captured));
  const hist = extractHistoricalContext(content);
  if (hist && !fullDesc.includes(hist)) {
    fullDesc = `${fullDesc}\n\n### Contexto Histórico\n\n${hist}`;
  }

  return fullDesc.slice(0, 4000);
}

export interface ExtractedQuote {
  bookName?: string | undefined;
  chapter?: number | undefined;
  verse?: string | undefined;
  text: string;
}

export function extractPassageQuotes(content: string): ExtractedQuote[] {
  const match = content.match(/###\s*(?:📖\s*)?Contexto Bíblico\s*\n+([\s\S]*?)(?=\n---|\n###|$)/i);
  if (!match?.[1]) return [];

  const section = match[1].trim();
  if (!section || section.startsWith('Ver [[')) return [];

  const rawBlocks = section.split(/\n{2,}/);
  const quotes: ExtractedQuote[] = [];

  for (const block of rawBlocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const quoteLines: string[] = [];
    let citeLine = '';

    for (const l of lines) {
      const clean = l.replace(/^>\s?/, '');
      if (clean.startsWith('—') || clean.startsWith('- **') || clean.startsWith('**')) {
        citeLine = clean;
      } else if (l.startsWith('>')) {
        quoteLines.push(clean);
      }
    }

    const text = quoteLines.join('\n').trim();
    if (text) {
      let citeBook: string | undefined;
      let citeChapter: number | undefined;
      let citeVerse: string | undefined;

      if (citeLine) {
        const m = citeLine.match(/(?:—|-|\*\*)\s*(?:\[\[)?([123]?\s*[A-ZÀ-Úa-zà-ú\s]+?)\s+(\d+)(?:\]\])?:?\s*[:.]\s*([\d\-,]+)/);
        if (m && m[1] && m[2]) {
          citeBook = m[1].trim();
          citeChapter = parseInt(m[2], 10);
          citeVerse = m[3]?.trim();
        }
      }

      quotes.push({
        bookName: citeBook,
        chapter: citeChapter,
        verse: citeVerse,
        text: unwrapWikilinks(text),
      });
    }
  }

  return quotes;
}

/** "Gênesis 18" -> {book: "Gênesis", chapter: 18}
 *  "Gênesis 18:1-15" -> {book: "Gênesis", chapter: 18, verse: "1-15"}
 *  "Jó 2:1"     -> {book: "Jó", chapter: 2, verse: "1"}
 *  "1 Samuel 17" -> {book: "1 Samuel", chapter: 17}          */
export function parseChapterLink(raw: unknown): { book: string; chapter: number; verse?: string } | null {
  const inner = extractWikilink(raw);
  const m = inner.match(/^(.+?)\s+(\d+)(?:[:\s]+([\d\-,]+))?$/);
  if (!m) return null;
  const book = m[1]?.trim();
  const chapter = m[2] ? Number(m[2]) : NaN;
  if (!book || !Number.isInteger(chapter) || chapter <= 0) return null;
  const verse = m[3]?.trim();
  const result: { book: string; chapter: number; verse?: string } = { book, chapter };
  if (verse) result.verse = verse;
  return result;
}

/** Tenta extrair a faixa de versículos (ex: "16-28" ou "1-5") da nota
 *  quando o frontmatter da nota especificou apenas o livro e capítulo.
 *  Procura tanto na seção "Contexto Bíblico" quanto na "Descrição da Obra". */
export function extractVerseFromContext(content: string, bookName: string, chapter: number): string | undefined {
  if (!content || !bookName || !chapter) return undefined;

  const sectionMatch = content.match(/###\s*(?:📖\s*)?Contexto Bíblico\s*\n+([\s\S]*?)(?=\n---|\n###|$)/i);
  const searchArea = sectionMatch?.[1] ? sectionMatch[1] : content;

  const escapedBook = bookName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

  const patterns = [
    new RegExp(`(?:\\*\\*|\\[\\[)?${escapedBook}\\s+${chapter}(?:\\]\\]|\\*\\*)?:?\\s*[:.]\\s*([\\d\\-,]+)`, 'i'),
    new RegExp(`(?:\\*\\*|\\[\\[)?${escapedBook}\\s+${chapter}\\s+v{1,2}\\.?\\s*([\\d\\-,]+)`, 'i'),
    new RegExp(`(?:vv?\\.?\\s*|versícu?l?o?s?\\s*)([\\d\\-,]+)`, 'i'),
  ];

  for (const reg of patterns) {
    const vm = searchArea.match(reg);
    if (vm?.[1]?.trim()) {
      return vm[1].trim();
    }
  }

  return undefined;
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

/** "Vozes dos clássicos" (roadmap Fase 5, 2026-08-23) — extrai a seção
 *  opcional "### Na leitura de {Autor}", onde Rookmaaker/Schaeffer/Lewis
 *  já comentaram (com fonte verificada, citação breve) a obra específica
 *  da nota. Curadoria de profundidade, não de escala: a maioria das notas
 *  não tem essa seção, e não deveria — só entra onde a fonte é real. */
export function extractClassicCommentary(content: string): { author: string; text: string } | null {
  const match = content.match(/###\s*Na leitura de\s+(.+?)\s*\n+([\s\S]*?)(?=\n---|\n###|$)/);
  if (!match?.[1] || !match[2]) return null;

  const author = unwrapWikilinks(match[1].trim());
  const text = match[2].trim();
  if (!author || !text || isPlaceholderText(text)) return null;

  return { author, text: unwrapWikilinks(text).slice(0, 4000) };
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

  const cleaned = unwrapWikilinks(quotes.join('\n\n'))
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

