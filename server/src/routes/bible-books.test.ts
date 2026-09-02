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

describe('GET /api/v1/bible-books', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('retorna a lista de livros bíblicos', async () => {
    vi.mocked(queries.listBibleBooks).mockResolvedValueOnce([
      { id: '1', name: 'Gênesis', slug: 'genesis', chapters: 50, artworkCount: 112, testament: 'old', order: 1, createdAt: null, coverImageUrl: '/images/genesis-cover.webp' },
      { id: '2', name: 'Mateus', slug: 'matthew', chapters: 28, artworkCount: 337, testament: 'new', order: 40, createdAt: null, coverImageUrl: null },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/bible-books',
    });

    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json).toHaveLength(2);
    expect(json[0].slug).toBe('genesis');
    // "Capa" translúcida (roadmap, 2026-09-02) — precisa vir na resposta,
    // null quando o livro não tem nenhuma obra com imagem ainda.
    expect(json[0].coverImageUrl).toBe('/images/genesis-cover.webp');
    expect(json[1].coverImageUrl).toBeNull();
  });

  it('retorna 404 para livro não encontrado', async () => {
    vi.mocked(queries.getBibleBookBySlug).mockResolvedValueOnce(undefined);

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/bible-books/inexistente',
    });

    expect(res.statusCode).toBe(404);
  });
});
