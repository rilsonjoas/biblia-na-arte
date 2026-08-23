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
    await expect(getArtworkById('nao-existe')).resolves.toBeUndefined();
  });

  it('propaga erros que não são 404', async () => {
    requestMock.mockRejectedValue(new ApiError(500, 'erro'));
    await expect(getArtworkById('abc')).rejects.toThrow('erro');
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

  it('filtra por testamento no cliente', async () => {
    const artwork = {
      id: '1',
      references: [{ bookSlug: 'isaiah' }],
    };
    requestMock
      .mockResolvedValueOnce({ items: [artwork], total: 1 })
      .mockResolvedValueOnce([{ slug: 'isaiah' }]); // getOldTestamentBooks
    const results = await searchArtworksAdvanced('', { testament: 'old' });
    expect(results).toEqual([artwork]);
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
    await expect(getBibleBookBySlug('x')).resolves.toBeUndefined();
  });
});
