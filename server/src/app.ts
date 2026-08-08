import Fastify from 'fastify';
import { isProduction } from './config.js';
import { registerSecurity } from './plugins/security.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { healthRoutes } from './routes/health.js';
import { artworkRoutes } from './routes/artworks.js';
import { bibleBookRoutes } from './routes/bible-books.js';
import { bibleTextRoutes } from './routes/bible-text.js';

export async function buildApp() {
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

  // Precisa ser registrado ANTES das rotas pro swagger capturar os schemas.
  await app.register(swaggerPlugin);

  await app.register(healthRoutes);
  await app.register(artworkRoutes, { prefix: '/api/v1' });
  await app.register(bibleBookRoutes, { prefix: '/api/v1' });
  await app.register(bibleTextRoutes, { prefix: '/api/v1' });

  // JSON do OpenAPI em /docs (a UI Swagger fica por conta de um serviço
  // separado ou do usuário abrindo o JSON direto).
  app.get('/docs', async (_request, reply) => {
    const spec = app.swagger();
    return reply.type('application/json').send(spec);
  });

  return app;
}
