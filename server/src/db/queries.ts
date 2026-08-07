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
  const conditions = [];

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
  const [row] = await db.select().from(artworks).where(eq(artworks.id, id)).limit(1);
  if (!row) return undefined;

  const [withRefs] = await attachReferences([row]);
  return withRefs;
}

/** Usa a função search_artworks() (full-text search em português, com
 *  ranking) definida em db/custom-sql/functions.sql — SQL puro, não dá
 *  pra expressar ts_rank no query builder do Drizzle de forma limpa. */
export async function searchArtworks({ q, limit }: SearchArtworksQuery) {
  const rows = await db.execute<ArtworkRow>(
    sql`SELECT id, title, artist_or_director, year, category, medium_or_genre,
               description, image_url, embed_url, source_url,
               dimensions_or_duration, license_type, attribution_text,
               created_at, updated_at
        FROM search_artworks(${q})
        LIMIT ${limit}`,
  );

  return attachReferences(rows as unknown as ArtworkRow[]);
}

export async function listBibleBooks(testament?: 'old' | 'new') {
  return db
    .select()
    .from(bibleBooks)
    .where(testament ? eq(bibleBooks.testament, testament) : undefined)
    .orderBy(bibleBooks.testament, bibleBooks.name);
}

export async function getBibleBookBySlug(slug: string) {
  const [row] = await db.select().from(bibleBooks).where(eq(bibleBooks.slug, slug)).limit(1);
  return row;
}
