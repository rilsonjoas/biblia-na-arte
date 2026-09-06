import type { FastifyInstance } from 'fastify';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import {
  loginSchema,
  listSubmissionsQuerySchema,
  updateSubmissionSchema,
  rejectSubmissionSchema,
  createUserSchema,
} from '../schemas/submission.schema.js';
import {
  findUserByEmail,
  findUserById,
  listSubmissions,
  getSubmissionById,
  updateSubmission,
  approveSubmission,
  rejectSubmission,
  deleteSubmission,
  findBibleBookSlugByName,
  listUsers,
  createUser,
  deleteUser,
  countAdmins,
} from '../db/queries.js';
import { verifyPassword, hashPassword } from '../lib/auth.js';
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
        submission.id,
      );
      const imageUrl = new URL(path.posix.join('/api/v1/uploads', filename), env.PUBLIC_API_URL).toString();

      const bookSlug = submission.suggestedBook ? await findBibleBookSlugByName(submission.suggestedBook) : null;

      const result = await approveSubmission(id, request.user.sub, imageUrl, bookSlug);
      return result;
    },
  );

  app.delete(
    '/admin/submissions/:id',
    {
      preHandler: app.authenticate,
      schema: {
        tags: ['admin'],
        summary: 'Apaga uma submissão (e a obra publicada, se já tiver sido aprovada)',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const submission = await getSubmissionById(id);
      if (!submission) throw new NotFoundError('Submissão');

      // Apagar obra já publicada é tão sensível quanto publicá-la — só
      // admin. Rejeitada/pendente pode qualquer revisor tirar da fila.
      if (submission.status === 'aprovado' && request.user.role !== 'admin') {
        return reply.status(403).send({
          error: 'forbidden',
          message: 'Só administradores podem apagar uma submissão já aprovada',
        });
      }

      const result = await deleteSubmission(id);
      if (!result) throw new NotFoundError('Submissão');

      // Best-effort — arquivo já pode não existir (ex.: apagado à mão
      // antes), não vale falhar a resposta por causa disso.
      if (result.pendingImagePath) {
        await unlink(result.pendingImagePath).catch(() => {});
      }
      if (result.approvedImageUrl) {
        const filename = path.basename(new URL(result.approvedImageUrl).pathname);
        await unlink(path.join(env.APPROVED_SUBMISSION_UPLOADS_DIR, filename)).catch(() => {});
      }

      return reply.status(204).send();
    },
  );

  // Gestão de usuários do painel (roadmap, 2026-09-06) — só admin, é a
  // mesma régua de quem publica de fato. Sem edição de papel/senha por
  // enquanto: revogar acesso é apagar e recriar, mais simples e menos
  // superfície de erro pro volume de contas que esse painel vai ter.
  app.get(
    '/admin/users',
    {
      preHandler: app.requireAdmin,
      schema: { tags: ['admin'], summary: 'Lista usuários do painel' },
    },
    async () => listUsers(),
  );

  app.post(
    '/admin/users',
    {
      preHandler: app.requireAdmin,
      schema: { tags: ['admin'], summary: 'Cria um novo usuário do painel' },
    },
    async (request, reply) => {
      const input = createUserSchema.parse(request.body);

      const existing = await findUserByEmail(input.email);
      if (existing) {
        return reply.status(409).send({ error: 'conflict', message: 'Já existe um usuário com esse e-mail' });
      }

      const passwordHash = hashPassword(input.password);
      const user = await createUser(input.email, passwordHash, input.role);
      return reply.status(201).send(user);
    },
  );

  app.delete(
    '/admin/users/:id',
    {
      preHandler: app.requireAdmin,
      schema: { tags: ['admin'], summary: 'Apaga um usuário do painel' },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Acesso já revalidado contra o banco em requireAdmin — dá pra
      // confiar em request.user aqui.
      if (id === request.user.sub) {
        return reply.status(400).send({
          error: 'bad_request',
          message: 'Não é possível apagar a própria conta logada',
        });
      }

      const target = await findUserById(id);
      if (!target) throw new NotFoundError('Usuário');

      // Sem isso, um admin distraído consegue apagar o único
      // administrador que existe (o próprio, via outra sessão, ou o
      // único outro) e ninguém mais consegue aprovar/publicar nada —
      // nem recriar um admin novo, porque isso também exige admin.
      if (target.role === 'admin') {
        const adminCount = await countAdmins();
        if (adminCount <= 1) {
          return reply.status(400).send({
            error: 'bad_request',
            message: 'Não é possível apagar o único administrador restante',
          });
        }
      }

      await deleteUser(id);
      return reply.status(204).send();
    },
  );
}
