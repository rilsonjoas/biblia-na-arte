import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { buildApp } from '../app.js';
import { db, closeDb } from '../db/client.js';

const MIGRATIONS_DIR = path.join(import.meta.dirname, '../db/migrations');
const FUNCTIONS_SQL = path.join(import.meta.dirname, '../db/custom-sql/functions.sql');

const BOOK_ISAIAH = '00000000-0000-0000-0000-000000000001';
const BOOK_LUKE = '00000000-0000-0000-0000-000000000002';
const ARTWORK_SAMARITAN = '10000000-0000-0000-0000-000000000001';
const ARTWORK_PRODIGAL = '10000000-0000-0000-0000-000000000002';

describe('API v1 — integração (Postgres real de teste)', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let admin: postgres.Sql;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não definida nos testes de integração');

    admin = postgres(url, { max: 1 });
    const adminDb = drizzle(admin);

    await migrate(adminDb, { migrationsFolder: MIGRATIONS_DIR });
    await admin.unsafe(readFileSync(FUNCTIONS_SQL, 'utf-8'));

    await admin.unsafe('TRUNCATE bible_references, artworks, bible_books RESTART IDENTITY CASCADE');
    await admin.unsafe(`
      INSERT INTO bible_books (id, name, slug, chapters, testament) VALUES
        ('${BOOK_ISAIAH}', 'Isaías', 'isaiah', 66, 'old'),
        ('${BOOK_LUKE}', 'Lucas', 'luke', 24, 'new');

      INSERT INTO artworks (id, title, artist_or_director, year, category, description, image_url, license_type) VALUES
        ('${ARTWORK_SAMARITAN}', 'O bom samaritano', 'Aimé Morot', '1880', 'painting',
         'Descrição **com markdown** da obra do samaritano.', '/images/samaritano.jpg', 'public-domain'),
        ('${ARTWORK_PRODIGAL}', 'O filho pródigo', 'Rembrandt', '1668', 'painting',
         'Outra obra sobre o perdão.', NULL, 'public-domain');

      INSERT INTO bible_references (id, artwork_id, book, book_slug, chapter, verses) VALUES
        ('20000000-0000-0000-0000-000000000001', '${ARTWORK_SAMARITAN}', 'Lucas', 'luke', 10, '34'),
        ('20000000-0000-0000-0000-000000000002', '${ARTWORK_PRODIGAL}', 'Lucas', 'luke', 15, NULL);
    `);

    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (admin) await admin.end({ timeout: 5 });
    await closeDb();
  });

  it('GET /health responde ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('status', 'ok');
  });

  it('GET /health/live responde status live', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/live' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('status', 'live');
  });

  it('GET /health/ready valida conexão ativa com o banco', async () => {
    const res = await app.inject({ method: 'GET', url: '/health/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ready', database: 'connected' });
  });

  it('GET /api/v1/artists lista artistas agregados com contagem', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artists' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Rembrandt', artworkCount: 1 }),
      ]),
    );
  });

  it('GET /docs expõe o OpenAPI com as rotas', async () => {
    const res = await app.inject({ method: 'GET', url: '/docs' });
    expect(res.statusCode).toBe(200);
    const spec = res.json();
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toBe('Bíblia na Arte — API');
    expect(spec.paths['/api/v1/artworks'].get).toBeDefined();
    expect(spec.paths['/api/v1/artworks'].get.parameters.length).toBeGreaterThan(0);
    expect(spec.paths['/api/v1/bible-text/{bookSlug}/{chapter}'].get).toBeDefined();
  });

  it('GET /api/v1/bible-text/:bookSlug/:chapter devolve o capítulo do upstream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            reference: 'Lucas 10',
            verses: [{ book_id: 'luk', book_name: 'Lucas', chapter: 10, verse: 1, text: 'Ora, havia...' }],
            translation_name: 'João Ferreira de Almeida',
          }),
          { status: 200 },
        ),
      ),
    );

    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-text/luke/10' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.bookSlug).toBe('luke');
    expect(body.chapter).toBe(10);
    expect(body.translation).toBe('João Ferreira de Almeida');
    expect(body.verses).toEqual([expect.objectContaining({ verse: 1, text: 'Ora, havia...' })]);
    expect(res.headers['cache-control']).toContain('max-age=3600');

    vi.unstubAllGlobals();
  });

  it('404 para capítulo/livro inexistente no upstream', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"not found"}', { status: 404 })));
    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-text/luke/99' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('not_found');
    vi.unstubAllGlobals();
  });

  it('400 para capítulo inválido na URL', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-text/luke/abc' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('validation_error');
  });

  it('lista obras paginadas com referências anexadas', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(2);
    expect(body.items.length).toBe(2);
    const samaritan = body.items.find((a: { title: string }) => a.title === 'O bom samaritano');
    expect(samaritan.references).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ book: 'Lucas', bookSlug: 'luke', chapter: 10, verses: '34' }),
      ]),
    );
  });

  it('filtra por livro + capítulo (base da futura página de capítulo)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks?bookSlug=luke&chapter=10' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].title).toBe('O bom samaritano');
  });

  it('busca por full-text em português', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/search?q=samaritano' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.some((a: { title: string }) => a.title === 'O bom samaritano')).toBe(true);
  });

  // Achado real 2026-08-22: plainto_tsquery exigia a palavra completa
  // ("samarit" não achava "samaritano") — reescrito pra prefix match (:*).
  it('busca por prefixo de palavra (sem precisar digitar a palavra inteira)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/search?q=samarit' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.some((a: { title: string }) => a.title === 'O bom samaritano')).toBe(true);
  });

  // Achado real 2026-08-22: buscar o nome de um livro bíblico referenciado
  // (não presente no título/descrição da obra em si) não achava nada —
  // search_artworks só olhava título/subtítulo/descrição/artista, nunca
  // as referências bíblicas cadastradas em bible_references.
  it('busca por livro bíblico referenciado na obra (não só texto da obra)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/search?q=Lucas' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.some((a: { title: string }) => a.title === 'O bom samaritano')).toBe(true);
  });

  // Achado real 2026-08-22: digitar sem acento não achava nada
  // ("descricao" não achava "Descrição") — comum no celular.
  it('busca ignora acento (unaccent)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/search?q=descricao' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.some((a: { title: string }) => a.title === 'O bom samaritano')).toBe(true);
  });

  it('GET /api/v1/bible-books lista os livros', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-books' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
  });

  it('GET /api/v1/bible-books?testament=new filtra', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-books?testament=new' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([expect.objectContaining({ name: 'Lucas' })]);
  });

  it('404 para obra inexistente', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/artworks/00000000-0000-0000-0000-00000000dead',
    });
    expect(res.statusCode).toBe(404);
  });

  it('400 para entrada inválida', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks?chapter=abc' });
    expect(res.statusCode).toBe(400);
  });

  it('db client singleton conecta no banco de teste (não no de produção)', async () => {
    const rows = await db.execute('SELECT current_database() AS db');
    expect(rows[0]?.db).toBe('biblia_na_arte_test');
  });
});
