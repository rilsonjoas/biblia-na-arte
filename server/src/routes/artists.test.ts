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
  listArtists: vi.fn(),
  getArtistBySlug: vi.fn(),
  listBibleBooks: vi.fn(),
  getBibleBookBySlug: vi.fn(),
  getArtworkById: vi.fn(),
  listArtworks: vi.fn(),
  getRandomArtwork: vi.fn(),
  getArtworksByBibleReference: vi.fn(),
  countArtworksByBibleReference: vi.fn(),
}));

import { buildApp } from '../app.js';
import * as queries from '../db/queries.js';

describe('GET /api/v1/artists', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('retorna lista de artistas com contagem de obras', async () => {
    vi.mocked(queries.listArtists).mockResolvedValueOnce([
      { name: 'Rembrandt', artworkCount: 5 },
      { name: 'Ticiano', artworkCount: 3 },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/artists',
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json).toEqual([
      { name: 'Rembrandt', artworkCount: 5 },
      { name: 'Ticiano', artworkCount: 3 },
    ]);
  });
});

describe('GET /api/v1/artists/:slug', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('retorna artista com biografia e galeria de obras', async () => {
    vi.mocked(queries.getArtistBySlug).mockResolvedValueOnce({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Rembrandt van Rijn',
      slug: 'rembrandt-van-rijn',
      bio: 'Pintor holandês do Século de Ouro.',
      artworks: [],
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/artists/rembrandt-van-rijn',
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.name).toBe('Rembrandt van Rijn');
    expect(json.bio).toBe('Pintor holandês do Século de Ouro.');
  });

  it('retorna 404 pra slug inexistente', async () => {
    vi.mocked(queries.getArtistBySlug).mockResolvedValueOnce(undefined);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/artists/artista-inexistente',
    });

    expect(res.statusCode).toBe(404);
  });
});
