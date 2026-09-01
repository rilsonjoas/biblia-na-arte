import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { db } from './client.js';
import { artworks, bibleReferences, bibleBooks } from './schema.js';
import type { ListArtworksQuery, SearchArtworksQuery } from '../schemas/artwork.schema.js';

type ArtworkRow = typeof artworks.$inferSelect;
type ReferenceRow = typeof bibleReferences.$inferSelect;

export type ArtworkWithReferences = ArtworkRow & { references: ReferenceRow[] };

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
  if (filters.artist) conditions.push(ilike(artworks.artistOrDirector, `%${filters.artist}%`));

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
 *  função por conta própria, ver comentário do artwork-fetcher.ts).
 *  Decisão consciente 2026-08-23: NÃO tenta replicar a mesma obra que o
 *  Lecionário mostra no mesmo dia (lá a escolha depende da leitura
 *  litúrgica do dia, que a Bíblia na Arte não tem) — é um sorteio
 *  independente sobre o acervo inteiro, mesmo algoritmo, resultado
 *  diferente por design. */
function getDateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** "Pintura do Dia" — mesma obra pra todo mundo que visitar no mesmo dia
 *  (UTC), muda à meia-noite. Ordena por id (UUID) pra ter uma ordem
 *  estável entre chamadas — sem isso, `seed % total` apontaria pra uma
 *  obra diferente a cada vez mesmo com o mesmo seed, porque a ordem
 *  "natural" das linhas no Postgres não é garantida entre queries. */
export async function getDailyArtwork(dateStr: string): Promise<ArtworkWithReferences | undefined> {
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(artworks)
    .where(eq(artworks.active, true));
  const count = countRow?.count ?? 0;
  if (!count) return undefined;

  const seed = getDateSeed(dateStr);
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
          count(DISTINCT br.artwork_id) FILTER (WHERE a.active)::int AS "artworkCount"
        FROM bible_books bb
        LEFT JOIN bible_references br ON br.book_slug = bb.slug
        LEFT JOIN artworks a ON a.id = br.artwork_id
        WHERE ${testament ? sql`bb.testament = ${testament}` : sql`true`}
        GROUP BY bb.id
        ORDER BY bb."order"`,
  );
  return rows as unknown as BibleBookWithCount[];
}

export async function getBibleBookBySlug(slug: string) {
  const [row] = await db.select().from(bibleBooks).where(eq(bibleBooks.slug, slug)).limit(1);
  return row;
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
