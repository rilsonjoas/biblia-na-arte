import { parseLectionaryRef, type ParsedLectionaryRef } from './lectionary-refs.js';

/** "Pintura do Dia" nunca repete obra dentro desta janela (dias). Decisão de
 *  2026-09-29, depois de a mesma pintura sair 2 dias seguidos (28 e 29/09,
 *  Êxodo 18 tinha 1 obra só): simulado sobre o calendário completo de
 *  2026-2028, 30 dias troca ~11% dos dias e só ~7% saem do capítulo da
 *  leitura, sem cair no sorteio global. */
export const DAILY_NO_REPEAT_WINDOW_DAYS = 30;

/** Pools já buscados no banco (ids de obras ativas e com imagem, ordenados
 *  por id) — o módulo é puro pra dar pra testar o calendário inteiro sem
 *  banco. `themedIds` é o subconjunto com tema da estação litúrgica. */
export interface DailyPoolLookups {
  chapterPools: ReadonlyMap<string, readonly string[]>;
  bookPools: ReadonlyMap<string, readonly string[]>;
  themedIds?: ReadonlySet<string>;
}

/** Mesmo algoritmo de hash de data usado no Lecionário e no Gerador C.S.
 *  Lewis — replicado de propósito pra manter a seleção diária determinística
 *  igual em todo o cluster. NÃO mudar: trocaria a obra de dias que já estão
 *  certos (ver teste que fixa os valores). */
export function getDateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function chapterKey(bookSlug: string, chapter: number): string {
  return `${bookSlug}|${chapter}`;
}

/** Capítulos únicos e livros, na ordem das leituras do dia — o que a camada
 *  de banco precisa buscar. Referências que não reconhece (deuterocanônicos)
 *  são ignoradas, como sempre. */
export function parseDayRefs(refs: readonly string[]): { chapters: ParsedLectionaryRef[]; books: string[] } {
  const chapters: ParsedLectionaryRef[] = [];
  const seen = new Set<string>();
  const books: string[] = [];

  for (const ref of refs) {
    const parsed = parseLectionaryRef(ref);
    if (!parsed) continue;
    const key = chapterKey(parsed.bookSlug, parsed.chapter);
    if (!seen.has(key)) {
      seen.add(key);
      chapters.push(parsed);
    }
    if (!books.includes(parsed.bookSlug)) books.push(parsed.bookSlug);
  }

  return { chapters, books };
}

function union(pools: readonly (readonly string[])[]): string[] {
  return [...new Set(pools.flat())];
}

/** Candidatas do dia, da mais ligada à leitura pra menos:
 *  0. maior pool entre as leituras (mesmo critério de antes: o primeiro com
 *     3+ obras encerra a busca), refinado pelo tema da estação quando sobra
 *     alguma obra;
 *  1. obras de todas as leituras do dia;
 *  2. obras dos livros das leituras;
 *  3. acervo inteiro.
 *  Sem nenhuma obra nas leituras, só o acervo inteiro (sorteio, como antes). */
export function buildDailyTiers(
  refs: readonly string[],
  lookups: DailyPoolLookups,
  globalPool: readonly string[],
): string[][] {
  const { chapters, books } = parseDayRefs(refs);
  const pools = chapters.map((c) => lookups.chapterPools.get(chapterKey(c.bookSlug, c.chapter)) ?? []);

  let best: readonly string[] = [];
  for (const pool of pools) {
    if (pool.length > best.length) best = pool;
    if (best.length >= 3) break;
  }
  if (best.length === 0) return [[...globalPool]];

  let tier0 = [...best];
  if (lookups.themedIds) {
    const themed = tier0.filter((id) => lookups.themedIds!.has(id));
    if (themed.length > 0) tier0 = themed;
  }

  return [
    tier0,
    union(pools),
    union(books.map((b) => lookups.bookPools.get(b) ?? [])),
    [...globalPool],
  ];
}

/** Primeira candidata, a partir da posição do seed, que não saiu na janela.
 *  Se tudo já saiu (acervo minúsculo), devolve a do seed no primeiro tier não
 *  vazio — nunca deixa o dia sem obra. `undefined` só sem obra nenhuma. */
export function pickDailyArtworkId(
  seed: number,
  tiers: readonly (readonly string[])[],
  recentIds: ReadonlySet<string>,
): string | undefined {
  for (const tier of tiers) {
    for (let k = 0; k < tier.length; k++) {
      const candidate = tier[(seed + k) % tier.length]!;
      if (!recentIds.has(candidate)) return candidate;
    }
  }

  const firstNonEmpty = tiers.find((tier) => tier.length > 0);
  return firstNonEmpty?.[seed % firstNonEmpty.length];
}
