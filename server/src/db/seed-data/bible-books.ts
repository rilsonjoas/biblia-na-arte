export interface BibleBookSeed {
  name: string;
  /** Grafias alternativas encontradas no vault, pra normalizar na hora do parse. */
  aliases?: string[];
  slug: string;
  chapters: number;
  testament: 'old' | 'new';
}

// Cânone protestante completo (39 + 27 = 66 livros) — o bibleStructure.ts
// original do frontend só tinha 34 ("focusing on books with rich artistic
// traditions"), insuficiente pra migrar o vault real (~1000 pinturas
// cobrem praticamente todos os livros).
export const bibleBooksSeed: BibleBookSeed[] = [
  // Antigo Testamento
  { name: 'Gênesis', slug: 'genesis', chapters: 50, testament: 'old' },
  { name: 'Êxodo', slug: 'exodus', chapters: 40, testament: 'old' },
  { name: 'Levítico', slug: 'leviticus', chapters: 27, testament: 'old' },
  { name: 'Números', slug: 'numbers', chapters: 36, testament: 'old' },
  { name: 'Deuteronômio', slug: 'deuteronomy', chapters: 34, testament: 'old' },
  { name: 'Josué', slug: 'joshua', chapters: 24, testament: 'old' },
  { name: 'Juízes', slug: 'judges', chapters: 21, testament: 'old' },
  { name: 'Rute', slug: 'ruth', chapters: 4, testament: 'old' },
  { name: '1 Samuel', slug: '1-samuel', chapters: 31, testament: 'old' },
  { name: '2 Samuel', slug: '2-samuel', chapters: 24, testament: 'old' },
  { name: '1 Reis', slug: '1-kings', chapters: 22, testament: 'old' },
  { name: '2 Reis', slug: '2-kings', chapters: 25, testament: 'old' },
  { name: '1 Crônicas', slug: '1-chronicles', chapters: 29, testament: 'old' },
  { name: '2 Crônicas', slug: '2-chronicles', chapters: 36, testament: 'old' },
  { name: 'Esdras', slug: 'ezra', chapters: 10, testament: 'old' },
  { name: 'Neemias', slug: 'nehemiah', chapters: 13, testament: 'old' },
  { name: 'Ester', slug: 'esther', chapters: 10, testament: 'old' },
  { name: 'Jó', slug: 'job', chapters: 42, testament: 'old' },
  { name: 'Salmos', aliases: ['Salmo'], slug: 'psalms', chapters: 150, testament: 'old' },
  { name: 'Provérbios', slug: 'proverbs', chapters: 31, testament: 'old' },
  { name: 'Eclesiastes', slug: 'ecclesiastes', chapters: 12, testament: 'old' },
  { name: 'Cânticos', aliases: ['Cântico dos Cânticos', 'Cantares'], slug: 'song-of-songs', chapters: 8, testament: 'old' },
  { name: 'Isaías', slug: 'isaiah', chapters: 66, testament: 'old' },
  { name: 'Jeremias', slug: 'jeremiah', chapters: 52, testament: 'old' },
  { name: 'Lamentações', slug: 'lamentations', chapters: 5, testament: 'old' },
  { name: 'Ezequiel', slug: 'ezekiel', chapters: 48, testament: 'old' },
  { name: 'Daniel', slug: 'daniel', chapters: 12, testament: 'old' },
  { name: 'Oséias', aliases: ['Oseias'], slug: 'hosea', chapters: 14, testament: 'old' },
  { name: 'Joel', slug: 'joel', chapters: 3, testament: 'old' },
  { name: 'Amós', slug: 'amos', chapters: 9, testament: 'old' },
  { name: 'Obadias', slug: 'obadiah', chapters: 1, testament: 'old' },
  { name: 'Jonas', slug: 'jonah', chapters: 4, testament: 'old' },
  { name: 'Miquéias', slug: 'micah', chapters: 7, testament: 'old' },
  { name: 'Naum', slug: 'nahum', chapters: 3, testament: 'old' },
  { name: 'Habacuque', slug: 'habakkuk', chapters: 3, testament: 'old' },
  { name: 'Sofonias', slug: 'zephaniah', chapters: 3, testament: 'old' },
  { name: 'Ageu', slug: 'haggai', chapters: 2, testament: 'old' },
  { name: 'Zacarias', slug: 'zechariah', chapters: 14, testament: 'old' },
  { name: 'Malaquias', slug: 'malachi', chapters: 4, testament: 'old' },

  // Novo Testamento
  { name: 'Mateus', slug: 'matthew', chapters: 28, testament: 'new' },
  { name: 'Marcos', slug: 'mark', chapters: 16, testament: 'new' },
  { name: 'Lucas', slug: 'luke', chapters: 24, testament: 'new' },
  { name: 'João', slug: 'john', chapters: 21, testament: 'new' },
  { name: 'Atos', slug: 'acts', chapters: 28, testament: 'new' },
  { name: 'Romanos', slug: 'romans', chapters: 16, testament: 'new' },
  { name: '1 Coríntios', slug: '1-corinthians', chapters: 16, testament: 'new' },
  { name: '2 Coríntios', slug: '2-corinthians', chapters: 13, testament: 'new' },
  { name: 'Gálatas', slug: 'galatians', chapters: 6, testament: 'new' },
  { name: 'Efésios', slug: 'ephesians', chapters: 6, testament: 'new' },
  { name: 'Filipenses', slug: 'philippians', chapters: 4, testament: 'new' },
  { name: 'Colossenses', slug: 'colossians', chapters: 4, testament: 'new' },
  { name: '1 Tessalonicenses', slug: '1-thessalonians', chapters: 5, testament: 'new' },
  { name: '2 Tessalonicenses', slug: '2-thessalonians', chapters: 3, testament: 'new' },
  { name: '1 Timóteo', slug: '1-timothy', chapters: 6, testament: 'new' },
  { name: '2 Timóteo', slug: '2-timothy', chapters: 4, testament: 'new' },
  { name: 'Tito', slug: 'titus', chapters: 3, testament: 'new' },
  { name: 'Filemom', slug: 'philemon', chapters: 1, testament: 'new' },
  { name: 'Hebreus', slug: 'hebrews', chapters: 13, testament: 'new' },
  { name: 'Tiago', slug: 'james', chapters: 5, testament: 'new' },
  { name: '1 Pedro', slug: '1-peter', chapters: 5, testament: 'new' },
  { name: '2 Pedro', slug: '2-peter', chapters: 3, testament: 'new' },
  { name: '1 João', slug: '1-john', chapters: 5, testament: 'new' },
  { name: '2 João', slug: '2-john', chapters: 1, testament: 'new' },
  { name: '3 João', slug: '3-john', chapters: 1, testament: 'new' },
  { name: 'Judas', slug: 'jude', chapters: 1, testament: 'new' },
  { name: 'Apocalipse', slug: 'revelation', chapters: 22, testament: 'new' },
];

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const lookup = new Map<string, BibleBookSeed>();
for (const book of bibleBooksSeed) {
  lookup.set(normalize(book.name), book);
  for (const alias of book.aliases ?? []) lookup.set(normalize(alias), book);
}

/** Resolve um nome de livro (como aparece no vault, com variação de acento/grafia) pro registro canônico. */
export function resolveBibleBook(rawName: string): BibleBookSeed | undefined {
  return lookup.get(normalize(rawName));
}
