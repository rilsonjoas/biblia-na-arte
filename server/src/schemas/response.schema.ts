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
  testament: z.enum(['old', 'new']),
  createdAt: timestamp.nullable().optional(),
});

export const artistResponseSchema = z.object({
  name: z.string(),
  artworkCount: z.number().int().nonnegative(),
});

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
