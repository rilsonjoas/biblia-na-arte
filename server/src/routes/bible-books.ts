import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { listBibleBooks, getBibleBookBySlug } from '../db/queries.js';
import { slugParamSchema } from '../schemas/common.schema.js';
import {
  bibleBookResponseSchema,
  errorResponseSchema,
} from '../schemas/response.schema.js';
import { NotFoundError } from '../plugins/error-handler.js';

const listQuerySchema = z.object({
  testament: z.enum(['old', 'new']).optional(),
});

const listQueryJson = zodToJsonSchema(listQuerySchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
const slugParamJson = zodToJsonSchema(slugParamSchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
const bibleBookJson = zodToJsonSchema(bibleBookResponseSchema, { $refStrategy: 'none' });
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

export async function bibleBookRoutes(app: FastifyInstance) {
  app.get(
    '/bible-books',
    {
      schema: {
        tags: ['livros'],
        summary: 'Lista os 66 livros bíblicos',
        description: 'Filtro opcional por testamento (old | new).',
        querystring: listQueryJson,
        response: { 200: { type: 'array', items: bibleBookJson }, 400: errorJson },
      },
    },
    async (request) => {
      const query = listQuerySchema.parse(request.query);
      return listBibleBooks(query.testament);
    },
  );

  app.get(
    '/bible-books/:slug',
    {
      schema: {
        tags: ['livros'],
        summary: 'Detalhes de um livro pelo slug',
        params: slugParamJson,
        response: { 200: bibleBookJson, 400: errorJson, 404: errorJson },
      },
    },
    async (request, reply) => {
      const { slug } = slugParamSchema.parse(request.params);
      const book = await getBibleBookBySlug(slug);
      if (!book) throw new NotFoundError('Livro bíblico');
      reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
      return book;
    },
  );
}
