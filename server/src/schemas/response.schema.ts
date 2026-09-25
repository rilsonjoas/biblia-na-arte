import { z } from 'zod';
import { artworkCategorySchema } from './artwork.schema.js';

// Esquemas de RESPONSE — descrevem o que a API devolve de verdade (espelham
// db/schema.ts + queries.ts). Servem de input pro @fastify/swagger gerar o
// OpenAPI. Timestamps: o JSON serializa Date como ISO-8601.
const timestamp = z.string().datetime().or(z.string());

export const bibleReferenceResponseSchema = z.object({
  id: z.string().uuid(),
  artworkId: z.string().uuid(),
  book: z.string(),
  bookSlug: z.string(),
  chapter: z.number().int().positive(),
  verses: z.string().nullable().optional(),
  passageText: z.string().nullable().optional(),
  createdAt: timestamp.nullable().optional(),
});

export const artworkResponseSchema = z.object({
  id: z.string().uuid(),
  // Nullable: obra aprovada via submissão antes do backfill (ou se o
  // backfill não rodar) pode não ter slug ainda — `/obra/:id` cai pro
  // UUID nesse caso (ver getArtworkBySlugOrId).
  slug: z.string().nullable().optional(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  artistOrDirector: z.string(),
  year: z.string().nullable().optional(),
  category: artworkCategorySchema,
  mediumOrGenre: z.string().nullable().optional(),
  description: z.string(),
  imageUrl: z.string().nullable().optional(),
  embedUrl: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  dimensionsOrDuration: z.string().nullable().optional(),
  licenseType: z.string(),
  attributionText: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  period: z.string().nullable().optional(),
  tradition: z.string().nullable().optional(),
  technique: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  classicCommentaryAuthor: z.string().nullable().optional(),
  classicCommentary: z.string().nullable().optional(),
  createdAt: timestamp.nullable().optional(),
  updatedAt: timestamp.nullable().optional(),
  references: z.array(bibleReferenceResponseSchema),
});

export const artworkListResponseSchema = z.object({
  items: z.array(artworkResponseSchema),
  total: z.number().int().nonnegative(),
});

export const bibleBookResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  chapters: z.number().int().positive(),
  artworkCount: z.number().int().nonnegative(),
  testament: z.enum(['old', 'new']),
  createdAt: timestamp.nullable().optional(),
  // "Capa" translúcida no cardzinho de livro (roadmap, 2026-09-02).
  coverImageUrl: z.string().nullable(),
});

export const artistResponseSchema = z.object({
  name: z.string(),
  artworkCount: z.number().int().nonnegative(),
});

// "Filtros Avançados" (roadmap, Passo 2, 2026-09-02).
export const themeResponseSchema = z.object({
  slug: z.string(),
  name: z.string(),
  artworkCount: z.number().int().nonnegative(),
});

// Filtro "Período" (achado 2026-09-02, Rilson: lista de séculos hardcoded
// no front tinha ficado obsoleta). `century` é o número do século (ex. 19
// pra "século XIX") — o rótulo em algarismo romano é montado no frontend.
export const periodResponseSchema = z.object({
  century: z.number().int().positive(),
  artworkCount: z.number().int().nonnegative(),
});

// "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23).
export const artistDetailResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  bio: z.string().nullable(),
  artworks: z.array(artworkResponseSchema),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

// "Mapa de obras ↔ referências bíblicas" (/explorar, aprovada 2026-09-02).
// A passagem como hub do grafo: as obras dela + para onde é possível
// navegar a partir dela (outros capítulos do mesmo livro com arte e os
// temas presentes). Dado todo derivado de tabelas existentes — nada novo
// de schema, só agregação de conectividade.
export const exploreChapterResponseSchema = z.object({
  chapter: z.number().int().positive(),
  chapterCount: z.number().int().nonnegative(),
  coverImageUrl: z.string().nullable(),
});

export const exploreThemeResponseSchema = z.object({
  slug: z.string(),
  name: z.string(),
  artworkCount: z.number().int().nonnegative(),
});

// Tema dentro de CADA obra — não precisa de contagem (isso é da agregação
// `themes` do próprio hub), só identificação pra exibir chips na página.
export const exploreArtworkThemeResponseSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

export const exploreArtworkResponseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().nullable().optional(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  artistOrDirector: z.string(),
  year: z.string().nullable().optional(),
  category: artworkCategorySchema,
  imageUrl: z.string().nullable().optional(),
  themes: z.array(exploreArtworkThemeResponseSchema),
  references: z.array(bibleReferenceResponseSchema),
});

export const exploreResponseSchema = z.object({
  book: z.object({
    name: z.string(),
    slug: z.string(),
    testament: z.enum(['old', 'new']),
  }),
  chapter: z.number().int().positive(),
  artworks: z.array(exploreArtworkResponseSchema),
  relatedChapters: z.array(exploreChapterResponseSchema),
  themes: z.array(exploreThemeResponseSchema),
});

export const collectionResponseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  coverImage: z.string().nullable().optional(),
  artworkCount: z.number().int().nonnegative(),
});

export const collectionDetailResponseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  coverImage: z.string().nullable().optional(),
  artworks: z.array(artworkResponseSchema),
});
