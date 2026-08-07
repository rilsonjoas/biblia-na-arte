import Fastify from 'fastify';
import { isProduction } from './config.js';
import { registerSecurity } from './plugins/security.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { healthRoutes } from './routes/health.js';
import { artworkRoutes } from './routes/artworks.js';
import { bibleBookRoutes } from './routes/bible-books.js';

export async function buildApp() {
  const app = Fastify({
    logger: isProduction
      ? true // JSON estruturado em produção — pino puro, sem custo de formatação
      : { transport: { target: 'pino-pretty' } },
    trustProxy: true, // atrás do Traefik — pega o IP real do cliente pro rate limit
  });

  await registerSecurity(app);
  registerErrorHandler(app);

  await app.register(healthRoutes);
  await app.register(artworkRoutes, { prefix: '/api/v1' });
  await app.register(bibleBookRoutes, { prefix: '/api/v1' });

  return app;
}
