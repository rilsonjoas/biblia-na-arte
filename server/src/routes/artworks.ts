import type { FastifyInstance } from 'fastify';
import { listArtworks, getArtworkById, searchArtworks } from '../db/queries.js';
import {
  listArtworksQuerySchema,
  searchArtworksQuerySchema,
} from '../schemas/artwork.schema.js';
import { idParamSchema } from '../schemas/common.schema.js';
import { NotFoundError } from '../plugins/error-handler.js';

export async function artworkRoutes(app: FastifyInstance) {
  // Cache HTTP simples — conteúdo muda raramente (curadoria manual, não
  // user-generated), então cachear no navegador/qualquer proxy na frente
  // economiza carga do VPS de graça. Rota de busca fica sem cache (query
  // muda a cada request, não vale a pena).
  app.get('/artworks', async (request, reply) => {
    const query = listArtworksQuerySchema.parse(request.query);
    const result = await listArtworks(query);
    reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return result;
  });

  app.get('/artworks/search', async (request) => {
    const query = searchArtworksQuerySchema.parse(request.query);
    return searchArtworks(query);
  });

  app.get('/artworks/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const artwork = await getArtworkById(id);
    if (!artwork) throw new NotFoundError('Obra');
    reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
    return artwork;
  });
}
