import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { listArtworks, getArtworkBySlugOrId, getRandomArtwork, getDailyArtwork, searchArtworks } from '../db/queries.js';
import { todaySaoPaulo } from '../lib/lectionary-refs.js';
import { generateSocialImage, SocialImageUpstreamError } from '../lib/image-processing.js';
import { env } from '../config.js';
import {
  listArtworksQuerySchema,
  searchArtworksQuerySchema,
  dailyArtworkQuerySchema,
} from '../schemas/artwork.schema.js';
import { idOrSlugParamSchema } from '../schemas/common.schema.js';
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
const idOrSlugParamJson = zodToJsonSchema(idOrSlugParamSchema, {
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
        summary: '"Pintura do Dia" — mesma obra pra todo mundo, muda à meia-noite em São Paulo',
        description:
          'Prioriza a leitura litúrgica do dia (tabela copiada do Lecionário — cobre domingos/festas até 2030-11-24 e dias de semana até 2028-11-29): escolhe entre as obras catalogadas na referência bíblica do dia, com hash determinístico da data. Fora desse período, ou se nenhuma leitura do dia tiver obra catalogada, cai pro sorteio determinístico sobre o acervo ativo inteiro. O Lecionário consome este mesmo endpoint — as duas pontas mostram a mesma obra no mesmo dia. "Hoje" (quando `date` não é passado) é calculado no fuso de São Paulo, não UTC — achado real em produção (03/09/2026): UTC fazia virar o dia 3h antes do Lecionário, que usa hora local do dispositivo.',
        querystring: dailyQueryJson,
        response: { 200: artworkJson, 404: errorJson },
      },
    },
    async (request, reply) => {
      const { date } = dailyArtworkQuerySchema.parse(request.query);
      const dateStr = date ?? todaySaoPaulo();
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
        summary: 'Detalhes de uma obra — aceita UUID (link antigo) ou slug (URL amigável)',
        params: idOrSlugParamJson,
        response: { 200: artworkJson, 400: errorJson, 404: errorJson },
      },
    },
    async (request, reply) => {
      const { id } = idOrSlugParamSchema.parse(request.params);
      const artwork = await getArtworkBySlugOrId(id);
      if (!artwork) throw new NotFoundError('Obra');
      reply.header('Cache-Control', 'public, max-age=600, stale-while-revalidate=120');
      return artwork;
    },
  );

  app.get(
    '/artworks/:id/social-image',
    {
      schema: {
        tags: ['obras'],
        summary: 'Versão da obra segura pra publicar no Instagram/Facebook',
        description:
          'Instagram Graph API rejeita imagem fora da proporção 4:5–1.91:1 (achado em produção, 2026-09-26: pintura panorâmica de 2.39:1 derrubou o post do dia). Devolve a imagem original sem alteração quando já está dentro do limite; fora dele, adiciona moldura sólida na cor de fundo do site até caber, sem cortar a obra. Consumida por `scripts/post-daily-social.mjs`, não pelo site.',
        params: idOrSlugParamJson,
        response: { 400: errorJson, 404: errorJson, 502: errorJson },
      },
    },
    async (request, reply) => {
      const { id } = idOrSlugParamSchema.parse(request.params);
      const artwork = await getArtworkBySlugOrId(id);
      if (!artwork || !artwork.imageUrl) throw new NotFoundError('Obra');

      const sourceUrl = artwork.imageUrl.startsWith('http')
        ? artwork.imageUrl
        : `${env.WEB_PUBLIC_URL}${artwork.imageUrl}`;

      const upstream = await fetch(sourceUrl).catch(() => null);
      if (!upstream || !upstream.ok) {
        throw new SocialImageUpstreamError(`Não foi possível buscar a imagem original (${sourceUrl}).`);
      }

      const original = Buffer.from(await upstream.arrayBuffer());
      const social = await generateSocialImage(original);

      reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
      // Mesmo motivo do CORP em routes/uploads.ts: precisa ser buscável
      // cross-origin pelo Graph API da Meta (e embedável se algum dia
      // usarmos essa rota pra preview no próprio painel).
      reply.header('Cross-Origin-Resource-Policy', 'cross-origin');
      reply.type('image/jpeg');
      return reply.send(social);
    },
  );
}
