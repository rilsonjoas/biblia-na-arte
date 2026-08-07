import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';

// Usado pelo Traefik/Uptime Kuma pra saber se o serviço (e o banco) estão
// de pé. Sem autenticação — não vaza nada sensível, só um booleano.
export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    try {
      await db.execute(sql`SELECT 1`);
      return reply.send({ status: 'ok', db: 'up' });
    } catch {
      return reply.status(503).send({ status: 'degraded', db: 'down' });
    }
  });
}
