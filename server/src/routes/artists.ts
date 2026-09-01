import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getArtistBySlug, listArtists } from '../db/queries.js';
import { slugParamSchema } from '../schemas/common.schema.js';
import {
  artistDetailResponseSchema,
  artistResponseSchema,
  errorResponseSchema,
} from '../schemas/response.schema.js';
import { NotFoundError } from '../plugins/error-handler.js';

const artistJson = zodToJsonSchema(artistResponseSchema, { $refStrategy: 'none' });
const artistDetailJson = zodToJsonSchema(artistDetailResponseSchema, { $refStrategy: 'none' });
const slugParamJson = zodToJsonSchema(slugParamSchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
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

  // "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23) — mínimo
  // viável: biografia (quando existe no vault) + galeria de obras.
  app.get(
    '/artists/:slug',
    {
      schema: {
        tags: ['artistas'],
        summary: 'Detalhes de um artista pelo slug, com biografia e galeria de obras',
        params: slugParamJson,
        response: { 200: artistDetailJson, 400: errorJson, 404: errorJson },
      },
    },
    async (request, reply) => {
      const { slug } = slugParamSchema.parse(request.params);
      const artist = await getArtistBySlug(slug);
      if (!artist) throw new NotFoundError('Artista');
      reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
      return artist;
    },
  );
}
