import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDailyArtwork } from './queries.js';
import { getDateSeed } from '../lib/daily-artwork.js';

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

  async function criarObra(
    artworkId: string,
    titulo: string,
    livroSlug: string,
    capitulo: number,
    comImagem = true,
  ) {
    await sql`
      INSERT INTO artworks (id, title, artist_or_director, category, description, image_url)
      VALUES (${artworkId}, ${titulo}, 'Artista de teste', 'painting', 'descrição', ${comImagem ? `/img/${artworkId}.jpg` : null})
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

  // Quem cadastra uma obra pode deixá-la incompleta (sem imagem) ou desativá-la. O pool precisa ignorar
  // essas obras, senão a Pintura do Dia mostra um quadro sem imagem. Datas escolhidas para a obra ruim
  // ser a primeira do pool (seed par, ordenada antes de JETRO): sem o filtro, ela seria a escolhida.
  it('obra sem imagem NÃO entra no pool do capítulo', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    await criarObra(OBRA_NOVA_EXODO, 'Obra sem imagem', 'exodus', 18, false);

    expect(getDateSeed(DIA_29) % 2).toBe(0); // 1ª do pool = a obra sem imagem, se não fosse filtrada
    const obra = await getDailyArtwork(DIA_29, DIA_29);
    expect(obra?.id).toBe(JETRO);
  });

  it('obra inativa NÃO entra no pool do capítulo', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    await criarObra(OBRA_NOVA_EXODO, 'Obra inativa', 'exodus', 18);
    await sql`UPDATE artworks SET active = false WHERE id = ${OBRA_NOVA_EXODO}`;

    const obra = await getDailyArtwork(DIA_29, DIA_29);
    expect(obra?.id).toBe(JETRO);
  });

  it('obra sem imagem NÃO entra no sorteio do acervo inteiro (dia sem leitura catalogada)', async () => {
    await criarObra(JETRO, 'Jetro aconselhando a Moisés', 'exodus', 18);
    await criarObra(OBRA_NOVA_EXODO, 'Obra sem imagem', 'exodus', 18, false);

    // dia fora da tabela de leituras (cai no pool global [OBRA_NOVA_EXODO, JETRO] por id) com seed par
    const dia = Array.from({ length: 28 }, (_, i) => `2031-07-${String(i + 1).padStart(2, '0')}`).find(
      (d) => getDateSeed(d) % 2 === 0,
    )!;
    expect(dia).toBeDefined();

    const obra = await getDailyArtwork(dia, dia);
    expect(obra?.id).toBe(JETRO);
  });

  // Janela de gravação (F6b): fora do calendário do Lecionário, sorteio sobre o acervo. Pool maior que a
  // janela de não repetição, para toda escolha ser distinta e a sequência ficar determinística.
  const HOJE = '2035-03-01';
  const dia = (n: number) => `2035-03-${String(n).padStart(2, '0')}`;
  const poolId = (n: number) => id(1000 + n);

  async function criarPool(tamanho: number, de = 0) {
    for (let i = de; i < de + tamanho; i++) await criarObra(poolId(i), `Obra ${i}`, 'genesis', 1);
  }

  async function sequenciaGravada(): Promise<string[]> {
    return (await gravados()).map((g) => g.artwork_id);
  }

  it('grava de hoje até a data pedida dentro dos próximos 30 dias; passado e além disso só calculam', async () => {
    await criarPool(40);

    expect(await getDailyArtwork(dia(4), HOJE)).toBeDefined();
    expect((await gravados()).map((g) => g.date)).toEqual([dia(1), dia(2), dia(3), dia(4)]);

    expect(await getDailyArtwork('2035-02-01', HOJE)).toBeDefined(); // passado
    expect(await gravados()).toHaveLength(4);

    expect(await getDailyArtwork(dia(31), HOJE)).toBeDefined(); // hoje + 30: grava tudo
    expect(await gravados()).toHaveLength(31);

    expect(await getDailyArtwork('2035-04-01', HOJE)).toBeDefined(); // hoje + 31: só calcula
    expect(await gravados()).toHaveLength(31);
  });

  it('pedir um dia distante primeiro dá a mesma sequência de pedir dia a dia', async () => {
    await criarPool(40);
    for (let n = 1; n <= 10; n++) await getDailyArtwork(dia(n), HOJE);
    const diaADia = await sequenciaGravada();
    await sql`DELETE FROM daily_artwork`;

    await getDailyArtwork(dia(10), HOJE);

    expect(await sequenciaGravada()).toEqual(diaADia);
    expect(new Set(diaADia).size).toBe(10);
  });

  it('obra de um dia futuro retirada por direitos: o dia é recalculado, os outros não mudam e nada repete na janela', async () => {
    await criarPool(4);
    await getDailyArtwork(dia(3), HOJE); // dias 1, 2 e 3 gravados; sobra 1 obra do pool
    const antes = await gravados();
    const escolhaDoDia2 = antes[1]!.artwork_id;
    const sobra = [0, 1, 2, 3].map(poolId).find((a) => !antes.some((g) => g.artwork_id === a))!;

    await sql`UPDATE artworks SET active = false WHERE id = ${escolhaDoDia2}`;
    const depois = await getDailyArtwork(dia(2), HOJE);

    expect(depois?.id).toBe(sobra); // a única que não repete nem o dia 1 nem o dia 3
    const gravadosDepois = await gravados();
    expect(gravadosDepois.map((g) => g.date)).toEqual([dia(1), dia(2), dia(3)]);
    expect(gravadosDepois[0]).toEqual(antes[0]);
    expect(gravadosDepois[2]).toEqual(antes[2]);
    expect(gravadosDepois[1]!.artwork_id).toBe(sobra);
  });

  it('chamadas simultâneas de datas diferentes gravam uma linha por dia, com as escolhas da sequência', async () => {
    await criarPool(40);
    for (let n = 1; n <= 8; n++) await getDailyArtwork(dia(n), HOJE);
    const esperado = await sequenciaGravada();
    await sql`DELETE FROM daily_artwork`;

    const datas = [3, 5, 2, 8, 8, 1, 4, 6, 7, 5].map(dia);
    await Promise.all(datas.map((d) => getDailyArtwork(d, HOJE)));

    expect(await gravados()).toHaveLength(8);
    expect(await sequenciaGravada()).toEqual(esperado);
  });

  it('obra nova no acervo não muda os dias futuros já gravados', async () => {
    await criarPool(40);
    await getDailyArtwork(dia(5), HOJE);
    const antes = await gravados();

    await criarPool(15, 100);
    await getDailyArtwork(dia(5), HOJE);

    expect(await gravados()).toEqual(antes);
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
