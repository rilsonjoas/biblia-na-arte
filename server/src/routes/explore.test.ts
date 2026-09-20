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
  getExploreByChapter: vi.fn(),
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
  listPeriods: vi.fn(),
}));

import { buildApp } from '../app.js';
import * as queries from '../db/queries.js';

describe('GET /api/v1/explore/:bookSlug/:chapter', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('monta o hub de conectividade de uma passagem', async () => {
    vi.mocked(queries.getExploreByChapter).mockResolvedValueOnce({
      bookName: 'Lucas',
      testament: 'new',
      chapters: 24,
      artworks: [
        {
          id: '10000000-0000-0000-0000-000000000001',
          slug: 'aime-morot-o-bom-samaritano',
          title: 'O bom samaritano',
          subtitle: null,
          artistOrDirector: 'Aimé Morot',
          year: '1880',
          category: 'painting',
          imageUrl: '/images/samaritano.jpg',
          themes: [{ slug: 'bom-samaritano', name: 'Bom Samaritano' }],
          references: [
            {
              id: '20000000-0000-0000-0000-000000000001',
              artworkId: '10000000-0000-0000-0000-000000000001',
              book: 'Lucas',
              bookSlug: 'luke',
              chapter: 10,
              verses: '34',
              passageText: null,
              createdAt: null,
            },
          ],
        },
      ],
      relatedChapters: [
        { chapter: 15, chapterCount: 2, coverImageUrl: '/images/prodigo.jpg' },
      ],
      themes: [{ slug: 'bom-samaritano', name: 'Bom Samaritano', artworkCount: 1 }],
    });

    const res = await app.inject({ method: 'GET', url: '/api/v1/explore/luke/10' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.book).toEqual({ name: 'Lucas', slug: 'luke', testament: 'new' });
    expect(body.chapter).toBe(10);
    expect(body.artworks).toHaveLength(1);
    expect(body.artworks[0].title).toBe('O bom samaritano');
    // URL amigável (roadmap, 2026-09-19): o hub de /explorar também
    // precisa do slug pro card da obra linkar bonito, não só GET /artworks/:id.
    expect(body.artworks[0].slug).toBe('aime-morot-o-bom-samaritano');
    expect(body.artworks[0].themes[0].name).toBe('Bom Samaritano');
    expect(body.relatedChapters).toEqual([
      { chapter: 15, chapterCount: 2, coverImageUrl: '/images/prodigo.jpg' },
    ]);
    expect(body.themes).toEqual([
      { slug: 'bom-samaritano', name: 'Bom Samaritano', artworkCount: 1 },
    ]);
  });

  it('404 pra livro inexistente', async () => {
    vi.mocked(queries.getExploreByChapter).mockResolvedValueOnce(undefined);
    const res = await app.inject({ method: 'GET', url: '/api/v1/explore/livro-que-nao-existe/1' });
    expect(res.statusCode).toBe(404);
  });

  it('404 pra capítulo fora do intervalo do livro', async () => {
    vi.mocked(queries.getExploreByChapter).mockResolvedValueOnce({
      bookName: 'Lucas',
      testament: 'new',
      chapters: 24,
      artworks: [],
      relatedChapters: [],
      themes: [],
    });
    const res = await app.inject({ method: 'GET', url: '/api/v1/explore/luke/99' });
    expect(res.statusCode).toBe(404);
  });

  it('400 pra capítulo inválido na URL', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/explore/luke/abc' });
    expect(res.statusCode).toBe(400);
  });
});
