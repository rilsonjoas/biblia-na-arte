import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDailyArtwork } from './queries.js';

const MIGRATIONS_DIR = path.join(import.meta.dirname, 'migrations');

// Datas reais do Lecionário (src/data/daily-readings-refs.json):
//   2026-09-28: Salmo 42, Êxodo 18:1-12, Filipenses 1:3-14
//   2026-09-29: Salmo 42, Êxodo 18:13-27, Filipenses 1:15-21
const DIA_28 = '2026-09-28';
const DIA_29 = '2026-09-29';

// UUIDs fixos: a ordem dos ids define a ordem do pool (ORDER BY id).
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const JETRO = id(2); // única obra de Êxodo 18 — o caso real de 28 e 29/09
const FILIPENSES = id(3); // única obra de Filipenses 1
const OBRA_NOVA_EXODO = id(1); // entra em Êxodo 18 depois, ordena antes de JETRO

/** Cobre o bug de 28 e 29/09/2026: "Jetro aconselhando a Moisés" saiu dois
 *  dias seguidos porque Êxodo 18 tinha 1 obra só. Contra Postgres real —
 *  a garantia depende de gravar e reler `daily_artwork`, coisa que mock não
 *  valida. */
describe('getDailyArtwork — persistência e janela de não-repetição (Postgres real de teste)', () => {
  let sql: postgres.Sql;
  const criadas: string[] = [];
  // Outros arquivos de integração deixam obras semeadas no mesmo banco
  // (achado ao rodar a suíte inteira: uma obra de Filipenses 1 mudou a
  // posição de partida da rotação). Desativa as já existentes durante este
  // arquivo e reativa exatamente essas no fim, sem apagar dado alheio.
  let desativadasPorNos: string[] = [];

  async function criarObra(artworkId: string, titulo: string, livroSlug: string, capitulo: number) {
    await sql`
      INSERT INTO artworks (id, title, artist_or_director, category, description, image_url)
      VALUES (${artworkId}, ${titulo}, 'Artista de teste', 'painting', 'descrição', ${`/img/${artworkId}.jpg`})
    `;
    await sql`
      INSERT INTO bible_references (artwork_id, book, book_slug, chapter)
      VALUES (${artworkId}, ${livroSlug}, ${livroSlug}, ${capitulo})
    `;
    criadas.push(artworkId);
  }

  async function gravados(): Promise<{ date: string; artwork_id: string }[]> {
    return sql<{ date: string; artwork_id: string }[]>`
      SELECT to_char(date, 'YYYY-MM-DD') AS date, artwork_id FROM daily_artwork ORDER BY date
    `;
  }

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não definida nos testes de integração');
    sql = postgres(url, { max: 4 });
    await migrate(drizzle(sql), { migrationsFolder: MIGRATIONS_DIR });
    const rows = await sql<{ id: string }[]>`UPDATE artworks SET active = false WHERE active RETURNING id`;
    desativadasPorNos = rows.map((r) => r.id);
  });

  afterEach(async () => {
    await sql`DELETE FROM daily_artwork`;
    if (criadas.length > 0) await sql`DELETE FROM artworks WHERE id IN ${sql(criadas)}`;
    criadas.length = 0;
  });

  afterAll(async () => {
    if (desativadasPorNos.length > 0) {
      await sql`UPDATE artworks SET active = true WHERE id IN ${sql(desativadasPorNos)}`;
    }
    await sql.end();
  });

  it('não repete a obra do dia anterior quando o pool do capítulo tem uma obra só (28 e 29/09)', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    await criarObra(FILIPENSES, 'Obra de Filipenses', 'philippians', 1);

    const ontem = await getDailyArtwork(DIA_28, DIA_28);
    const hoje = await getDailyArtwork(DIA_29, DIA_29);

    expect(ontem?.id).toBe(JETRO);
    expect(hoje?.id).toBe(FILIPENSES); // sai das outras leituras do dia, não do capítulo repetido
  });

  it('grava a obra de hoje e devolve a mesma nas chamadas seguintes', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);

    const primeira = await getDailyArtwork(DIA_28, DIA_28);
    const segunda = await getDailyArtwork(DIA_28, DIA_28);

    expect(segunda?.id).toBe(primeira?.id);
    expect(await gravados()).toEqual([{ date: DIA_28, artwork_id: JETRO }]);
  });

  it('obra nova no pool depois do post não troca a obra já gravada do dia', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    const postada = await getDailyArtwork(DIA_29, DIA_29);
    expect(postada?.id).toBe(JETRO);

    // Pool vira [OBRA_NOVA_EXODO, JETRO]; seed de 29/09 é par, então o cálculo
    // sem persistência passaria a escolher OBRA_NOVA_EXODO.
    await criarObra(OBRA_NOVA_EXODO, 'Obra nova', 'exodus', 18);
    const depois = await getDailyArtwork(DIA_29, DIA_29);

    expect(depois?.id).toBe(JETRO);
  });

  it('datas futuras e passadas são calculadas sem gravar nada', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);

    const futura = await getDailyArtwork('2026-09-30', DIA_29);
    const passada = await getDailyArtwork('2026-09-01', DIA_29);

    expect(futura).toBeDefined();
    expect(passada).toBeDefined();
    expect(await gravados()).toEqual([]);
  });

  it('a prévia de amanhã leva em conta o que já foi gravado hoje', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    await criarObra(FILIPENSES, 'Obra de Filipenses', 'philippians', 1);
    await getDailyArtwork(DIA_28, DIA_28); // grava JETRO em 28/09

    const previaDe29 = await getDailyArtwork(DIA_29, DIA_28);

    expect(previaDe29?.id).toBe(FILIPENSES);
  });

  it('só considera as obras dos últimos 30 dias: 30 dias atrás bloqueia, 31 não', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    await criarObra(FILIPENSES, 'Obra de Filipenses', 'philippians', 1);

    await sql`INSERT INTO daily_artwork (date, artwork_id) VALUES ('2026-08-30', ${JETRO})`; // 30 dias antes de 29/09
    expect((await getDailyArtwork(DIA_29, DIA_29))?.id).toBe(FILIPENSES);

    await sql`DELETE FROM daily_artwork WHERE date = ${DIA_29}`;
    await sql`UPDATE daily_artwork SET date = '2026-08-29' WHERE date = '2026-08-30'`; // 31 dias antes
    expect((await getDailyArtwork(DIA_29, DIA_29))?.id).toBe(JETRO);
  });

  it('obra gravada que foi desativada (ex.: retirada por direitos autorais) é substituída', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    await criarObra(FILIPENSES, 'Obra de Filipenses', 'philippians', 1);
    expect((await getDailyArtwork(DIA_28, DIA_28))?.id).toBe(JETRO);

    await sql`UPDATE artworks SET active = false WHERE id = ${JETRO}`;
    const depois = await getDailyArtwork(DIA_28, DIA_28);

    expect(depois?.id).not.toBe(JETRO);
    expect(depois?.id).toBeDefined();
    expect(await gravados()).toEqual([{ date: DIA_28, artwork_id: depois!.id }]);
  });

  it('chamadas simultâneas no primeiro acesso do dia gravam uma linha só e devolvem a mesma obra', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    await criarObra(FILIPENSES, 'Obra de Filipenses', 'philippians', 1);

    const resultados = await Promise.all(Array.from({ length: 6 }, () => getDailyArtwork(DIA_28, DIA_28)));

    expect(new Set(resultados.map((r) => r?.id)).size).toBe(1);
    expect(await gravados()).toHaveLength(1);
  });

  it('sem leitura catalogada no dia, cai no acervo inteiro e também grava', async () => {
    await criarObra(FILIPENSES, 'Obra de Filipenses', 'philippians', 1);
    const semEntrada = '2035-03-03'; // fora do calendário do Lecionário

    const obra = await getDailyArtwork(semEntrada, semEntrada);

    expect(obra).toBeDefined();
    expect((await gravados()).map((g) => g.date)).toEqual([semEntrada]);
  });
});
