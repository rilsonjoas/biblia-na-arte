import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, closeDb } from './client.js';
import { listActiveVaultSlugs, remapDailyHistory, replaceArtworkRedirects } from './seed-redirects.js';
import { artworkIdFromSlug } from '../lib/deterministic-uuid.js';

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations');

// Slugs de teste com prefixo próprio: o banco de integração é compartilhado com
// outros arquivos, então nada aqui depende de a tabela estar vazia.
const P = 'seedredir-';
const ANTIGO = `${P}jan-bruegel-o-velho-o-censo-em-belem`;
const NOVO = `${P}pieter-bruegel-o-velho-o-censo-em-belem`;
const OUTRO = `${P}rembrandt-o-filho-prodigo`;
const DIA = '2031-05-17';
const DIA_2 = '2031-05-18';

/** ADR 007, etapa 3: o reseed apaga as obras de origem `vault` que saíram do
 *  export, e `daily_artwork.artwork_id` tem ON DELETE CASCADE. Sem remapear antes,
 *  o histórico da "Pintura do Dia" das obras renomeadas some junto. */
describe('camada de banco do reseed de redirecionamentos (Postgres real de teste)', () => {
  let sql: postgres.Sql;
  const criadas: string[] = [];

  async function criarObra(slug: string, opts: { ativa?: boolean; origem?: 'vault' | 'submissao'; semSlug?: boolean } = {}) {
    const id = artworkIdFromSlug(slug);
    await sql`
      INSERT INTO artworks (id, slug, title, artist_or_director, category, description, image_url, active, origem)
      VALUES (${id}, ${opts.semSlug ? null : slug}, ${slug}, 'Artista de teste', 'painting', 'd', '/x.webp',
              ${opts.ativa ?? true}, ${opts.origem ?? 'vault'})
    `;
    criadas.push(id);
    return id;
  }

  const historico = async () =>
    sql<{ date: string; artwork_id: string }[]>`
      SELECT to_char(date, 'YYYY-MM-DD') AS date, artwork_id FROM daily_artwork WHERE date IN (${DIA}, ${DIA_2}) ORDER BY date`;
  const redirecionamentos = async () =>
    sql<{ old_slug: string; old_id: string; new_slug: string }[]>`
      SELECT old_slug, old_id, new_slug FROM artwork_redirects WHERE old_slug LIKE ${P + '%'} ORDER BY old_slug`;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não definida nos testes de integração');
    sql = postgres(url, { max: 2 });
    await migrate(drizzle(sql), { migrationsFolder: MIGRATIONS_DIR });
  });

  afterEach(async () => {
    await sql`DELETE FROM daily_artwork WHERE date IN (${DIA}, ${DIA_2})`;
    await sql`DELETE FROM artwork_redirects WHERE old_slug LIKE ${P + '%'}`;
    if (criadas.length > 0) await sql`DELETE FROM artworks WHERE id IN ${sql(criadas)}`;
    criadas.length = 0;
  });

  afterAll(async () => {
    await sql.end();
    await closeDb();
  });

  describe('listActiveVaultSlugs', () => {
    it('devolve só obras ATIVAS de origem vault com slug', async () => {
      await criarObra(`${P}ativa-vault`);
      await criarObra(`${P}inativa-vault`, { ativa: false });
      await criarObra(`${P}ativa-submissao`, { origem: 'submissao' });
      await criarObra(`${P}ativa-sem-slug`, { semSlug: true });

      const slugs = (await listActiveVaultSlugs(db)).filter((s) => s.startsWith(P));

      expect(slugs).toEqual([`${P}ativa-vault`]);
    });
  });

  describe('remapDailyHistory', () => {
    it('aponta o histórico da obra antiga pra obra nova, e apagar a antiga não leva o histórico junto', async () => {
      const idAntigo = await criarObra(ANTIGO);
      const idNovo = await criarObra(NOVO);
      await sql`INSERT INTO daily_artwork (date, artwork_id) VALUES (${DIA}, ${idAntigo})`;

      const remapeadas = await remapDailyHistory(db, { [ANTIGO]: NOVO });

      expect(remapeadas).toBe(1);
      expect(await historico()).toEqual([{ date: DIA, artwork_id: idNovo }]);

      await sql`DELETE FROM artworks WHERE id = ${idAntigo}`; // o DELETE do reseed
      expect(await historico()).toEqual([{ date: DIA, artwork_id: idNovo }]);
    });

    it('sem a obra nova no banco, não mexe no histórico (evita violar a chave estrangeira)', async () => {
      const idAntigo = await criarObra(ANTIGO);
      await sql`INSERT INTO daily_artwork (date, artwork_id) VALUES (${DIA}, ${idAntigo})`;

      const remapeadas = await remapDailyHistory(db, { [ANTIGO]: NOVO });

      expect(remapeadas).toBe(0);
      expect(await historico()).toEqual([{ date: DIA, artwork_id: idAntigo }]);
    });

    it('não toca nas linhas de outras obras', async () => {
      const idAntigo = await criarObra(ANTIGO);
      const idNovo = await criarObra(NOVO);
      const idOutro = await criarObra(OUTRO);
      await sql`INSERT INTO daily_artwork (date, artwork_id) VALUES (${DIA}, ${idAntigo}), (${DIA_2}, ${idOutro})`;

      await remapDailyHistory(db, { [ANTIGO]: NOVO });

      expect(await historico()).toEqual([
        { date: DIA, artwork_id: idNovo },
        { date: DIA_2, artwork_id: idOutro },
      ]);
    });

    it('com mapa vazio não faz nada', async () => {
      const idAntigo = await criarObra(ANTIGO);
      await sql`INSERT INTO daily_artwork (date, artwork_id) VALUES (${DIA}, ${idAntigo})`;

      expect(await remapDailyHistory(db, {})).toBe(0);
      expect(await historico()).toEqual([{ date: DIA, artwork_id: idAntigo }]);
    });
  });

  describe('replaceArtworkRedirects', () => {
    it('grava slug antigo, o UUID que ele tinha e o slug novo', async () => {
      const gravadas = await replaceArtworkRedirects(db, { [ANTIGO]: NOVO });

      expect(gravadas).toBe(1);
      expect(await redirecionamentos()).toEqual([{ old_slug: ANTIGO, old_id: artworkIdFromSlug(ANTIGO), new_slug: NOVO }]);
    });

    it('substitui o conteúdo anterior (rodar de novo dá o mesmo resultado)', async () => {
      await replaceArtworkRedirects(db, { [ANTIGO]: NOVO });
      await replaceArtworkRedirects(db, { [`${P}b`]: `${P}c` });
      await replaceArtworkRedirects(db, { [`${P}b`]: `${P}c` });

      expect((await redirecionamentos()).map((r) => r.old_slug)).toEqual([`${P}b`]);
    });

    it('mapa vazio limpa a tabela', async () => {
      await replaceArtworkRedirects(db, { [ANTIGO]: NOVO });
      await replaceArtworkRedirects(db, {});

      expect(await redirecionamentos()).toEqual([]);
    });
  });

  describe('dentro de uma transação (o que o DRY_RUN do reseed faz)', () => {
    it('tudo é desfeito quando a transação dá rollback', async () => {
      const idAntigo = await criarObra(ANTIGO);
      await criarObra(NOVO);
      await sql`INSERT INTO daily_artwork (date, artwork_id) VALUES (${DIA}, ${idAntigo})`;

      await db
        .transaction(async (tx) => {
          await remapDailyHistory(tx, { [ANTIGO]: NOVO });
          await replaceArtworkRedirects(tx, { [ANTIGO]: NOVO });
          tx.rollback();
        })
        .catch(() => undefined);

      expect(await historico()).toEqual([{ date: DIA, artwork_id: idAntigo }]);
      expect(await redirecionamentos()).toEqual([]);
    });
  });
});
