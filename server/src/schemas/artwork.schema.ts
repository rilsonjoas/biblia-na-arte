import { z } from 'zod';
import { paginationSchema } from './common.schema.js';

export const artworkCategorySchema = z.enum(['painting', 'music', 'film']);

export const listArtworksQuerySchema = paginationSchema.extend({
  category: artworkCategorySchema.optional(),
  bookSlug: z.string().min(1).max(100).optional(),
  chapter: z.coerce.number().int().positive().optional(),
  verses: z.string().max(50).optional(),
  artist: z.string().min(1).max(200).optional(),
});

export const searchArtworksQuerySchema = z.object({
  q: z.string().trim().min(2, 'busca precisa de pelo menos 2 caracteres').max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListArtworksQuery = z.infer<typeof listArtworksQuerySchema>;
export type SearchArtworksQuery = z.infer<typeof searchArtworksQuerySchema>;
