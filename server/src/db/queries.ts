import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from './client.js';
import { artists, artworks, artworkThemes, bibleBooks, bibleReferences, themes } from './schema.js';
import type { ListArtworksQuery, SearchArtworksQuery } from '../schemas/artwork.schema.js';
import { getLectionaryEntry, parseLectionaryRef, SEASON_THEME_SLUGS } from '../lib/lectionary-refs.js';

type ArtworkRow = typeof artworks.$inferSelect;
type ReferenceRow = typeof bibleReferences.$inferSelect;

export type ArtworkWithReferences = ArtworkRow & { references: ReferenceRow[] };

export interface ExploreArtwork {
  id: string;
  title: string;
  subtitle: string | null;
  artistOrDirector: string;
  year: string | null;
  category: (typeof artworks.$inferSelect)['category'];
  imageUrl: string | null;
  themes: { slug: string; name: string }[];
  references: ReferenceRow[];
}

export interface ExploreChapterRow {
  chapter: number;
  chapterCount: number;
  coverImageUrl: string | null;
}

export interface ExploreThemeRow {
  slug: string;
  name: string;
  artworkCount: number;
}

/** Busca as referências bíblicas de um conjunto de obras e agrupa por artwork_id.
 *  Mesmo padrão em duas queries que o supabase-data.ts original usava —
 *  mantido de propósito por ser simples e já validado em produção, em vez
 *  de tentar um JOIN + agregação JSON só pra economizar uma query. */
async function attachReferences(rows: ArtworkRow[]): Promise<ArtworkWithReferences[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const refs = await db
    .select()
    .from(bibleReferences)
    .where(inArray(bibleReferences.artworkId, ids));

  const refsByArtwork = new Map<string, ReferenceRow[]>();
  for (const ref of refs) {
    const list = refsByArtwork.get(ref.artworkId) ?? [];
    list.push(ref);
    refsByArtwork.set(ref.artworkId, list);
  }

  return rows.map((row) => ({ ...row, references: refsByArtwork.get(row.id) ?? [] }));
}

export async function listArtworks(filters: ListArtworksQuery) {
  const conditions = [eq(artworks.active, true)];

  if (filters.category) conditions.push(eq(artworks.category, filters.category));
  if (filters.artists?.length) conditions.push(inArray(artworks.artistOrDirector, filters.artists));

  // Filtro por referência bíblica exige olhar bible_references primeiro,
  // depois restringir artworks pelos IDs encontrados.
  if (filters.bookSlug) {
    const refConditions = [eq(bibleReferences.bookSlug, filters.bookSlug)];
    if (filters.chapter) refConditions.push(eq(bibleReferences.chapter, filters.chapter));
    if (filters.verses) refConditions.push(eq(bibleReferences.verses, filters.verses));

    const matchingRefs = await db
      .select({ artworkId: bibleReferences.artworkId })
      .from(bibleReferences)
      .where(and(...refConditions));

    const artworkIds = [...new Set(matchingRefs.map((r) => r.artworkId))];
    if (artworkIds.length === 0) return { items: [], total: 0 };

    conditions.push(inArray(artworks.id, artworkIds));
  }

  // "Filtros Avançados" (roadmap, Passo 2, 2026-09-02) — "ou" entre os
  // temas escolhidos (mesma semântica do multiselect de artista), mesmo
  // padrão de subquery-depois-inArray do filtro de bookSlug acima.
  if (filters.themes?.length) {
    const matchingThemes = await db
      .select({ artworkId: artworkThemes.artworkId })
      .from(artworkThemes)
      .where(inArray(artworkThemes.themeSlug, filters.themes));

    const artworkIds = [...new Set(matchingThemes.map((r) => r.artworkId))];
    if (artworkIds.length === 0) return { items: [], total: 0 };

    conditions.push(inArray(artworks.id, artworkIds));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(artworks)
      .where(where)
      .orderBy(desc(artworks.createdAt))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db.select({ count: sql<number>`count(*)::int` }).from(artworks).where(where),
  ]);

  return { items: await attachReferences(rows), total: countResult[0]?.count ?? 0 };
}

export async function getArtworkById(id: string): Promise<ArtworkWithReferences | undefined> {
  const [row] = await db
    .select()
    .from(artworks)
    .where(and(eq(artworks.id, id), eq(artworks.active, true)))
    .limit(1);
  if (!row) return undefined;

  const [withRefs] = await attachReferences([row]);
  return withRefs;
}

/** Feature "Me surpreenda" (roadmap Fase 5, item de menor esforço).
 *  ORDER BY RANDOM() faz table scan completo, mas com ~850 obras isso é
 *  irrelevante (<1ms de diferença real) — não vale a complexidade de
 *  TABLESAMPLE só pra essa escala. Revisitar só se o acervo crescer bem
 *  além de milhares de linhas. */
export async function getRandomArtwork(): Promise<ArtworkWithReferences | undefined> {
  const [row] = await db
    .select()
    .from(artworks)
    .where(eq(artworks.active, true))
    .orderBy(sql`RANDOM()`)
    .limit(1);
  if (!row) return undefined;

  const [withRefs] = await attachReferences([row]);
  return withRefs;
}

/** Mesmo algoritmo de hash de data usado no Lecionário e no Gerador C.S.
 *  Lewis (getDateSeed em lecionario-web/src/lib/artwork-fetcher.ts e
 *  citação do dia) — replicado aqui de propósito pra manter o mesmo
 *  padrão de "seleção diária determinística" em todo o cluster Design
 *  Narniano, não é código compartilhado (cada projeto já duplica essa
 *  função por conta própria, ver comentário do artwork-fetcher.ts). */
function getDateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Pool de obras catalogadas num livro+capítulo, só as com imagem
 *  publicável — mesmo espírito do filtro de `listArtworks`, mas sem
 *  paginação/contagem (não precisa aqui) e com o `imageUrl IS NOT NULL`
 *  que lá não existe (aqui importa: nunca queremos escolher "a obra do
 *  dia" e ela não ter imagem pra mostrar). `orderBy(artworks.id)` pela
 *  mesma razão do `getDailyArtwork` — ordem estável pro `seed % length`
 *  ser reprodutível entre chamadas. */
async function getArtworkPoolForReference(bookSlug: string, chapter: number): Promise<ArtworkRow[]> {
  const matchingRefs = await db
    .select({ artworkId: bibleReferences.artworkId })
    .from(bibleReferences)
    .where(and(eq(bibleReferences.bookSlug, bookSlug), eq(bibleReferences.chapter, chapter)));

  const artworkIds = [...new Set(matchingRefs.map((r) => r.artworkId))];
  if (artworkIds.length === 0) return [];

  return db
    .select()
    .from(artworks)
    .where(and(eq(artworks.active, true), isNotNull(artworks.imageUrl), inArray(artworks.id, artworkIds)))
    .orderBy(artworks.id);
}

/** Entre as referências do dia (leituras do Lecionário pra essa data),
 *  fica com o MAIOR pool de obras — mesmo critério do
 *  `fetchArtworkForReferences` do Lecionário (ver ROADMAP dele,
 *  "Pintura do Dia repetindo"): se a 1ª leitura tiver 1 obra e o
 *  Evangelho tiver 13, usar o Evangelho é o que garante variar dia após
 *  dia. `break` cedo com pool >= 3 evita rodar as 4 queries sempre. */
async function getBestPoolForReferences(refs: string[]): Promise<ArtworkRow[]> {
  const seen = new Set<string>();
  let bestPool: ArtworkRow[] = [];

  for (const ref of refs) {
    const parsed = parseLectionaryRef(ref);
    if (!parsed) continue;

    const key = `${parsed.bookSlug}|${parsed.chapter}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const pool = await getArtworkPoolForReference(parsed.bookSlug, parsed.chapter);
    if (pool.length > bestPool.length) bestPool = pool;
    if (bestPool.length >= 3) break;
  }

  return bestPool;
}

/** Refinamento OPCIONAL: interssecciona um pool já calculado com os temas
 *  da estação (`SEASON_THEME_SLUGS`) — ex.: pool inteiro de João 1 (14
 *  obras, mistura Natividade com Paixão/Batismo) vira só "A Sagrada
 *  Família" no Natal (ROADMAP "Afinidade litúrgica da Pintura do Dia",
 *  2026-09-03, confirmado contra a API de produção antes de implementar).
 *  NUNCA devolve pool vazio quando o original não era — se a interseção
 *  zerar (nenhuma obra do capítulo tem a tag ainda), fica com o pool
 *  original sem tema. Refinamento é estritamente aditivo, nunca perde
 *  candidato. */
async function filterPoolByThemes(pool: ArtworkRow[], themeSlugs: string[]): Promise<ArtworkRow[]> {
  if (themeSlugs.length === 0 || pool.length === 0) return pool;

  const ids = pool.map((row) => row.id);
  const matches = await db
    .select({ artworkId: artworkThemes.artworkId })
    .from(artworkThemes)
    .where(and(inArray(artworkThemes.artworkId, ids), inArray(artworkThemes.themeSlug, themeSlugs)));

  const matchedIds = new Set(matches.map((m) => m.artworkId));
  if (matchedIds.size === 0) return pool;

  return pool.filter((row) => matchedIds.has(row.id));
}

/** "Pintura do Dia" — mesma obra pra todo mundo que visitar no mesmo
 *  `dateStr` (quem decide QUAL data é "hoje" é quem chama esta função —
 *  a rota usa `todaySaoPaulo()` em `lectionary-refs.ts`, não UTC; ver
 *  achado real em produção lá). Primeiro tenta ligar a escolha à leitura
 *  litúrgica do dia (tabela copiada do Lecionário, ver
 *  `lectionary-refs.ts` e ROADMAP "Pintura do Dia sumindo..."
 *  2026-09-02) — reverte a decisão de 2026-08-23 de sortear
 *  independente; agora as duas pontas mostram a MESMA obra, porque só
 *  esta função calcula a escolha (o Lecionário passa a só consumir este
 *  endpoint). Refinamento por cima da referência exata do dia: só
 *  interseccionar com o tema da estação quando existir (ver ROADMAP
 *  "Afinidade litúrgica da Pintura do Dia", 2026-09-03) —
 *  **DELIBERADAMENTE sem alargar pra estação inteira quando o pool for
 *  pequeno**: tentado e revertido no mesmo dia (mesma seção do
 *  ROADMAP) depois de um caso real em produção (03/09/2026: pool
 *  correto de 2 obras da 5ª praga do Egito, correspondente à leitura
 *  do dia, foi substituído por um pool "estação inteira" de tempo
 *  comum — metade do ano, sem coerência temática nenhuma — que caiu
 *  numa obra de Páscoa completamente sem relação). Pool pequeno mas
 *  certo é preferível a pool grande e aleatório: se a leitura exata do
 *  dia só tem 1-2 obras, mostra essas mesmo, sem variar mais que isso.
 *  Se a leitura do dia não tiver NENHUMA obra catalogada, cai pro
 *  sorteio aleatório sobre o acervo inteiro de sempre — nunca quebra.
 *  Ordena por id (UUID) pra ter uma ordem estável entre chamadas — sem
 *  isso, `seed % total` apontaria pra uma obra diferente a cada vez
 *  mesmo com o mesmo seed, porque a ordem "natural" das linhas no
 *  Postgres não é garantida entre queries. */
export async function getDailyArtwork(dateStr: string): Promise<ArtworkWithReferences | undefined> {
  const seed = getDateSeed(dateStr);

  const entry = getLectionaryEntry(dateStr);
  if (entry && entry.refs.length > 0) {
    const themeSlugs = SEASON_THEME_SLUGS[entry.season] ?? [];

    let pool = await getBestPoolForReferences(entry.refs);
    pool = await filterPoolByThemes(pool, themeSlugs);

    if (pool.length > 0) {
      const row = pool[seed % pool.length];
      if (row) {
        const [withRefs] = await attachReferences([row]);
        return withRefs;
      }
    }
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(artworks)
    .where(eq(artworks.active, true));
  const count = countRow?.count ?? 0;
  if (!count) return undefined;

  const offset = seed % count;

  const [row] = await db
    .select()
    .from(artworks)
    .where(eq(artworks.active, true))
    .orderBy(artworks.id)
    .limit(1)
    .offset(offset);
  if (!row) return undefined;

  const [withRefs] = await attachReferences([row]);
  return withRefs;
}

/** Usa a função search_artworks() (full-text search em português, com
 *  ranking) definida em db/custom-sql/functions.sql — SQL puro, não dá
 *  pra expressar ts_rank no query builder do Drizzle de forma limpa.
 *  Aliases explícitos pra devolver camelCase — sem isso, `db.execute` traz
 *  os nomes de coluna crus do Postgres (snake_case), inconsistente com o
 *  resto da API que passa pelo query builder do Drizzle. */
export async function searchArtworks({ q, limit }: SearchArtworksQuery) {
  const rows = await db.execute<ArtworkRow>(
    sql`SELECT
          id, title, subtitle,
          artist_or_director AS "artistOrDirector",
          year, category,
          medium_or_genre AS "mediumOrGenre",
          description,
          image_url AS "imageUrl",
          embed_url AS "embedUrl",
          source_url AS "sourceUrl",
          dimensions_or_duration AS "dimensionsOrDuration",
          license_type AS "licenseType",
          attribution_text AS "attributionText",
          location,
          classic_commentary_author AS "classicCommentaryAuthor",
          classic_commentary AS "classicCommentary",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM search_artworks(${q})
        WHERE active
        LIMIT ${limit}`,
  );

  return attachReferences(rows as unknown as ArtworkRow[]);
}

export interface BibleBookWithCount {
  id: string;
  name: string;
  slug: string;
  chapters: number;
  testament: 'old' | 'new';
  order: number;
  createdAt: string | null;
  artworkCount: number;
  // "Capa" translúcida no cardzinho de livro (roadmap, pedido do Rilson
  // 2026-09-02) — 1 imagem representativa por livro. Política de escolha
  // deliberadamente simples pro MVP: a obra ativa mais antiga cadastrada
  // pra esse livro que tenha imagem (ORDER BY created_at ASC), não a
  // "mais bonita" nem sorteio — sem esse tipo de sinal curado ainda. Fácil
  // de trocar depois (ex.: aleatório com seed estável, ou campo manual de
  // curadoria no vault) sem mudar o formato da resposta.
  coverImageUrl: string | null;
}

// Achado 2026-09-01 (pedido do Rilson): o card de livro na Galeria só
// mostrava "N capítulos" — sem noção de quanto do acervo cobre aquele
// livro. LEFT JOIN em vez de INNER pra livro sem nenhuma pintura ainda
// aparecer com 0, não sumir da lista; `a.active` filtra as excluídas pela
// auditoria de direitos autorais (mesma regra do resto da API).
export async function listBibleBooks(testament?: 'old' | 'new'): Promise<BibleBookWithCount[]> {
  const rows = await db.execute<Record<string, unknown>>(
    sql`SELECT
          bb.id, bb.name, bb.slug, bb.chapters, bb.testament, bb."order", bb.created_at AS "createdAt",
          count(DISTINCT br.artwork_id) FILTER (WHERE a.active)::int AS "artworkCount",
          (
            SELECT a2.image_url
            FROM bible_references br2
            JOIN artworks a2 ON a2.id = br2.artwork_id
            WHERE br2.book_slug = bb.slug AND a2.active AND a2.image_url IS NOT NULL
            ORDER BY a2.created_at ASC
            LIMIT 1
          ) AS "coverImageUrl"
        FROM bible_books bb
        LEFT JOIN bible_references br ON br.book_slug = bb.slug
        LEFT JOIN artworks a ON a.id = br.artwork_id
        WHERE ${testament ? sql`bb.testament = ${testament}` : sql`true`}
        GROUP BY bb.id
        ORDER BY bb."order"`,
  );
  return rows as unknown as BibleBookWithCount[];
}

// Achado 2026-09-01 (produção, HTTP 500 real em /bible-books/titus): ao
// adicionar `artworkCount` obrigatório no bibleBookResponseSchema, esqueci
// que ESSA função (usada pela rota de detalhe de 1 livro) também precisa
// dele — ela ainda fazia um select simples sem o campo, então a validação
// de resposta do Fastify rejeitava tudo com 500 (schema exige o campo,
// dado não tinha). Mesma lógica de contagem de `listBibleBooks`, só que
// filtrando por slug em vez de listar todos.
export async function getBibleBookBySlug(slug: string): Promise<BibleBookWithCount | undefined> {
  const rows = await db.execute<Record<string, unknown>>(
    sql`SELECT
          bb.id, bb.name, bb.slug, bb.chapters, bb.testament, bb."order", bb.created_at AS "createdAt",
          count(DISTINCT br.artwork_id) FILTER (WHERE a.active)::int AS "artworkCount",
          (
            SELECT a2.image_url
            FROM bible_references br2
            JOIN artworks a2 ON a2.id = br2.artwork_id
            WHERE br2.book_slug = bb.slug AND a2.active AND a2.image_url IS NOT NULL
            ORDER BY a2.created_at ASC
            LIMIT 1
          ) AS "coverImageUrl"
        FROM bible_books bb
        LEFT JOIN bible_references br ON br.book_slug = bb.slug
        LEFT JOIN artworks a ON a.id = br.artwork_id
        WHERE bb.slug = ${slug}
        GROUP BY bb.id`,
  );
  return (rows as unknown as BibleBookWithCount[])[0];
}

export interface ArtistAggregate {
  name: string;
  artworkCount: number;
}

export async function listArtists(): Promise<ArtistAggregate[]> {
  const rows = await db.execute<{ name: string; artworkCount: number }>(
    sql`SELECT
          artist_or_director AS "name",
          count(*)::int AS "artworkCount"
        FROM artworks
        WHERE active AND artist_or_director IS NOT NULL AND artist_or_director != ''
        GROUP BY artist_or_director
        ORDER BY count(*) DESC, artist_or_director ASC`
  );
  return rows as unknown as ArtistAggregate[];
}

export interface ThemeAggregate {
  slug: string;
  name: string;
  artworkCount: number;
}

// "Filtros Avançados" (roadmap, Passo 2, 2026-09-02) — mesmo padrão de
// `listArtists()`: contagem sempre calculada ao vivo via JOIN, nunca
// guardada. LEFT JOIN (não INNER) pra um tema sem obra ativa ainda
// aparecer com artworkCount=0 em vez de sumir da lista.
export async function listThemes(): Promise<ThemeAggregate[]> {
  const rows = await db.execute<{ slug: string; name: string; artworkCount: number }>(
    sql`SELECT
          t.slug, t.name,
          count(DISTINCT at.artwork_id) FILTER (WHERE a.active)::int AS "artworkCount"
        FROM themes t
        LEFT JOIN artwork_themes at ON at.theme_slug = t.slug
        LEFT JOIN artworks a ON a.id = at.artwork_id
        GROUP BY t.slug, t.name
        ORDER BY "artworkCount" DESC, t.name ASC`,
  );
  return rows as unknown as ThemeAggregate[];
}

export interface PeriodAggregate {
  century: number;
  artworkCount: number;
}

// Filtro "Período" da busca avançada (achado 2026-09-02, Rilson: a lista de
// séculos no front era hardcoded e ficou obsoleta — faltavam IV, XII-XIV,
// XIX (quase metade do acervo, todo o Doré), XX e XXI, e "século IX" não
// tem nenhuma obra). Mesmo padrão de `listArtists()`/`listThemes()`:
// calculado ao vivo a partir do `year` (texto livre, ex. "c.1635"),
// nunca hardcoded de novo. Extrai o primeiro número de 3-4 dígitos e
// converte pra século usando a convenção "início da década" já documentada
// em `CENTURY_RANGES` no frontend (ex. "século XVII" = 1600-1699), não a
// convenção estrita de historiador (1601-1700) — os dois cálculos
// concordam pra qualquer ano exceto múltiplos exatos de 100.
export async function listPeriods(): Promise<PeriodAggregate[]> {
  const rows = await db.execute<{ century: number; artworkCount: number }>(
    sql`SELECT
          (substring(year FROM '\\d{3,4}')::int / 100) + 1 AS century,
          count(*)::int AS "artworkCount"
        FROM artworks
        WHERE active AND year IS NOT NULL AND year ~ '\\d{3,4}'
        GROUP BY century
        ORDER BY century ASC`,
  );
  return rows as unknown as PeriodAggregate[];
}

export interface ArtistDetail {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  artworks: ArtworkWithReferences[];
}

// "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23). Casa a
// galeria de obras por NOME exato (`eq`, não `ilike` parcial como o
// filtro de busca usa) — a página de um artista específico não deve
// puxar obra de outro artista com nome parecido.
export async function getArtistBySlug(slug: string): Promise<ArtistDetail | undefined> {
  const [artist] = await db.select().from(artists).where(eq(artists.slug, slug)).limit(1);
  if (!artist) return undefined;

  const rows = await db
    .select()
    .from(artworks)
    .where(and(eq(artworks.active, true), eq(artworks.artistOrDirector, artist.name)))
    .orderBy(desc(artworks.createdAt));

  return {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    bio: artist.bio,
    artworks: await attachReferences(rows),
  };
}

// "Mapa de obras ↔ referências bíblicas" (/explorar, aprovada 2026-09-02).
// Expressa o grafo da passagem como dados prontos pra uma página navegável:
// as obras daquele capítulo (com temas e referências) + uma visão agregada
// de por onde dá pra continuar navegando (outros capítulos do livro com
// arte; temas presentes no grupo). Nada novo de schema — só conectividade
// derivada das tabelas existentes. `chapters` vem de bible_books pra página
// validar capítulo fora do intervalo; se o livro não existir, retorna
// undefined (rota responde 404).
export async function getExploreByChapter(
  bookSlug: string,
  chapter: number,
): Promise<
  | {
      bookName: string;
      testament: 'old' | 'new';
      chapters: number;
      artworks: ExploreArtwork[];
      relatedChapters: ExploreChapterRow[];
      themes: ExploreThemeRow[];
    }
  | undefined
> {
  const [book] = await db
    .select({ name: bibleBooks.name, testament: bibleBooks.testament, chapters: bibleBooks.chapters })
    .from(bibleBooks)
    .where(eq(bibleBooks.slug, bookSlug))
    .limit(1);
  if (!book) return undefined;

  const [activeRows, relatedRows, themeRows] = await Promise.all([
    // Obras ativas do capítulo.
    db
      .select()
      .from(artworks)
      .where(
        and(
          eq(artworks.active, true),
          inArray(
            artworks.id,
            sql`(SELECT art_id FROM (
              SELECT br.artwork_id AS art_id
              FROM bible_references br
              JOIN artworks a ON a.id = br.artwork_id
              WHERE br.book_slug = ${bookSlug} AND br.chapter = ${chapter} AND a.active
            ) sub)`,
          ),
        ),
      )
      .orderBy(desc(artworks.createdAt)),
    // Outros capítulos do mesmo livro com pelo menos 1 obra ativa, com
    // contagem e uma obra-exemplo com imagem pra miniatura (mesma política
    // de "capa" do BibleBook: a mais antiga com imagem).
    db.execute<Record<string, unknown>>(sql`
      SELECT br.chapter AS "chapter",
             count(DISTINCT br.artwork_id)::int AS "chapterCount",
             (
               SELECT a2.image_url
               FROM bible_references br2
               JOIN artworks a2 ON a2.id = br2.artwork_id
               WHERE br2.book_slug = ${bookSlug} AND br2.chapter = br.chapter
                 AND a2.active AND a2.image_url IS NOT NULL
               ORDER BY a2.created_at ASC
               LIMIT 1
             ) AS "coverImageUrl"
      FROM bible_references br
      JOIN artworks a ON a.id = br.artwork_id
      WHERE br.book_slug = ${bookSlug}
        AND br.chapter <> ${chapter}
        AND a.active
      GROUP BY br.chapter
      ORDER BY br.chapter ASC`),
    // Temas presentes nas obras deste capítulo, com contagem ao vivo
    // (mesmo princípio de artists/themes: nunca guardar contagem).
    db.execute<Record<string, unknown>>(sql`
      SELECT t.slug, t.name,
             count(DISTINCT at.artwork_id)::int AS "artworkCount"
      FROM themes t
      JOIN artwork_themes at ON at.theme_slug = t.slug
      JOIN artworks a ON a.id = at.artwork_id
      JOIN bible_references br ON br.artwork_id = a.id
      WHERE br.book_slug = ${bookSlug} AND br.chapter = ${chapter} AND a.active
      GROUP BY t.slug, t.name
      ORDER BY "artworkCount" DESC, t.name ASC`),
  ]);

  // Anexa temas + referências a cada obra do capítulo.
  const artworksWithRefs = await attachReferences(activeRows);
  const themeIds = [...new Set(activeRows.map((r) => r.id))];
  const themeLinks = themeIds.length
    ? await db
        .select({ artworkId: artworkThemes.artworkId, slug: themes.slug, name: themes.name })
        .from(artworkThemes)
        .innerJoin(themes, eq(themes.slug, artworkThemes.themeSlug))
        .where(inArray(artworkThemes.artworkId, themeIds))
    : [];

  const themesByArtwork = new Map<string, { slug: string; name: string }[]>();
  for (const link of themeLinks) {
    const list = themesByArtwork.get(link.artworkId) ?? [];
    list.push({ slug: link.slug, name: link.name });
    themesByArtwork.set(link.artworkId, list);
  }

  const artworksOut: ExploreArtwork[] = artworksWithRefs.map((art) => ({
    id: art.id,
    title: art.title,
    subtitle: art.subtitle,
    artistOrDirector: art.artistOrDirector,
    year: art.year,
    category: art.category,
    imageUrl: art.imageUrl,
    themes: themesByArtwork.get(art.id) ?? [],
    references: art.references,
  }));

  return {
    bookName: book.name,
    testament: book.testament,
    chapters: book.chapters,
    artworks: artworksOut,
    relatedChapters: relatedRows as unknown as ExploreChapterRow[],
    themes: themeRows as unknown as ExploreThemeRow[],
  };
}
