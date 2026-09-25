import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { isProduction } from './config.js';
import { registerSecurity } from './plugins/security.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { jwtAuthPlugin } from './plugins/jwt-auth.js';
import { healthRoutes } from './routes/health.js';
import { artworkRoutes } from './routes/artworks.js';
import { bibleBookRoutes } from './routes/bible-books.js';
import { bibleTextRoutes } from './routes/bible-text.js';
import { artistRoutes } from './routes/artists.js';
import { themeRoutes } from './routes/themes.js';
import { periodRoutes } from './routes/periods.js';
import { exploreRoutes } from './routes/explore.js';
import { submissionRoutes } from './routes/submissions.js';
import { adminRoutes } from './routes/admin.js';
import { uploadRoutes } from './routes/uploads.js';
import { shareRoutes } from './routes/share.js';
import { collectionRoutes } from './routes/collections.js';
import { initSentry } from './lib/sentry.js';

export async function buildApp() {
  initSentry();

  const app = Fastify({
    logger: isProduction
      ? true // JSON estruturado em produção — pino puro, sem custo de formatação
      : process.env.NODE_ENV === 'test'
        ? false // testes de integração: output limpo no CI
        : { transport: { target: 'pino-pretty' } },
    trustProxy: true, // atrás do Traefik — pega o IP real do cliente pro rate limit
  });

  await registerSecurity(app);
  registerErrorHandler(app);
  await app.register(jwtAuthPlugin);

  // Limite de tamanho aqui é só uma rede de segurança adicional — o
  // limite de verdade (10MB) é checado manualmente na rota, depois de
  // ler o mimetype (ver routes/submissions.ts). 15MB dá folga pro
  // overhead do multipart em si.
  await app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } });

  // Precisa ser registrado ANTES das rotas pro swagger capturar os schemas.
  await app.register(swaggerPlugin);

  await app.register(healthRoutes);
  await app.register(artworkRoutes, { prefix: '/api/v1' });
  await app.register(bibleBookRoutes, { prefix: '/api/v1' });
  await app.register(bibleTextRoutes, { prefix: '/api/v1' });
  await app.register(artistRoutes, { prefix: '/api/v1' });
  await app.register(themeRoutes, { prefix: '/api/v1' });
  await app.register(periodRoutes, { prefix: '/api/v1' });
  await app.register(exploreRoutes, { prefix: '/api/v1' });
  await app.register(collectionRoutes, { prefix: '/api/v1' });
  await app.register(submissionRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1' });
  await app.register(uploadRoutes, { prefix: '/api/v1' });
  await app.register(shareRoutes);

  // JSON do OpenAPI em /docs (a UI Swagger fica por conta de um serviço
  // separado ou do usuário abrindo o JSON direto).
  app.get('/docs', async (_request, reply) => {
    const spec = app.swagger();
    return reply.type('application/json').send(spec);
  });

  return app;
}
