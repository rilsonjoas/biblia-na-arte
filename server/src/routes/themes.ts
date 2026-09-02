import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { listThemes } from '../db/queries.js';
import { themeResponseSchema, errorResponseSchema } from '../schemas/response.schema.js';

const themeJson = zodToJsonSchema(themeResponseSchema, { $refStrategy: 'none' });
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

// "Filtros Avançados" (roadmap, Passo 2, 2026-09-02) — mesmo padrão de
// GET /artists: lista agregada com contagem, usada pra popular o
// multiselect de tema em /busca.
export async function themeRoutes(app: FastifyInstance) {
  app.get(
    '/themes',
    {
      schema: {
        tags: ['temas'],
        summary: 'Lista temas bíblicos e quantidade de obras',
        description: 'Retorna a lista de todos os temas catalogados (extraídos das tags do vault) com a contagem de obras de cada um, ordenada por frequência.',
        response: {
          200: { type: 'array', items: themeJson },
          400: errorJson,
        },
      },
    },
    async (_request, reply) => {
      const themes = await listThemes();
      reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
      return themes;
    },
  );
}
