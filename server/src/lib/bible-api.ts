// Proxy para a Bible-API (https://bible-api.com) — tradução João Ferreira
// de Almeida (domínio público), sem chave, com CORS. O servidor guarda um
// cache em memória (TTL 24h): o texto bíblico não muda, não tem por que
// bater no upstream a cada visita.
//
// Formato do upstream: GET https://bible-api.com/{livro}+{capitulo}?translation=almeida
// retorna { reference, verses: [{ book_id, book_name, chapter, verse, text }], ... }.

const UPSTREAM_BASE = 'https://bible-api.com';
const TRANSLATION_ID = 'almeida';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BiblePassage {
  reference: string;
  translation: string;
  bookSlug: string;
  chapter: number;
  verses: BibleVerse[];
}

export class BibleTextNotFoundError extends Error {
  constructor(reference: string) {
    super(`Texto não encontrado na tradução Almeida (${reference})`);
    this.name = 'BibleTextNotFoundError';
  }
}

export class BibleTextUpstreamError extends Error {
  readonly statusCode = 502;
  constructor(detail: string) {
    super(`Falha ao obter o texto bíblico: ${detail}`);
    this.name = 'BibleTextUpstreamError';
  }
}

// Slugs do vault são em inglês com hífen separando palavras. A tradução
// Almeida do bible-api.com usa NOMES PORTUGUESES de livro (ex.: "salmos",
// "eclesiastes", "1+reis") — nomes ingleses funcionam para alguns livros
// mas não todos ("psalms" e "ecclesiastes" dão 404). A tabela abaixo foi
// verificada livro a livro contra o upstream em 2026-08-07.
const ALMEIDA_BOOK_NAMES: Record<string, string> = {
  genesis: 'genesis',
  exodus: 'exodo',
  leviticus: 'levitico',
  numbers: 'numeros',
  deuteronomy: 'deuteronomio',
  joshua: 'josue',
  judges: 'juízes',
  ruth: 'rute',
  '1-samuel': '1+samuel',
  '2-samuel': '2+samuel',
  '1-kings': '1+reis',
  '2-kings': '2+reis',
  '1-chronicles': '1+cronicas',
  '2-chronicles': '2+cronicas',
  ezra: 'esdras',
  nehemiah: 'neemias',
  esther: 'ester',
  job: 'jo',
  psalms: 'salmos',
  proverbs: 'proverbios',
  ecclesiastes: 'eclesiastes',
  'song-of-songs': 'cantares',
  isaiah: 'isaias',
  jeremiah: 'jeremias',
  lamentations: 'lamentacoes',
  ezekiel: 'ezequiel',
  daniel: 'daniel',
  hosea: 'oseias',
  joel: 'joel',
  amos: 'amos',
  obadiah: 'obadias',
  jonah: 'jonas',
  micah: 'miqueias',
  nahum: 'naum',
  habakkuk: 'habacuc',
  zephaniah: 'sofonias',
  haggai: 'ageu',
  zechariah: 'zacarias',
  malachi: 'malaquias',
  matthew: 'mateus',
  mark: 'marcos',
  luke: 'lucas',
  john: 'joao',
  acts: 'atos',
  romans: 'romanos',
  '1-corinthians': '1+corintios',
  '2-corinthians': '2+corintios',
  galatians: 'galatas',
  ephesians: 'efesios',
  philippians: 'filipenses',
  colossians: 'colossenses',
  '1-thessalonians': '1+tessalonicenses',
  '2-thessalonians': '2+tessalonicenses',
  '1-timothy': '1+timoteo',
  '2-timothy': '2+timoteo',
  titus: 'tito',
  philemon: 'filemon',
  hebrews: 'hebreus',
  james: 'tiago',
  '1-peter': '1+pedro',
  '2-peter': '2+pedro',
  '1-john': '1+joao',
  '2-john': '2+joao',
  '3-john': '3+joao',
  jude: 'judas',
  revelation: 'apocalipse',
};

export function bibleApiBookName(bookSlug: string): string {
  return ALMEIDA_BOOK_NAMES[bookSlug] ?? bookSlug.replace(/-/g, '+');
}

export function toBibleApiReference(bookSlug: string, chapter: number): string {
  return `${bibleApiBookName(bookSlug)}+${chapter}`;
}

interface UpstreamVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface UpstreamResponse {
  reference: string;
  verses: UpstreamVerse[];
  translation_id?: string;
  translation_name?: string;
  error?: string;
}

export function mapBiblePassage(
  json: UpstreamResponse,
  bookSlug: string,
  chapter: number,
): BiblePassage {
  return {
    reference: json.reference,
    translation: json.translation_name ?? json.translation_id ?? 'Almeida',
    bookSlug,
    chapter,
    verses: json.verses.map((v) => ({ verse: Number(v.verse), text: v.text })),
  };
}

const cache = new Map<string, { expiresAt: number; passage: BiblePassage }>();

export function getCachedPassage(bookSlug: string, chapter: number): BiblePassage | undefined {
  const entry = cache.get(`${bookSlug}/${chapter}`);
  if (!entry || entry.expiresAt < Date.now()) return undefined;
  return entry.passage;
}

export async function fetchBiblePassage(
  bookSlug: string,
  chapter: number,
  fetchImpl: typeof fetch = fetch,
): Promise<BiblePassage> {
  const cached = getCachedPassage(bookSlug, chapter);
  if (cached) return cached;

  const reference = toBibleApiReference(bookSlug, chapter);
  const url = `${UPSTREAM_BASE}/${reference}?translation=${TRANSLATION_ID}`;

  let response: Response;
  try {
    response = await fetchImpl(url);
  } catch (error) {
    throw new BibleTextUpstreamError(error instanceof Error ? error.message : 'erro de rede');
  }

  if (response.status === 404) {
    throw new BibleTextNotFoundError(reference);
  }
  if (!response.ok) {
    throw new BibleTextUpstreamError(`HTTP ${response.status} do bible-api.com`);
  }

  let json: UpstreamResponse;
  try {
    json = (await response.json()) as UpstreamResponse;
  } catch (error) {
    throw new BibleTextUpstreamError('resposta inválida do bible-api.com');
  }

  if (!Array.isArray(json.verses)) {
    throw new BibleTextNotFoundError(reference);
  }

  const passage = mapBiblePassage(json, bookSlug, chapter);
  cache.set(`${bookSlug}/${chapter}`, { expiresAt: Date.now() + CACHE_TTL_MS, passage });
  return passage;
}

export function clearPassageCache() {
  cache.clear();
}
