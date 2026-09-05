import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../config.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    CORS_ORIGIN: ['http://localhost:8080'],
    JWT_SECRET: 'test-secret-with-at-least-32-characters',
    SUBMISSION_UPLOADS_DIR: './uploads/pending-submissions-test',
    APPROVED_SUBMISSION_UPLOADS_DIR: './uploads/approved-submissions-test',
    PUBLIC_API_URL: 'http://localhost:3000',
  },
  isProduction: false,
}));

vi.mock('../db/queries.js', () => ({
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
  listPeriods: vi.fn(),
}));

import { buildApp } from '../app.js';
import * as queries from '../db/queries.js';

describe('GET /api/v1/themes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('retorna lista de temas com contagem de obras, ordenada por frequência', async () => {
    vi.mocked(queries.listThemes).mockResolvedValueOnce([
      { slug: 'ressurreicao', name: 'Ressurreição', artworkCount: 40 },
      { slug: 'parabola', name: 'Parábola', artworkCount: 32 },
    ]);

    const res = await app.inject({ method: 'GET', url: '/api/v1/themes' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([
      { slug: 'ressurreicao', name: 'Ressurreição', artworkCount: 40 },
      { slug: 'parabola', name: 'Parábola', artworkCount: 32 },
    ]);
  });
});
