import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  toBibleApiReference,
  mapBiblePassage,
  fetchBiblePassage,
  getCachedPassage,
  clearPassageCache,
  BibleTextNotFoundError,
  BibleTextUpstreamError,
  type BiblePassage,
} from './bible-api.js';

const UPSTREAM_PAYLOAD = {
  reference: 'Lucas 10',
  verses: [
    { book_id: 'luk', book_name: 'Lucas', chapter: 10, verse: 1, text: 'Depois disto...' },
    { book_id: 'luk', book_name: 'Lucas', chapter: 10, verse: 2, text: 'E dizia-lhes...' },
  ],
  translation_id: 'almeida',
  translation_name: 'João Ferreira de Almeida',
};

afterEach(() => {
  vi.unstubAllGlobals();
  clearPassageCache();
});

function stubFetchOk(payload: unknown = UPSTREAM_PAYLOAD) {
  const fetchImpl = vi.fn(async () =>
    new Response(JSON.stringify(payload), { status: 200 }),
  );
  return fetchImpl;
}

describe('toBibleApiReference', () => {
  it('usa o nome português da tradução Almeida', () => {
    expect(toBibleApiReference('genesis', 1)).toBe('genesis+1');
    expect(toBibleApiReference('psalms', 23)).toBe('salmos+23');
    expect(toBibleApiReference('ecclesiastes', 3)).toBe('eclesiastes+3');
    expect(toBibleApiReference('song-of-songs', 2)).toBe('cantares+2');
    expect(toBibleApiReference('1-kings', 17)).toBe('1+reis+17');
    expect(toBibleApiReference('judges', 1)).toBe('juízes+1');
  });

  it('cai no fallback em inglês para slugs desconhecidos', () => {
    expect(toBibleApiReference('foobar', 1)).toBe('foobar+1');
  });
});

describe('mapBiblePassage', () => {
  it('mapeia o payload do upstream para o formato da API', () => {
    const passage = mapBiblePassage(UPSTREAM_PAYLOAD, 'luke', 10);
    expect(passage).toEqual({
      reference: 'Lucas 10',
      translation: 'João Ferreira de Almeida',
      bookSlug: 'luke',
      chapter: 10,
      verses: [
        { verse: 1, text: 'Depois disto...' },
        { verse: 2, text: 'E dizia-lhes...' },
      ],
    });
  });
});

describe('fetchBiblePassage', () => {
  it('busca no upstream e monta a URL correta', async () => {
    const fetchImpl = stubFetchOk();
    const passage = await fetchBiblePassage('luke', 10, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://bible-api.com/lucas+10?translation=almeida',
    );
    expect(passage.verses).toHaveLength(2);
  });

  it('usa o cache em memória sem bater de novo no upstream', async () => {
    const fetchImpl = stubFetchOk();
    await fetchBiblePassage('luke', 10, fetchImpl);
    await fetchBiblePassage('luke', 10, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(getCachedPassage('luke', 10)).toBeDefined();
  });

  it('lança BibleTextNotFoundError em 404 do upstream', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 404 }));
    await expect(fetchBiblePassage('xyz', 1, fetchImpl)).rejects.toBeInstanceOf(
      BibleTextNotFoundError,
    );
  });

  it('lança BibleTextUpstreamError em erro de rede', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(fetchBiblePassage('luke', 10, fetchImpl)).rejects.toBeInstanceOf(
      BibleTextUpstreamError,
    );
  });

  it('lança BibleTextUpstreamError em resposta sem verses', async () => {
    const fetchImpl = stubFetchOk({ reference: 'Lucas 10', error: 'algo' });
    await expect(fetchBiblePassage('luke', 10, fetchImpl)).rejects.toBeInstanceOf(
      BibleTextNotFoundError,
    );
  });

  it('valida o tipo de retorno para consumidores com TS', async () => {
    const fetchImpl = stubFetchOk();
    const passage: BiblePassage = await fetchBiblePassage('luke', 10, fetchImpl);
    expect(passage.chapter).toBe(10);
  });
});
