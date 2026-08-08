import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { listArtists } from '../db/queries.js';
import { artistResponseSchema, errorResponseSchema } from '../schemas/response.schema.js';

const artistJson = zodToJsonSchema(artistResponseSchema, { $refStrategy: 'none' });
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

export async function artistRoutes(app: FastifyInstance) {
  app.get(
    '/artists',
    {
      schema: {
        tags: ['artistas'],
        summary: 'Lista artistas e quantidade de obras',
        description: 'Retorna a lista de todos os artistas catalogados com a contagem de obras de cada um.',
        response: {
          200: { type: 'array', items: artistJson },
          400: errorJson,
        },
      },
    },
    async (_request, reply) => {
      const artists = await listArtists();
      reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
      return artists;
    },
  );
}
