import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getExploreByChapter } from '../db/queries.js';
import { exploreParamsSchema } from '../schemas/common.schema.js';
import { exploreResponseSchema, errorResponseSchema } from '../schemas/response.schema.js';
import { NotFoundError } from '../plugins/error-handler.js';

const exploreParamsJson = zodToJsonSchema(exploreParamsSchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
const exploreJson = zodToJsonSchema(exploreResponseSchema, { $refStrategy: 'none' });
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

// "Mapa de obras ↔ referências bíblicas" (/explorar, aprovada 2026-09-02).
// A passagem como hub do grafo de conectividade: obras do capítulo + outros
// capítulos do livro com arte + temas presentes. Dado estático de curadoria
// (muda só com re-export), então cache HTTP longo como as outras rotas de
// conteúdo curado.
export async function exploreRoutes(app: FastifyInstance) {
  app.get(
    '/explore/:bookSlug/:chapter',
    {
      schema: {
        tags: ['explorar'],
        summary: 'Mapa de conectividade de uma passagem bíblica',
        description:
          'Obras do capítulo (com temas e referências), outros capítulos do mesmo livro com arte (para navegação) e os temas presentes nas obras desta passagem.',
        params: exploreParamsJson,
        response: { 200: exploreJson, 400: errorJson, 404: errorJson },
      },
    },
    async (request, reply) => {
      const { bookSlug, chapter } = exploreParamsSchema.parse(request.params);
      const explore = await getExploreByChapter(bookSlug, chapter);
      if (!explore) throw new NotFoundError('Livro');
      if (chapter > explore.chapters) {
        throw new NotFoundError(`Capítulo ${chapter} de ${explore.bookName}`);
      }

      const body = {
        book: {
          name: explore.bookName,
          slug: bookSlug,
          testament: explore.testament,
        },
        chapter,
        artworks: explore.artworks,
        relatedChapters: explore.relatedChapters,
        themes: explore.themes,
      };

      reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
      return body;
    },
  );
}
