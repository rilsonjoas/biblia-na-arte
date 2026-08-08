import { z } from 'zod';

export const bibleVerseResponseSchema = z.object({
  verse: z.number().int().positive(),
  text: z.string(),
});

export const biblePassageResponseSchema = z.object({
  reference: z.string(),
  translation: z.string(),
  bookSlug: z.string(),
  chapter: z.number().int().positive(),
  verses: z.array(bibleVerseResponseSchema),
});

export const bibleTextParamsSchema = z.object({
  bookSlug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slug só pode ter letras minúsculas, números e hífen'),
  chapter: z.coerce.number().int().positive(),
});
