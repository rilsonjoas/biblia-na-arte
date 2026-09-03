import dailyReadingsRefs from '../data/daily-readings-refs.json' with { type: 'json' };

/** Tabela `{data ISO: referências do dia}` gerada a partir do Lecionário
 *  (`lecionario-web/src/lib/liturgical-calendar.ts` + `rcl-fetcher.ts`,
 *  script `scripts/gen-daily-refs.ts` naquele repo) — não é derivada
 *  aqui porque calcular o calendário litúrgico de verdade (Páscoa móvel,
 *  ciclo A/B/C por ano) é lógica não-trivial que já existe testada do
 *  outro lado; copiar o RESULTADO evita duplicar essa conta. Cobre
 *  domingos/festas até 2030-11-24 e dias de semana até 2028-11-29 (ver
 *  ROADMAP "Pintura do Dia sumindo..." 2026-09-02) — fora desse período,
 *  `getReferencesForDate` devolve `undefined` e quem chama cai pro
 *  sorteio aleatório de sempre. Ressincronizar copiando o arquivo de novo
 *  se o Lecionário estender as tabelas (não há pipeline automático — o
 *  calendário litúrgico é fixo, não muda com frequência que justifique
 *  isso). */
const READINGS_BY_DATE: Record<string, string[]> = dailyReadingsRefs;

export function getReferencesForDate(dateStr: string): string[] | undefined {
  return READINGS_BY_DATE[dateStr];
}

/** Espelha `lecionario-web/src/lib/bible-books.ts` (`BOOK_MAP`) — os
 *  slugs já batem exatamente com `bible_books.slug` daqui (confirmado
 *  contra a API de produção antes de copiar), então é colar e usar, sem
 *  tradução. Duplicado de propósito, mesmo padrão do
 *  `artwork-fetcher.ts` do Lecionário (dado/lógica pequena, sem pacote
 *  compartilhado entre os dois repos). Não cobre livros
 *  deuterocanônicos (Sabedoria, Eclesiástico...) — o catálogo do Bíblia
 *  na Arte é cânon protestante de 66 livros, não teria pool pra eles de
 *  qualquer forma. */
const BOOK_MAP: Record<string, string> = {
  Gênesis: 'genesis',
  Exodo: 'exodus',
  Êxodo: 'exodus',
  Levítico: 'leviticus',
  Números: 'numbers',
  Deuteronômio: 'deuteronomy',
  Josué: 'joshua',
  Juízes: 'judges',
  Rute: 'ruth',
  '1 Samuel': '1-samuel',
  '2 Samuel': '2-samuel',
  '1 Reis': '1-kings',
  '2 Reis': '2-kings',
  '1 Crônicas': '1-chronicles',
  '2 Crônicas': '2-chronicles',
  Esdras: 'ezra',
  Neemias: 'nehemiah',
  Ester: 'esther',
  Jó: 'job',
  Salmos: 'psalms',
  Salmo: 'psalms',
  Provérbios: 'proverbs',
  Eclesiastes: 'ecclesiastes',
  Cânticos: 'song-of-songs',
  Cantares: 'song-of-songs',
  Isaías: 'isaiah',
  Jeremias: 'jeremiah',
  Lamentações: 'lamentations',
  Ezequiel: 'ezekiel',
  Daniel: 'daniel',
  Oséias: 'hosea',
  Oseias: 'hosea',
  Joel: 'joel',
  Amós: 'amos',
  Obadias: 'obadiah',
  Jonas: 'jonah',
  Miquéias: 'micah',
  Naum: 'nahum',
  Habacuque: 'habakkuk',
  Sofonias: 'zephaniah',
  Ageu: 'haggai',
  Zacarias: 'zechariah',
  Malaquias: 'malachi',
  Mateus: 'matthew',
  Marcos: 'mark',
  Lucas: 'luke',
  João: 'john',
  Atos: 'acts',
  Romanos: 'romans',
  '1 Coríntios': '1-corinthians',
  '2 Coríntios': '2-corinthians',
  Gálatas: 'galatians',
  Efésios: 'ephesians',
  Filipenses: 'philippians',
  Colossenses: 'colossians',
  '1 Tessalonicenses': '1-thessalonians',
  '2 Tessalonicenses': '2-thessalonians',
  '1 Timóteo': '1-timothy',
  '2 Timóteo': '2-timothy',
  Tito: 'titus',
  Filemom: 'philemon',
  Hebreus: 'hebrews',
  Tiago: 'james',
  '1 Pedro': '1-peter',
  '2 Pedro': '2-peter',
  '1 João': '1-john',
  '2 João': '2-john',
  '3 João': '3-john',
  Judas: 'jude',
  Apocalipse: 'revelation',
};

const REF_PATTERN = /^(.+?)\s+(\d+)(?::(\S+))?/;

export interface ParsedLectionaryRef {
  bookSlug: string;
  chapter: number;
}

/** Extrai só livro+capítulo (o nível que o pool de obras usa) — mesmo
 *  regex do `reference-parser.ts` do Lecionário, mas sem o trecho de
 *  versículo: aqui não faz diferença, porque a curadoria do próprio
 *  Bíblia na Arte quase nunca registra versículo exato (ver ROADMAP),
 *  então o pool sempre cai pro nível de capítulo mesmo. */
export function parseLectionaryRef(ref: string): ParsedLectionaryRef | null {
  const match = ref.trim().match(REF_PATTERN);
  if (!match) return null;

  const rawBook = match[1];
  const rawChapter = match[2];
  if (!rawBook || !rawChapter) return null;

  const bookSlug = BOOK_MAP[rawBook];
  if (!bookSlug) return null;

  return { bookSlug, chapter: parseInt(rawChapter, 10) };
}
