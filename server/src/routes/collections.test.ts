import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

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
  listCollections: vi.fn(),
  getCollectionDetail: vi.fn(),
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

describe('GET /api/v1/collections', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/v1/collections retorna lista de coleções', async () => {
    const mockCollections = [
      {
        slug: 'vida-de-cristo',
        title: 'A Vida de Cristo',
        subtitle: 'Dos Evangelhos à Glória',
        description: 'Uma jornada visual e contemplativa...',
        coverImage: '/images/rembrandt.webp',
        artworkCount: 42,
      },
    ];

    vi.mocked(queries.listCollections).mockResolvedValue(mockCollections as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/collections',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].slug).toBe('vida-de-cristo');
  });

  it('GET /api/v1/collections/:slug retorna detalhes da coleção', async () => {
    const mockDetail = {
      slug: 'vida-de-cristo',
      title: 'A Vida de Cristo',
      subtitle: 'Dos Evangelhos à Glória',
      description: 'Uma jornada visual e contemplativa...',
      coverImage: '/images/rembrandt.webp',
      artworks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'A Ceia em Emaús',
          artistOrDirector: 'Rembrandt',
          category: 'painting',
          description: 'Descrição teste',
          licenseType: 'public-domain',
          references: [],
        },
      ],
    };

    vi.mocked(queries.getCollectionDetail).mockResolvedValue(mockDetail as never);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/collections/vida-de-cristo',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.title).toBe('A Vida de Cristo');
    expect(body.artworks).toHaveLength(1);
  });

  it('GET /api/v1/collections/:slug retorna 404 quando a coleção não existe', async () => {
    vi.mocked(queries.getCollectionDetail).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/collections/colecao-inexistente',
    });

    expect(response.statusCode).toBe(404);
  });
});
