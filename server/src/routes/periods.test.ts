import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../config.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    CORS_ORIGIN: ['http://localhost:8080'],
  },
  isProduction: false,
}));

vi.mock('../db/queries.js', () => ({
  listPeriods: vi.fn(),
  listThemes: vi.fn(),
  listArtists: vi.fn(),
  getArtistBySlug: vi.fn(),
  listBibleBooks: vi.fn(),
  getBibleBookBySlug: vi.fn(),
  getArtworkById: vi.fn(),
  listArtworks: vi.fn(),
  getRandomArtwork: vi.fn(),
  getArtworksByBibleReference: vi.fn(),
  countArtworksByBibleReference: vi.fn(),
  getExploreByChapter: vi.fn(),
}));

import { buildApp } from '../app.js';
import * as queries from '../db/queries.js';

describe('GET /api/v1/periods', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('retorna lista de séculos com contagem de obras, ordenada cronologicamente', async () => {
    vi.mocked(queries.listPeriods).mockResolvedValueOnce([
      { century: 15, artworkCount: 42 },
      { century: 19, artworkCount: 436 },
    ]);

    const res = await app.inject({ method: 'GET', url: '/api/v1/periods' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      { century: 15, artworkCount: 42 },
      { century: 19, artworkCount: 436 },
    ]);
  });
});
