import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from './api-client';
import {
  getArtworks,
  getArtworkById,
  getArtworksByBibleReference,
  searchArtworksAdvanced,
  parseYear,
  getBibleBooks,
  getBibleBookBySlug,
  getDailyArtwork,
  getThemes,
  getPeriods,
  todaySaoPaulo,
} from './api-data';

vi.mock('./api-client', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
  apiClient: {
    request: vi.fn(),
  },
}));

const requestMock = vi.mocked(apiClient.request);

beforeEach(() => {
  requestMock.mockReset();
});

describe('getArtworks', () => {
  it('busca o catálogo inteiro e devolve os items', async () => {
    requestMock.mockResolvedValue({ items: [{ id: '1' }], total: 1 });
    const result = await getArtworks();
    expect(result).toEqual([{ id: '1' }]);
    expect(requestMock).toHaveBeenCalledWith('/artworks', { limit: 1000 });
  });
});

describe('getArtworkById', () => {
  it('devolve a obra quando existe', async () => {
    requestMock.mockResolvedValue({ id: 'abc' });
    await expect(getArtworkById('abc')).resolves.toEqual({ id: 'abc' });
  });

  it('devolve undefined em 404', async () => {
    requestMock.mockRejectedValue(new ApiError(404, 'Obra não encontrada'));
    await expect(getArtworkById('nao-existe')).resolves.toBeNull();
  });

  it('propaga erros que não são 404', async () => {
    requestMock.mockRejectedValue(new ApiError(500, 'erro'));
    await expect(getArtworkById('abc')).rejects.toThrow('erro');
  });
});

describe('getDailyArtwork', () => {
  it('busca /artworks/daily sem data quando chamada sem argumento', async () => {
    requestMock.mockResolvedValue({ id: 'daily-1' });
    await expect(getDailyArtwork()).resolves.toEqual({ id: 'daily-1' });
    expect(requestMock).toHaveBeenCalledWith('/artworks/daily', { date: undefined });
  });

  it('repassa a data quando fornecida (uso de teste/verificação)', async () => {
    requestMock.mockResolvedValue({ id: 'daily-2' });
    await getDailyArtwork('2026-08-23');
    expect(requestMock).toHaveBeenCalledWith('/artworks/daily', { date: '2026-08-23' });
  });
});

describe('todaySaoPaulo', () => {
  it('devolve data no formato YYYY-MM-DD', () => {
    expect(todaySaoPaulo()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('nunca fica à frente da data UTC (achado real 03/09/2026 — ver ROADMAP)', () => {
    // São Paulo é sempre UTC-3, então a data local nunca pode ser DEPOIS
    // da data UTC no mesmo instante — só igual ou anterior.
    const utcToday = new Date().toISOString().slice(0, 10);
    expect(todaySaoPaulo() <= utcToday).toBe(true);
  });
});

describe('getArtworksByBibleReference', () => {
  it('passa bookSlug, chapter e verses pra API', async () => {
    requestMock.mockResolvedValue({ items: [], total: 0 });
    await getArtworksByBibleReference('isaiah', 9, '6');
    expect(requestMock).toHaveBeenCalledWith('/artworks', {
      bookSlug: 'isaiah',
      chapter: 9,
      verses: '6',
      limit: 1000,
    });
  });

  it('funciona sem chapter nem verses', async () => {
    requestMock.mockResolvedValue({ items: [], total: 0 });
    await getArtworksByBibleReference('luke');
    expect(requestMock).toHaveBeenCalledWith('/artworks', { bookSlug: 'luke', limit: 1000 });
  });
});

describe('searchArtworksAdvanced', () => {
  it('retorna vazio sem query e sem filtros', async () => {
    requestMock.mockResolvedValue({ items: [], total: 0 });
    await expect(searchArtworksAdvanced('')).resolves.toEqual([]);
  });

  // Achado 2026-09-02 (Rilson): filtro de testamento substituído por
  // filtro de livro (múltiplo, "ou" entre os escolhidos) — mesma mecânica
  // de intersecção com `artwork.references`, sem precisar buscar a lista
  // de livros do testamento inteiro.
  it('filtra por livro no cliente (ou entre os livros escolhidos)', async () => {
    const comIsaias = { id: '1', references: [{ bookSlug: 'isaiah' }] };
    const comLucas = { id: '2', references: [{ bookSlug: 'luke' }] };
    const semNenhum = { id: '3', references: [{ bookSlug: 'genesis' }] };
    requestMock.mockResolvedValueOnce({ items: [comIsaias, comLucas, semNenhum], total: 3 });
    const results = await searchArtworksAdvanced('', { books: ['isaiah', 'luke'] });
    expect(results).toEqual([comIsaias, comLucas]);
  });

  it('aplica filtro de ano (yearFrom/yearTo) no cliente', async () => {
    const dentro = { id: '1', year: 1603, references: [] };
    const fora = { id: '2', year: 1850, references: [] };
    requestMock.mockResolvedValue({ items: [dentro, fora], total: 2 });
    const results = await searchArtworksAdvanced('', { yearFrom: 1600, yearTo: 1699 });
    expect(results).toEqual([dentro]);
  });

  it('exclui obras sem ano quando há filtro de ano', async () => {
    const semAno = { id: '1', references: [] };
    requestMock.mockResolvedValue({ items: [semAno], total: 1 });
    const results = await searchArtworksAdvanced('', { yearFrom: 1500, yearTo: 1599 });
    expect(results).toEqual([]);
  });

  // "Filtros Avançados" Passo 3 (roadmap, 2026-09-02).
  it('sem texto, passa themes direto pro /artworks (filtro server-side)', async () => {
    requestMock.mockResolvedValue({ items: [{ id: '1' }], total: 1 });
    await searchArtworksAdvanced('', { themes: ['ressurreicao', 'parabola'] });
    expect(requestMock).toHaveBeenCalledWith('/artworks', {
      category: undefined,
      artists: undefined,
      themes: ['ressurreicao', 'parabola'],
      limit: 1000,
    });
  });

  it('com texto, intersecta a busca full-text com os IDs de /artworks?themes=', async () => {
    const bate = { id: '1', references: [] };
    const naoBate = { id: '2', references: [] };
    requestMock
      .mockResolvedValueOnce([bate, naoBate]) // searchArtworks (full-text)
      .mockResolvedValueOnce({ items: [bate], total: 1 }); // /artworks?themes=
    const results = await searchArtworksAdvanced('emaús', { themes: ['ressurreicao'] });
    expect(results).toEqual([bate]);
  });
});

describe('getThemes', () => {
  it('busca /themes e devolve a lista', async () => {
    const themes = [{ slug: 'ressurreicao', name: 'Ressurreição', artworkCount: 40 }];
    requestMock.mockResolvedValue(themes);
    await expect(getThemes()).resolves.toEqual(themes);
    expect(requestMock).toHaveBeenCalledWith('/themes');
  });
});

// Achado 2026-09-02 (Rilson): filtro "Período" — lista de séculos vem de
// /periods (ao vivo) em vez de hardcoded no componente.
describe('getPeriods', () => {
  it('busca /periods e devolve a lista', async () => {
    const periods = [{ century: 19, artworkCount: 436 }];
    requestMock.mockResolvedValue(periods);
    await expect(getPeriods()).resolves.toEqual(periods);
    expect(requestMock).toHaveBeenCalledWith('/periods');
  });
});

describe('parseYear', () => {
  it('extrai ano de string com prefixo ("c. 1609")', () => {
    expect(parseYear('c. 1609')).toBe(1609);
  });

  it('aceita número direto e devolve null para lixo/ausência', () => {
    expect(parseYear(1625)).toBe(1625);
    expect(parseYear(undefined)).toBeNull();
    expect(parseYear('s.d.')).toBeNull();
  });
});

describe('getBibleBooks', () => {
  it('busca todos os livros', async () => {
    requestMock.mockResolvedValue([{ slug: 'genesis' }]);
    await expect(getBibleBooks()).resolves.toEqual([{ slug: 'genesis' }]);
  });
});

describe('getBibleBookBySlug', () => {
  it('devolve o livro quando existe', async () => {
    requestMock.mockResolvedValue({ slug: 'isaiah' });
    await expect(getBibleBookBySlug('isaiah')).resolves.toEqual({ slug: 'isaiah' });
  });

  it('devolve undefined em 404', async () => {
    requestMock.mockRejectedValue(new ApiError(404, 'Livro não encontrado'));
    await expect(getBibleBookBySlug('x')).resolves.toBeNull();
  });
});
