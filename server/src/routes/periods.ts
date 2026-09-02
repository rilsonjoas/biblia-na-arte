import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { listPeriods } from '../db/queries.js';
import { periodResponseSchema, errorResponseSchema } from '../schemas/response.schema.js';

const periodJson = zodToJsonSchema(periodResponseSchema, { $refStrategy: 'none' });
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

// "Filtros Avançados" — correção do achado 2026-09-02 (Rilson): a lista de
// séculos do filtro "Período" era hardcoded no frontend e tinha ficado
// obsoleta (faltavam os séculos IV, XII-XIV, XIX, XX e XXI; "século IX"
// não tem nenhuma obra). Mesmo padrão de GET /themes: lista agregada
// calculada ao vivo, usada pra popular o Select de período em /busca.
export async function periodRoutes(app: FastifyInstance) {
  app.get(
    '/periods',
    {
      schema: {
        tags: ['períodos'],
        summary: 'Lista séculos representados no acervo e quantidade de obras',
        description:
          'Retorna a lista de séculos (calculados a partir do ano de cada obra) com a contagem de obras de cada um, ordenada cronologicamente.',
        response: {
          200: { type: 'array', items: periodJson },
          400: errorJson,
        },
      },
    },
    async (_request, reply) => {
      const periods = await listPeriods();
      reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
      return periods;
    },
  );
}
