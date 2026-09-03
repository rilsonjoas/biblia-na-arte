import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { listArtworks, getArtworkById, getRandomArtwork, getDailyArtwork, searchArtworks } from '../db/queries.js';
import {
  listArtworksQuerySchema,
  searchArtworksQuerySchema,
  dailyArtworkQuerySchema,
} from '../schemas/artwork.schema.js';
import { idParamSchema } from '../schemas/common.schema.js';
import {
  artworkResponseSchema,
  artworkListResponseSchema,
  errorResponseSchema,
} from '../schemas/response.schema.js';
import { NotFoundError } from '../plugins/error-handler.js';

// JSON Schema pras rotas (usados pelo @fastify/swagger no OpenAPI). Query
// com additionalProperties:true — o parse real continua sendo o Zod no
// handler (que ignora chaves extras), sem regressão de contrato.
const listQueryJson = zodToJsonSchema(listArtworksQuerySchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
const searchQueryJson = zodToJsonSchema(searchArtworksQuerySchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
const idParamJson = zodToJsonSchema(idParamSchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
const dailyQueryJson = zodToJsonSchema(dailyArtworkQuerySchema, {
  $refStrategy: 'none',
  allowedAdditionalProperties: true,
});
const artworkJson = zodToJsonSchema(artworkResponseSchema, { $refStrategy: 'none' });
const artworkListJson = zodToJsonSchema(artworkListResponseSchema, { $refStrategy: 'none' });
const errorJson = zodToJsonSchema(errorResponseSchema, { $refStrategy: 'none' });

export async function artworkRoutes(app: FastifyInstance) {
  // Cache HTTP simples — conteúdo muda raramente (curadoria manual, não
  // user-generated), então cachear no navegador/qualquer proxy na frente
  // economiza carga do VPS de graça. Rota de busca fica sem cache (query
  // muda a cada request, não vale a pena).
  app.get(
    '/artworks',
    {
      schema: {
        tags: ['obras'],
        summary: 'Lista obras com filtros e paginação',
        description:
          'Filtros opcionais por categoria, artistas (múltiplos, separados por vírgula) e referência bíblica (livro/capítulo/versículos).',
        querystring: listQueryJson,
        response: { 200: artworkListJson, 400: errorJson },
      },
    },
    async (request, reply) => {
      const query = listArtworksQuerySchema.parse(request.query);
      const result = await listArtworks(query);
      reply.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      return result;
    },
  );

  app.get(
    '/artworks/search',
    {
      schema: {
        tags: ['obras'],
        summary: 'Busca full-text em português',
        description: 'Busca por título, descrição e artista, com ranking de relevância.',
        querystring: searchQueryJson,
        response: { 200: { type: 'array', items: artworkJson }, 400: errorJson },
      },
    },
    async (request) => {
      const query = searchArtworksQuerySchema.parse(request.query);
      return searchArtworks(query);
    },
  );

  app.get(
    '/artworks/random',
    {
      schema: {
        tags: ['obras'],
        summary: '"Me surpreenda" — obra aleatória do acervo',
        description:
          'Uma obra ativa qualquer, com contexto completo. Sem cache — cada chamada deve poder trazer outra obra.',
        response: { 200: artworkJson, 404: errorJson },
      },
    },
    async () => {
      const artwork = await getRandomArtwork();
      if (!artwork) throw new NotFoundError('Obra');
      return artwork;
    },
  );

  app.get(
    '/artworks/daily',
    {
      schema: {
        tags: ['obras'],
        summary: '"Pintura do Dia" — mesma obra pra todo mundo, muda à meia-noite UTC',
        description:
          'Prioriza a leitura litúrgica do dia (tabela copiada do Lecionário — cobre domingos/festas até 2030-11-24 e dias de semana até 2028-11-29): escolhe entre as obras catalogadas na referência bíblica do dia, com hash determinístico da data. Fora desse período, ou se nenhuma leitura do dia tiver obra catalogada, cai pro sorteio determinístico sobre o acervo ativo inteiro. O Lecionário consome este mesmo endpoint — as duas pontas mostram a mesma obra no mesmo dia.',
        querystring: dailyQueryJson,
        response: { 200: artworkJson, 404: errorJson },
      },
    },
    async (request, reply) => {
      const { date } = dailyArtworkQuerySchema.parse(request.query);
      const dateStr = date ?? new Date().toISOString().slice(0, 10);
      const artwork = await getDailyArtwork(dateStr);
      if (!artwork) throw new NotFoundError('Obra');
      // Cache curto — o resultado só muda 1x por dia, mas 1h de folga
      // evita recalcular a cada acesso sem arriscar servir o dia errado
      // logo depois da virada.
      reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
      return artwork;
    },
  );

  app.get(
    '/artworks/:id',
    {
      schema: {
        tags: ['obras'],
        summary: 'Detalhes de uma obra',
        params: idParamJson,
        response: { 200: artworkJson, 400: errorJson, 404: errorJson },
      },
    },
    async (request, reply) => {
      const { id } = idParamSchema.parse(request.params);
      const artwork = await getArtworkById(id);
      if (!artwork) throw new NotFoundError('Obra');
      reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
      return artwork;
    },
  );
}
