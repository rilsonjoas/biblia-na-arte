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

const ARTWORK_ID = '11111111-1111-1111-1111-111111111111';

describe('GET /share/obra/:id', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('devolve HTML com as meta tags da obra, não as genéricas do site', async () => {
    vi.mocked(queries.getArtworkById).mockResolvedValueOnce({
      id: ARTWORK_ID,
      title: 'A Transfiguração',
      artistOrDirector: 'Fra Angelico',
      description: '**Fra Angelico** pinta Cristo de pé sobre um pequeno afloramento rochoso...',
      imageUrl: '/images/fra-angelico-a-transfiguracao.webp',
      references: [],
      // campos restantes do ArtworkWithReferences não importam pro teste
    } as unknown as Awaited<ReturnType<typeof queries.getArtworkById>>);

    const res = await app.inject({ method: 'GET', url: `/share/obra/${ARTWORK_ID}` });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('A Transfiguração — Fra Angelico | Bíblia na Arte');
    expect(res.body).toContain(
      'property="og:image" content="https://biblianaarte.narniano.com/images/fra-angelico-a-transfiguracao.webp"',
    );
    expect(res.body).toContain(`https://biblianaarte.narniano.com/obra/${ARTWORK_ID}`);
    // negrito markdown não deve vazar pro texto puro da og:description
    expect(res.body).not.toContain('**');
  });

  it('obra inexistente cai pras meta tags genéricas do site, sem quebrar', async () => {
    vi.mocked(queries.getArtworkById).mockResolvedValueOnce(undefined);

    const res = await app.inject({ method: 'GET', url: `/share/obra/${ARTWORK_ID}` });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('Bíblia na Arte — A Bíblia através da Arte e Cultura');
  });

  it('id inválido (não-UUID) não derruba a rota', async () => {
    const res = await app.inject({ method: 'GET', url: '/share/obra/nao-e-um-uuid' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('Bíblia na Arte — A Bíblia através da Arte e Cultura');
  });
});
