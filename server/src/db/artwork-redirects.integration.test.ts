import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { buildApp } from '../app.js';
import { closeDb } from './client.js';
import { getArtworkBySlugOrId } from './queries.js';
import { artworkIdFromSlug } from '../lib/deterministic-uuid.js';

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations');

const SLUG_ANTIGO = 'jan-bruegel-o-velho-o-censo-em-belem-the-census-at-bethlehem-o-censo-em-belem';
const SLUG_NOVO = 'pieter-bruegel-o-velho-o-censo-em-belem';
const ID_NOVO = artworkIdFromSlug(SLUG_NOVO);
const ID_ANTIGO = artworkIdFromSlug(SLUG_ANTIGO);
const SLUG_VIVO = 'rembrandt-van-rijn-o-filho-prodigo';
const ID_VIVO = artworkIdFromSlug(SLUG_VIVO);

/** ADR 007: a URL e o UUID antigos de uma obra que mudou de slug (o título em
 *  inglês saiu do nome do arquivo; "Jan Bruegel" virou "Pieter Bruegel") não podem
 *  virar 404, e um slug vivo nunca pode ser sombreado por um redirecionamento.
 *  Contra Postgres real: a garantia depende da consulta na tabela. */
describe('redirecionamento de slug antigo — integração (Postgres real de teste)', () => {
  let sql: postgres.Sql;
  const criadas: string[] = [];

  async function criarObra(id: string, slug: string, titulo: string, ativa = true) {
    await sql`
      INSERT INTO artworks (id, slug, title, artist_or_director, category, description, image_url, active)
      VALUES (${id}, ${slug}, ${titulo}, 'Artista de teste', 'painting', 'descrição', ${`/images/${slug}.webp`}, ${ativa})
    `;
    criadas.push(id);
  }

  async function criarRedirecionamento(oldSlug: string, oldId: string, newSlug: string) {
    await sql`INSERT INTO artwork_redirects (old_slug, old_id, new_slug) VALUES (${oldSlug}, ${oldId}, ${newSlug})`;
  }

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não definida nos testes de integração');
    sql = postgres(url, { max: 2 });
    await migrate(drizzle(sql), { migrationsFolder: MIGRATIONS_DIR });
  });

  afterEach(async () => {
    await sql`DELETE FROM artwork_redirects`;
    if (criadas.length > 0) await sql`DELETE FROM artworks WHERE id IN ${sql(criadas)}`;
    criadas.length = 0;
  });

  afterAll(async () => {
    await sql.end();
    await closeDb();
  });

  describe('getArtworkBySlugOrId', () => {
    it('o slug antigo devolve a obra com o slug novo', async () => {
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await criarRedirecionamento(SLUG_ANTIGO, ID_ANTIGO, SLUG_NOVO);

      const obra = await getArtworkBySlugOrId(SLUG_ANTIGO);

      expect(obra?.slug).toBe(SLUG_NOVO);
      expect(obra?.id).toBe(ID_NOVO);
    });

    it('o UUID antigo (o que a obra tinha com o slug antigo) devolve a obra com o slug novo', async () => {
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await criarRedirecionamento(SLUG_ANTIGO, ID_ANTIGO, SLUG_NOVO);

      const obra = await getArtworkBySlugOrId(ID_ANTIGO);

      expect(obra?.slug).toBe(SLUG_NOVO);
    });

    it('slug vivo nunca é sombreado por um redirecionamento com o mesmo slug antigo', async () => {
      await criarObra(ID_VIVO, SLUG_VIVO, 'O filho pródigo');
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await criarRedirecionamento(SLUG_VIVO, ID_VIVO, SLUG_NOVO); // dado errado de propósito

      const obra = await getArtworkBySlugOrId(SLUG_VIVO);

      expect(obra?.slug).toBe(SLUG_VIVO);
    });

    it('UUID vivo continua resolvendo pelo UUID (ADR 006), mesmo havendo redirecionamento com o mesmo ID', async () => {
      await criarObra(ID_VIVO, SLUG_VIVO, 'O filho pródigo');
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await criarRedirecionamento(SLUG_ANTIGO, ID_VIVO, SLUG_NOVO); // old_id colide com um UUID vivo

      const obra = await getArtworkBySlugOrId(ID_VIVO);

      expect(obra?.slug).toBe(SLUG_VIVO);
    });

    it('destino inativo (ex.: retirada por direitos autorais) continua 404, sem vazar por redirecionamento', async () => {
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém', false);
      await criarRedirecionamento(SLUG_ANTIGO, ID_ANTIGO, SLUG_NOVO);

      expect(await getArtworkBySlugOrId(SLUG_ANTIGO)).toBeUndefined();
      expect(await getArtworkBySlugOrId(ID_ANTIGO)).toBeUndefined();
    });

    it('destino que não existe no banco continua 404', async () => {
      await criarRedirecionamento(SLUG_ANTIGO, ID_ANTIGO, SLUG_NOVO);

      expect(await getArtworkBySlugOrId(SLUG_ANTIGO)).toBeUndefined();
    });

    it('segue um salto só: cadeia A→B→C não é resolvida em tempo de execução (o reseed achata)', async () => {
      const slugB = 'slug-intermediario';
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await criarRedirecionamento(SLUG_ANTIGO, ID_ANTIGO, slugB);
      await criarRedirecionamento(slugB, artworkIdFromSlug(slugB), SLUG_NOVO);

      expect(await getArtworkBySlugOrId(SLUG_ANTIGO)).toBeUndefined();
      expect((await getArtworkBySlugOrId(slugB))?.slug).toBe(SLUG_NOVO);
    });

    it('se a consulta de redirecionamento falhar, a obra inexistente continua 404 (nunca vira erro 500)', async () => {
      await sql`ALTER TABLE artwork_redirects RENAME TO artwork_redirects_fora_do_ar`;
      try {
        expect(await getArtworkBySlugOrId(SLUG_ANTIGO)).toBeUndefined();
        expect(await getArtworkBySlugOrId(ID_ANTIGO)).toBeUndefined();
      } finally {
        await sql`ALTER TABLE artwork_redirects_fora_do_ar RENAME TO artwork_redirects`;
      }
    });

    it('a obra viva continua respondendo mesmo com a tabela de redirecionamento fora do ar', async () => {
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await sql`ALTER TABLE artwork_redirects RENAME TO artwork_redirects_fora_do_ar`;
      try {
        expect((await getArtworkBySlugOrId(SLUG_NOVO))?.id).toBe(ID_NOVO);
      } finally {
        await sql`ALTER TABLE artwork_redirects_fora_do_ar RENAME TO artwork_redirects`;
      }
    });

    it('slug e UUID desconhecidos continuam 404', async () => {
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await criarRedirecionamento(SLUG_ANTIGO, ID_ANTIGO, SLUG_NOVO);

      expect(await getArtworkBySlugOrId('slug-que-nunca-existiu')).toBeUndefined();
      expect(await getArtworkBySlugOrId('99999999-9999-5999-8999-999999999999')).toBeUndefined();
    });

    it('com a tabela vazia, o comportamento é o de sempre', async () => {
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');

      expect((await getArtworkBySlugOrId(SLUG_NOVO))?.id).toBe(ID_NOVO);
      expect((await getArtworkBySlugOrId(ID_NOVO))?.slug).toBe(SLUG_NOVO);
      expect(await getArtworkBySlugOrId(SLUG_ANTIGO)).toBeUndefined();
    });
  });

  describe('rotas', () => {
    let app: Awaited<ReturnType<typeof buildApp>>;

    beforeAll(async () => {
      app = await buildApp();
      await app.ready();
    });

    afterAll(async () => {
      if (app) await app.close();
    });

    it('GET /api/v1/artworks/:slug-antigo responde 200 com a obra de slug novo', async () => {
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await criarRedirecionamento(SLUG_ANTIGO, ID_ANTIGO, SLUG_NOVO);

      const res = await app.inject({ method: 'GET', url: `/api/v1/artworks/${SLUG_ANTIGO}` });

      expect(res.statusCode).toBe(200);
      expect(res.json().slug).toBe(SLUG_NOVO);
    });

    it('GET /api/v1/artworks/:slug-desconhecido continua 404', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/artworks/slug-que-nunca-existiu' });

      expect(res.statusCode).toBe(404);
    });

    it('a prévia de link (bots) de um slug antigo aponta o og:url pro slug novo', async () => {
      await criarObra(ID_NOVO, SLUG_NOVO, 'O censo em Belém');
      await criarRedirecionamento(SLUG_ANTIGO, ID_ANTIGO, SLUG_NOVO);

      const res = await app.inject({ method: 'GET', url: `/share/obra/${SLUG_ANTIGO}` });

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain(`property="og:url" content="https://biblianaarte.narniano.com/obra/${SLUG_NOVO}"`);
      expect(res.body).not.toContain(`property="og:url" content="https://biblianaarte.narniano.com/obra/${SLUG_ANTIGO}"`);
    });
  });
});
