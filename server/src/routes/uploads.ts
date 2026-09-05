import type { FastifyInstance } from 'fastify';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { env } from '../config.js';
import { NotFoundError } from '../plugins/error-handler.js';

/** Serve imagens de obras aprovadas via submissão (roadmap, 2026-09-05)
 *  — `web` é build estático (nginx), sem volume gravável em produção,
 *  então essas imagens não podem morar em `web/public/images`. Rota
 *  pública de propósito (uma vez aprovada, a obra é pública) — só serve
 *  de `APPROVED_SUBMISSION_UPLOADS_DIR`, nunca da pasta de pendentes. */
export async function uploadRoutes(app: FastifyInstance) {
  app.get(
    '/uploads/:filename',
    {
      schema: {
        tags: ['uploads'],
        summary: 'Imagem de obra aprovada via submissão',
      },
    },
    async (request, reply) => {
      const { filename } = request.params as { filename: string };

      // Barra qualquer tentativa de sair do diretório (../../etc) —
      // nome de arquivo só pode ter o formato que a gente mesmo gera
      // (slugify + .webp), nunca vem direto de input do usuário sem
      // passar por isso.
      if (filename.includes('/') || filename.includes('..')) {
        throw new NotFoundError('Imagem');
      }

      const filePath = path.join(env.APPROVED_SUBMISSION_UPLOADS_DIR, filename);

      try {
        await access(filePath);
      } catch {
        throw new NotFoundError('Imagem');
      }

      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      reply.type('image/webp');
      return reply.send(createReadStream(filePath));
    },
  );
}
