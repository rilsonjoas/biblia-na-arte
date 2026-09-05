import type { FastifyInstance } from 'fastify';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import {
  loginSchema,
  listSubmissionsQuerySchema,
  updateSubmissionSchema,
  rejectSubmissionSchema,
} from '../schemas/submission.schema.js';
import {
  findUserByEmail,
  listSubmissions,
  getSubmissionById,
  updateSubmission,
  approveSubmission,
  rejectSubmission,
  findBibleBookSlugByName,
} from '../db/queries.js';
import { verifyPassword } from '../lib/auth.js';
import { promoteSubmissionImage } from '../lib/image-processing.js';
import { NotFoundError } from '../plugins/error-handler.js';
import { env } from '../config.js';

/** Painel administrativo (roadmap, 2026-09-05) — login por e-mail/senha
 *  (tabela `users`, começa só com o Rilson) + revisão da fila de
 *  submissões. `authenticate` (qualquer papel logado) vs. `requireAdmin`
 *  (só quem publica de fato) — ver plugins/jwt-auth.ts pro porquê dos
 *  dois papéis existirem desde o início. */
export async function adminRoutes(app: FastifyInstance) {
  app.post(
    '/admin/login',
    {
      config: {
        // Login é alvo natural de força bruta — limite bem mais
        // apertado que o resto da API.
        rateLimit: { max: 10, timeWindow: '10 minutes' },
      },
      schema: { tags: ['admin'], summary: 'Login do painel administrativo' },
    },
    async (request, reply) => {
      const { email, password } = loginSchema.parse(request.body);

      const user = await findUserByEmail(email);
      // Mesma mensagem genérica se o e-mail não existir ou a senha
      // estiver errada — não vazar pra quem tenta qual dos dois é o caso.
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return reply.status(401).send({ error: 'unauthorized', message: 'E-mail ou senha inválidos' });
      }

      const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
      return { token, user: { id: user.id, email: user.email, role: user.role } };
    },
  );

  app.get(
    '/admin/submissions',
    {
      preHandler: app.authenticate,
      schema: { tags: ['admin'], summary: 'Lista submissões (fila de revisão)' },
    },
    async (request) => {
      const { status } = listSubmissionsQuerySchema.parse(request.query);
      return listSubmissions(status);
    },
  );

  app.get(
    '/admin/submissions/:id',
    {
      preHandler: app.authenticate,
      schema: { tags: ['admin'], summary: 'Detalhe de uma submissão' },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const submission = await getSubmissionById(id);
      if (!submission) throw new NotFoundError('Submissão');
      return submission;
    },
  );

  // Imagem da submissão AINDA PENDENTE — atrás de login de propósito
  // (diferente de /uploads/:filename, que só serve obra já aprovada e
  // pública). Serve direto de SUBMISSION_UPLOADS_DIR pelo caminho já
  // salvo no banco, não por nome de arquivo cru vindo da URL.
  app.get(
    '/admin/submissions/:id/image',
    {
      preHandler: app.authenticate,
      schema: { tags: ['admin'], summary: 'Imagem de uma submissão pendente' },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const submission = await getSubmissionById(id);
      if (!submission) throw new NotFoundError('Submissão');

      reply.type('image/webp');
      return reply.send(createReadStream(submission.imagePath));
    },
  );

  app.patch(
    '/admin/submissions/:id',
    {
      preHandler: app.authenticate,
      schema: { tags: ['admin'], summary: 'Edita/completa uma submissão antes de aprovar' },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const input = updateSubmissionSchema.parse(request.body);
      const updated = await updateSubmission(id, input);
      if (!updated) throw new NotFoundError('Submissão');
      return updated;
    },
  );

  app.post(
    '/admin/submissions/:id/reject',
    {
      preHandler: app.authenticate,
      schema: { tags: ['admin'], summary: 'Rejeita uma submissão' },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const { reason } = rejectSubmissionSchema.parse(request.body ?? {});
      const updated = await rejectSubmission(id, request.user.sub, reason);
      if (!updated) throw new NotFoundError('Submissão');
      return updated;
    },
  );

  app.post(
    '/admin/submissions/:id/approve',
    {
      // Só admin publica de fato — ver comentário em plugins/jwt-auth.ts.
      preHandler: app.requireAdmin,
      schema: { tags: ['admin'], summary: 'Aprova uma submissão, publicando a obra' },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const submission = await getSubmissionById(id);
      if (!submission) throw new NotFoundError('Submissão');

      const filename = await promoteSubmissionImage(
        submission.imagePath,
        env.APPROVED_SUBMISSION_UPLOADS_DIR,
        submission.artistName ?? '',
        submission.title,
      );
      const imageUrl = new URL(path.posix.join('/api/v1/uploads', filename), env.PUBLIC_API_URL).toString();

      const bookSlug = submission.suggestedBook ? await findBibleBookSlugByName(submission.suggestedBook) : null;

      const result = await approveSubmission(id, request.user.sub, imageUrl, bookSlug);
      return result;
    },
  );
}
