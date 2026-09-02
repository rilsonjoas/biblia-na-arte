import { z } from 'zod';
import { paginationSchema } from './common.schema.js';

export const artworkCategorySchema = z.enum(['painting', 'music', 'film']);

export const listArtworksQuerySchema = paginationSchema.extend({
  category: artworkCategorySchema.optional(),
  bookSlug: z.string().min(1).max(100).optional(),
  chapter: z.coerce.number().int().positive().optional(),
  verses: z.string().max(50).optional(),
  // "Filtros Avançados" (roadmap, pedido do Rilson 2026-09-01): multiselect
  // de artista no frontend — vem como string separada por vírgula na
  // querystring (`?artists=Rembrandt,Caravaggio`), igual o padrão que
  // `bookSlug`/`chapter` já usam pra filtro simples, sem precisar de
  // array real na URL (Fastify aceita, mas complica o client). Nomes vêm
  // do endpoint `/artists` (já canônicos), então match é exato — não
  // precisa de ilike/substring aqui.
  artists: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined)),
  // "Filtros Avançados" (roadmap, Passo 2, 2026-09-02) — mesmo formato de
  // `artists` acima (string separada por vírgula), valores são slugs de
  // `/themes` (já vêm em minúsculo/hífen, não precisa de match exato vs.
  // ilike — filtra por igualdade na junção artwork_themes).
  themes: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined)),
  // Catálogo tem ~850 obras — o frontend ainda busca "tudo de uma vez"
  // pra filtrar/contar no cliente (Search, ArtCategories); teto mais alto
  // que o padrão genérico de paginação (100) só nesta rota.
  limit: z.coerce.number().int().min(1).max(1000).default(24),
});

export const searchArtworksQuerySchema = z.object({
  q: z.string().trim().min(2, 'busca precisa de pelo menos 2 caracteres').max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// `date` opcional só existe pra permitir testar/verificar a escolha de um
// dia específico sem esperar a virada — o uso normal (sem query param)
// usa a data UTC do servidor no momento da chamada.
export const dailyArtworkQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'use o formato YYYY-MM-DD')
    .optional(),
});

export type ListArtworksQuery = z.infer<typeof listArtworksQuerySchema>;
export type SearchArtworksQuery = z.infer<typeof searchArtworksQuerySchema>;
export type DailyArtworkQuery = z.infer<typeof dailyArtworkQuerySchema>;
