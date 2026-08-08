import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { errorResponseSchema } from '../schemas/response.schema.js';

const healthResponseJson = zodToJsonSchema(z.object({ status: z.string() }), {
  $refStrategy: 'none',
});
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

export async function healthRoutes(app: FastifyInstance) {
  app.get(
    '/health',
    {
      schema: {
        tags: ['saude'],
        summary: 'Health check',
        response: { 200: healthResponseJson, 500: errorJson },
      },
    },
    async () => ({ status: 'ok' }),
  );
}
