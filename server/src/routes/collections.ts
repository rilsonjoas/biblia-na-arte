import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { listCollections, getCollectionDetail } from '../db/queries.js';
import {
  collectionResponseSchema,
  collectionDetailResponseSchema,
  errorResponseSchema,
} from '../schemas/response.schema.js';
import { NotFoundError } from '../plugins/error-handler.js';

const collectionsListJson = zodToJsonSchema(collectionResponseSchema, { $refStrategy: 'none' });
const collectionDetailJson = zodToJsonSchema(collectionDetailResponseSchema, { $refStrategy: 'none' });
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

const collectionParamsSchema = z.object({
  slug: z.string().min(1),
});

const collectionParamsJson = zodToJsonSchema(collectionParamsSchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});

export async function collectionRoutes(app: FastifyInstance) {
  app.get(
    '/collections',
    {
      schema: {
        tags: ['coleções'],
        summary: 'Lista coleções e trilhas temáticas curadas',
        description: 'Retorna a lista de coleções temáticas com resumo, imagem de capa e quantidade de obras.',
        response: {
          200: { type: 'array', items: collectionsListJson },
          400: errorJson,
        },
      },
    },
    async (_request, reply) => {
      const collections = await listCollections();
      reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
      return collections;
    },
  );

  app.get(
    '/collections/:slug',
    {
      schema: {
        tags: ['coleções'],
        summary: 'Obtém detalhes e obras de uma coleção temática',
        description: 'Retorna uma coleção temática com todas as obras vinculadas em ordem cronológica/narrativa.',
        params: collectionParamsJson,
        response: {
          200: collectionDetailJson,
          404: errorJson,
          400: errorJson,
        },
      },
    },
    async (request, reply) => {
      const { slug } = collectionParamsSchema.parse(request.params);
      const collection = await getCollectionDetail(slug);
      if (!collection) {
        throw new NotFoundError(`Coleção '${slug}'`);
      }
      reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
      return collection;
    },
  );
}
