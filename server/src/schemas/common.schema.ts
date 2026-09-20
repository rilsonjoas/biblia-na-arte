import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('id precisa ser um UUID válido'),
});

export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slug só pode ter letras minúsculas, números e hífen'),
});

// `/obra/:id` aceita UUID (link antigo, já indexado) OU slug (padrão
// novo, URL amigável — ver ADR 004 e getArtworkBySlugOrId). Um UUID já é
// só letras minúsculas/dígitos/hífen, então a mesma regex do slug cobre
// os dois formatos aqui; quem decide qual coluna consultar é
// `looksLikeUuid`, não este schema.
export const idOrSlugParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9-]+$/, 'id precisa ser um UUID ou um slug válido'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // Limite máximo travado em 100 — evita que alguém peça a coleção
  // inteira numa página só e sobrecarregue o VPS.
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

// "Mapa de obras ↔ referências bíblicas" (/explorar, aprovada 2026-09-02).
// Params da rota de capítulo — mesmo formato de slug do resto da API e
// capítulo como inteiro positivo (não usar coerce no parachapter: params
// de rota chegam como string e o Fastify só aceita se o Zod validar; o
// resto da rota de capítulo de /biblia faz Number() manual, aqui fazemos
// no Zod direto).
export const exploreParamsSchema = z.object({
  bookSlug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slugs só podem ter letras minúsculas, números e hífen'),
  chapter: z.coerce.number().int().positive(),
});
