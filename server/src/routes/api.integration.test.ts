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
const ARTIST_REMBRANDT = '30000000-0000-0000-0000-000000000001';

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

    await admin.unsafe(
      'TRUNCATE bible_references, artwork_themes, artworks, bible_books, artists, themes RESTART IDENTITY CASCADE',
    );
    await admin.unsafe(`
      INSERT INTO bible_books (id, name, slug, chapters, testament) VALUES
        ('${BOOK_ISAIAH}', 'Isaías', 'isaiah', 66, 'old'),
        ('${BOOK_LUKE}', 'Lucas', 'luke', 24, 'new');

      INSERT INTO artworks (id, title, artist_or_director, year, category, description, image_url, license_type, location, classic_commentary_author, classic_commentary) VALUES
        ('${ARTWORK_SAMARITAN}', 'O bom samaritano', 'Aimé Morot', '1880', 'painting',
         'Descrição **com markdown** da obra do samaritano.', '/images/samaritano.jpg', 'public-domain',
         'Musée d''Orsay, Paris, França', 'Schaeffer', 'Um comentário de teste.'),
        ('${ARTWORK_PRODIGAL}', 'O filho pródigo', 'Rembrandt', '1668', 'painting',
         'Outra obra sobre o perdão.', NULL, 'public-domain', NULL, NULL, NULL);

      INSERT INTO bible_references (id, artwork_id, book, book_slug, chapter, verses) VALUES
        ('20000000-0000-0000-0000-000000000001', '${ARTWORK_SAMARITAN}', 'Lucas', 'luke', 10, '34'),
        ('20000000-0000-0000-0000-000000000002', '${ARTWORK_PRODIGAL}', 'Lucas', 'luke', 15, NULL);

      INSERT INTO artists (id, name, slug, bio) VALUES
        ('${ARTIST_REMBRANDT}', 'Rembrandt', 'rembrandt', 'Pintor holandês do Século de Ouro, teste de integração.');

      INSERT INTO themes (slug, name) VALUES
        ('bom-samaritano', 'Bom Samaritano'),
        ('perdao', 'Perdão');

      INSERT INTO artwork_themes (artwork_id, theme_slug) VALUES
        ('${ARTWORK_SAMARITAN}', 'bom-samaritano'),
        ('${ARTWORK_PRODIGAL}', 'perdao');
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

  // "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23). Cobertura
  // aqui de propósito — a lição do achado 2026-09-01 (HTTP 500 real em
  // /bible-books/:slug, rota nunca exercitada contra Postgres de verdade)
  // é não deixar uma rota de detalhe nova sem teste de integração.
  it('GET /api/v1/artists/:slug retorna artista com biografia e galeria', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artists/rembrandt' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe('Rembrandt');
    expect(body.bio).toBe('Pintor holandês do Século de Ouro, teste de integração.');
    expect(body.artworks).toHaveLength(1);
    expect(body.artworks[0].title).toBe('O filho pródigo');
  });

  it('GET /api/v1/artists/:slug retorna 404 pra slug inexistente', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artists/ninguem-com-esse-slug' });
    expect(res.statusCode).toBe(404);
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

  it('"Me surpreenda" — devolve uma obra qualquer do fixture, com referências', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/random' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(['O bom samaritano', 'O filho pródigo']).toContain(body.title);
    expect(Array.isArray(body.references)).toBe(true);
  });

  it('"Pintura do Dia" — mesma data sempre devolve a mesma obra (determinístico)', async () => {
    const res1 = await app.inject({ method: 'GET', url: '/api/v1/artworks/daily?date=2026-08-23' });
    const res2 = await app.inject({ method: 'GET', url: '/api/v1/artworks/daily?date=2026-08-23' });
    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);
    const body1 = res1.json();
    const body2 = res2.json();
    expect(body1.id).toBe(body2.id);
    expect(['O bom samaritano', 'O filho pródigo']).toContain(body1.title);
    expect(Array.isArray(body1.references)).toBe(true);
  });

  it('"Pintura do Dia" — sem ?date usa a data de hoje e responde 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/daily' });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBeDefined();
  });

  it('"Pintura do Dia" — 400 pra data em formato inválido', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/daily?date=23-08-2026' });
    expect(res.statusCode).toBe(400);
  });

  it('filtra por livro + capítulo (base da futura página de capítulo)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks?bookSlug=luke&chapter=10' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].title).toBe('O bom samaritano');
  });

  // Multiselect de artista (roadmap, pedido do Rilson 2026-09-01) — filtro
  // vem como string separada por vírgula (?artists=A,B), match exato via
  // inArray no SQL, não substring — testa tanto 1 quanto vários de uma vez
  // pra garantir que o "OU entre valores do mesmo filtro" funciona server-side
  // (contagem/paginação corretas, não é filtro pós-fetch no cliente).
  it('filtra por 1 artista (?artists=)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks?artists=Rembrandt' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].title).toBe('O filho pródigo');
  });

  it('filtra por múltiplos artistas de uma vez (?artists=A,B — OU entre eles)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/artworks?${new URLSearchParams({ artists: 'Rembrandt,Aimé Morot' }).toString()}`,
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(2);
    expect(body.items.map((a: { title: string }) => a.title).sort()).toEqual([
      'O bom samaritano',
      'O filho pródigo',
    ]);
  });

  it('artista que não bate com nenhum nome do fixture devolve lista vazia', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks?artists=Ninguém Assim' });
    expect(res.statusCode).toBe(200);
    expect(res.json().total).toBe(0);
  });

  // Filtro de tema (roadmap, Filtros Avançados Passo 2, 2026-09-02) —
  // mesma semântica "ou" do filtro de artista, testada contra a junção
  // real artwork_themes, não um mock.
  it('GET /api/v1/themes lista temas agregados com contagem', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/themes' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toEqual(
      expect.arrayContaining([
        { slug: 'bom-samaritano', name: 'Bom Samaritano', artworkCount: 1 },
        { slug: 'perdao', name: 'Perdão', artworkCount: 1 },
      ]),
    );
  });

  it('filtra obras por 1 tema (?themes=)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks?themes=bom-samaritano' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].title).toBe('O bom samaritano');
  });

  it('filtra obras por múltiplos temas de uma vez (?themes=a,b — OU entre eles)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/artworks?themes=bom-samaritano,perdao',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(2);
  });

  it('tema que não existe devolve lista vazia', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks?themes=tema-que-nao-existe' });
    expect(res.statusCode).toBe(200);
    expect(res.json().total).toBe(0);
  });

  // Filtro de período (achado 2026-09-02, Rilson: lista de séculos hardcoded
  // no front tinha ficado obsoleta) — calculado ao vivo a partir do `year`
  // de cada obra, testado contra dados reais: samaritano 1880 (século 19),
  // pródigo 1668 (século 17).
  it('GET /api/v1/periods lista séculos agregados com contagem', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/periods' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toEqual(
      expect.arrayContaining([
        { century: 17, artworkCount: 1 },
        { century: 19, artworkCount: 1 },
      ]),
    );
  });

  it('busca por full-text em português', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/search?q=samaritano' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.some((a: { title: string }) => a.title === 'O bom samaritano')).toBe(true);
  });

  // Achado real 2026-08-23: a busca (função SQL search_artworks, lista de
  // colunas escrita à mão) ficou pra trás quando `location` e
  // `classicCommentary*` foram adicionados ao schema — funcionava certo em
  // GET /artworks (select() do Drizzle pega tudo sozinho) mas sumia na
  // busca. Regressão coberta aqui pra não voltar a acontecer sem que um
  // teste quebre.
  it('busca devolve location e vozes dos clássicos (não só GET /artworks)', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/search?q=samaritano' });
    const body = res.json();
    const samaritan = body.find((a: { title: string }) => a.title === 'O bom samaritano');
    expect(samaritan.location).toBe('Musée d\'Orsay, Paris, França');
    expect(samaritan.classicCommentaryAuthor).toBe('Schaeffer');
    expect(samaritan.classicCommentary).toBe('Um comentário de teste.');
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

  // Lacuna real encontrada em produção (2026-09-01, HTTP 500 ao vivo em
  // /bible-books/titus): só a rota de LISTA tinha teste de integração, a
  // de DETALHE (1 livro por slug) nunca foi exercitada contra Postgres de
  // verdade — por isso um `artworkCount` obrigatório no schema de resposta
  // sem o campo correspondente em `getBibleBookBySlug` passou despercebido
  // até ir pro ar. Cobrindo os dois casos agora.
  it('GET /api/v1/bible-books/:slug retorna o livro com contagem de obras', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-books/luke' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe('Lucas');
    expect(body.artworkCount).toBe(2);
  });

  // "Capa" translúcida no cardzinho de livro (roadmap, 2026-09-02) — Lucas
  // tem 2 obras referenciadas no fixture, mas só o Samaritano tem
  // image_url (o Filho Pródigo é NULL de propósito, ver fixture acima);
  // Isaías não tem nenhuma referência, então coverImageUrl tem que ser
  // null em vez de quebrar a query com 0 obras.
  it('GET /api/v1/bible-books/:slug traz coverImageUrl da obra com imagem', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-books/luke' });
    expect(res.statusCode).toBe(200);
    expect(res.json().coverImageUrl).toBe('/images/samaritano.jpg');
  });

  it('GET /api/v1/bible-books/:slug traz coverImageUrl null pra livro sem obra com imagem', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-books/isaiah' });
    expect(res.statusCode).toBe(200);
    expect(res.json().coverImageUrl).toBeNull();
  });

  it('GET /api/v1/bible-books/:slug retorna 404 pra livro inexistente', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/bible-books/titus' });
    expect(res.statusCode).toBe(404);
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

  // "Mapa de obras ↔ referências bíblicas" (/explorar, aprovada 2026-09-02).
  // Lição do achado 2026-09-01 (rota nova sem teste de integração = HTTP 500
  // silencioso em produção): a rota de conectividade é exercitada contra o
  // Postgres real do fixture, não só mock. O Samaritano está em Lucas 10 (a
  // única obra do capítulo); o Filho Pródigo em Lucas 15 (o "related chapter"
  // com 1 obra); nenhum livro fora do fixture fica exposto como related.
  it('GET /api/v1/explore/:bookSlug/:chapter monta o hub da passagem', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/explore/luke/10' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.book).toEqual({ name: 'Lucas', slug: 'luke', testament: 'new' });
    expect(body.chapter).toBe(10);
    expect(body.artworks).toHaveLength(1);
    expect(body.artworks[0].title).toBe('O bom samaritano');
    expect(body.artworks[0].themes).toEqual(
      expect.arrayContaining([{ slug: 'bom-samaritano', name: 'Bom Samaritano' }]),
    );
    expect(body.relatedChapters).toEqual(
      expect.arrayContaining([{ chapter: 15, chapterCount: 1, coverImageUrl: null }]),
    );
    expect(body.themes).toEqual(
      expect.arrayContaining([{ slug: 'bom-samaritano', name: 'Bom Samaritano', artworkCount: 1 }]),
    );
  });

  it('GET /api/v1/explore/:bookSlug/:chapter 404 pra livro inexistente', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/explore/livro-que-nao-existe/1' });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/v1/explore/:bookSlug/:chapter 404 pra capítulo fora do intervalo', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/explore/luke/99' });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/v1/explore/:bookSlug/:chapter 400 pra capítulo inválido', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/explore/luke/abc' });
    expect(res.statusCode).toBe(400);
  });
});
