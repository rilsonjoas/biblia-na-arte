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

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // Limite máximo travado em 100 — evita que alguém peça a coleção
  // inteira numa página só e sobrecarregue o VPS.
  limit: z.coerce.number().int().min(1).max(100).default(24),
});
