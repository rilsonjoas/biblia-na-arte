import { describe, expect, it } from 'vitest';
import dailyReadingsRefs from '../data/daily-readings-refs.json' with { type: 'json' };
import {
  DAILY_NO_REPEAT_WINDOW_DAYS,
  buildDailyTiers,
  chapterKey,
  getDateSeed,
  parseDayRefs,
  pickDailyArtworkId,
  type DailyPoolLookups,
} from './daily-artwork.js';

const none = new Set<string>();

describe('getDateSeed', () => {
  // Valores calculados com a função original de queries.ts: o seed não pode
  // mudar, senão troca a obra de dias que hoje já estão certos.
  it('mantém os mesmos seeds da implementação anterior', () => {
    expect(getDateSeed('2026-09-28')).toBe(1161904127);
    expect(getDateSeed('2026-09-29')).toBe(1161904128);
    expect(getDateSeed('2026-10-02')).toBe(1162559461);
    expect(getDateSeed('2028-02-29')).toBe(1358264343);
  });
});

describe('pickDailyArtworkId', () => {
  it('sem obras recentes, devolve a do seed no primeiro tier', () => {
    const tier0 = ['a', 'b', 'c'];
    expect(pickDailyArtworkId(7, [tier0], none)).toBe('b'); // 7 % 3 = 1
  });

  it('rotaciona dentro do mesmo pool quando a do seed já saiu na janela', () => {
    const tier0 = ['a', 'b', 'c'];
    expect(pickDailyArtworkId(7, [tier0], new Set(['b']))).toBe('c');
    expect(pickDailyArtworkId(7, [tier0], new Set(['b', 'c']))).toBe('a');
  });

  it('pool de obra única já exibida cai no próximo tier (Êxodo 18, 28 e 29/09/2026)', () => {
    const exodo18 = ['jetro'];
    const outrasLeituras = ['jetro', 'salmo-42'];
    expect(pickDailyArtworkId(1161904128, [exodo18, outrasLeituras], new Set(['jetro']))).toBe('salmo-42');
  });

  it('percorre os tiers até o global', () => {
    const tiers = [['a'], ['a', 'b'], ['a', 'b', 'c'], ['a', 'b', 'c', 'd']];
    expect(pickDailyArtworkId(0, tiers, new Set(['a', 'b', 'c']))).toBe('d');
  });

  it('se tudo já saiu na janela, devolve a do seed no primeiro tier em vez de falhar', () => {
    const tiers = [['a', 'b'], ['a', 'b']];
    expect(pickDailyArtworkId(3, tiers, new Set(['a', 'b']))).toBe('b'); // 3 % 2 = 1
  });

  it('devolve undefined só quando não há obra nenhuma em nenhum tier', () => {
    expect(pickDailyArtworkId(3, [[], []], none)).toBeUndefined();
    expect(pickDailyArtworkId(3, [], none)).toBeUndefined();
  });
});

describe('parseDayRefs', () => {
  it('extrai capítulos únicos e livros na ordem das leituras, ignorando refs que não reconhece', () => {
    const parsed = parseDayRefs(['Salmo 42', 'Êxodo 18:1-12', 'Êxodo 18:13-27', 'Sabedoria 3:1-9', 'Filipenses 1:3-14']);
    expect(parsed.chapters).toEqual([
      { bookSlug: 'psalms', chapter: 42 },
      { bookSlug: 'exodus', chapter: 18 },
      { bookSlug: 'philippians', chapter: 1 },
    ]);
    expect(parsed.books).toEqual(['psalms', 'exodus', 'philippians']);
  });
});

function lookups(
  chapters: Record<string, string[]>,
  books: Record<string, string[]> = {},
  themedIds?: string[],
): DailyPoolLookups {
  return {
    chapterPools: new Map(Object.entries(chapters)),
    bookPools: new Map(Object.entries(books)),
    ...(themedIds ? { themedIds: new Set(themedIds) } : {}),
  };
}

describe('buildDailyTiers', () => {
  const global = ['g1', 'g2', 'g3'];

  it('tier 0 é o maior pool entre as leituras, mantendo o primeiro em caso de empate', () => {
    const l = lookups({
      [chapterKey('psalms', 42)]: ['p1', 'p2'],
      [chapterKey('exodus', 18)]: ['e1', 'e2'],
    });
    expect(buildDailyTiers(['Salmo 42', 'Êxodo 18:1-12'], l, global)[0]).toEqual(['p1', 'p2']);
  });

  it('para no primeiro pool com 3 ou mais obras, como a implementação anterior', () => {
    const l = lookups({
      [chapterKey('psalms', 42)]: ['p1', 'p2', 'p3'],
      [chapterKey('exodus', 18)]: ['e1', 'e2', 'e3', 'e4', 'e5'],
    });
    expect(buildDailyTiers(['Salmo 42', 'Êxodo 18:1-12'], l, global)[0]).toEqual(['p1', 'p2', 'p3']);
  });

  it('sem nenhuma obra nas leituras, o único tier é o global (sorteio como antes)', () => {
    const l = lookups({}, { exodus: ['e1'] });
    expect(buildDailyTiers(['Êxodo 18:1-12'], l, global)).toEqual([global]);
  });

  it('sem entrada do Lecionário (refs vazias), o único tier é o global', () => {
    expect(buildDailyTiers([], lookups({}), global)).toEqual([global]);
  });

  it('tier 1 reúne as obras de todas as leituras do dia; tier 2, as dos livros; tier 3, o global', () => {
    const l = lookups(
      {
        [chapterKey('psalms', 42)]: ['p1'],
        [chapterKey('exodus', 18)]: ['e1'],
        [chapterKey('philippians', 1)]: ['f1'],
      },
      { psalms: ['p1', 'p9'], exodus: ['e1', 'e7'], philippians: ['f1'] },
    );
    const tiers = buildDailyTiers(['Salmo 42', 'Êxodo 18:1-12', 'Filipenses 1:3-14'], l, global);
    expect(tiers[0]).toEqual(['p1']);
    expect(tiers[1]).toEqual(['p1', 'e1', 'f1']);
    expect(tiers[2]).toEqual(['p1', 'p9', 'e1', 'e7', 'f1']);
    expect(tiers[3]).toEqual(global);
  });

  it('filtro de tema restringe o tier 0 quando sobra alguma obra', () => {
    const l = lookups({ [chapterKey('john', 1)]: ['j1', 'j2', 'j3'] }, {}, ['j2']);
    expect(buildDailyTiers(['João 1:1-14'], l, global)[0]).toEqual(['j2']);
  });

  it('filtro de tema que zeraria o pool é ignorado', () => {
    const l = lookups({ [chapterKey('john', 1)]: ['j1', 'j2'] }, {}, ['outra-obra']);
    expect(buildDailyTiers(['João 1:1-14'], l, global)[0]).toEqual(['j1', 'j2']);
  });
});

describe('invariante sobre o calendário litúrgico completo', () => {
  // Pools sintéticos com a distribuição de produção: a maioria dos capítulos
  // tem 1 obra (174 de 380 em 29/09/2026), o resto 2 a 5.
  function poolSizeFor(key: string): number {
    let h = 0;
    for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const r = h % 100;
    if (r < 46) return 1;
    if (r < 63) return 2;
    if (r < 75) return 3;
    if (r < 81) return 4;
    return 5;
  }
  const chapterPool = (key: string) => Array.from({ length: poolSizeFor(key) }, (_, i) => `${key}#${i}`);
  const globalPool = Array.from({ length: 1000 }, (_, i) => `global#${String(i).padStart(4, '0')}`);

  const entries = Object.entries(dailyReadingsRefs as Record<string, { season: string; refs: string[] }>)
    .filter(([date]) => date >= '2026-09-01' && date <= '2028-11-29')
    .sort(([a], [b]) => a.localeCompare(b));

  function simulate(windowDays: number): string[] {
    const history: string[] = [];
    for (const [date, entry] of entries) {
      const { chapters, books } = parseDayRefs(entry.refs);
      const chapterPools = new Map(chapters.map((c) => [chapterKey(c.bookSlug, c.chapter), chapterPool(chapterKey(c.bookSlug, c.chapter))]));
      const bookPools = new Map(
        books.map((b) => [
          b,
          [...new Set(chapters.filter((c) => c.bookSlug === b).flatMap((c) => chapterPool(chapterKey(c.bookSlug, c.chapter))))],
        ]),
      );
      const tiers = buildDailyTiers(entry.refs, { chapterPools, bookPools }, globalPool);
      // slice(-0) devolveria o histórico inteiro, não vazio.
      const recent = new Set(windowDays > 0 ? history.slice(-windowDays) : []);
      const id = pickDailyArtworkId(getDateSeed(date), tiers, recent);
      if (!id) throw new Error(`sem obra em ${date}`);
      history.push(id);
    }
    return history;
  }

  it(`nunca repete obra dentro de ${DAILY_NO_REPEAT_WINDOW_DAYS} dias em todo o calendário`, () => {
    const picks = simulate(DAILY_NO_REPEAT_WINDOW_DAYS);
    expect(picks.length).toBeGreaterThan(700);
    const violations: string[] = [];
    picks.forEach((id, i) => {
      const from = Math.max(0, i - DAILY_NO_REPEAT_WINDOW_DAYS);
      if (picks.slice(from, i).includes(id)) violations.push(`${entries[i]![0]}: ${id}`);
    });
    expect(violations).toEqual([]);
  });

  it('contraprova: sem janela, o mesmo calendário repete obra em dias seguidos (o bug de 28 e 29/09)', () => {
    const picks = simulate(0);
    const consecutive = picks.filter((id, i) => i > 0 && picks[i - 1] === id).length;
    expect(consecutive).toBeGreaterThan(0);
  });

  it('a janela de 30 dias é o valor de produção', () => {
    expect(DAILY_NO_REPEAT_WINDOW_DAYS).toBe(30);
  });
});
