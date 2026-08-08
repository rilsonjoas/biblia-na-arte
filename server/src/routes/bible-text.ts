import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  biblePassageResponseSchema,
  bibleTextParamsSchema,
} from '../schemas/bible-text.schema.js';
import { errorResponseSchema } from '../schemas/response.schema.js';
import { fetchBiblePassage } from '../lib/bible-api.js';

const bibleTextParamsJson = zodToJsonSchema(bibleTextParamsSchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
const passageJson = zodToJsonSchema(biblePassageResponseSchema, { $refStrategy: 'none' });
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

export async function bibleTextRoutes(app: FastifyInstance) {
  app.get(
    '/bible-text/:bookSlug/:chapter',
    {
      schema: {
        tags: ['biblia'],
        summary: 'Texto bíblico de um capítulo (tradução Almeida)',
        description:
          'Proxy para a Bible-API (bible-api.com). Devolve os versículos do capítulo na tradução João Ferreira de Almeida, domínio público, com cache no servidor.',
        params: bibleTextParamsJson,
        response: { 200: passageJson, 400: errorJson, 404: errorJson, 502: errorJson },
      },
    },
    async (request, reply) => {
      const { bookSlug, chapter } = bibleTextParamsSchema.parse(request.params);
      const passage = await fetchBiblePassage(bookSlug, chapter);
      // Texto bíblico praticamente imutável + cache em memória: cache HTTP
      // agressivo e seguro.
      reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
      return passage;
    },
  );
}
