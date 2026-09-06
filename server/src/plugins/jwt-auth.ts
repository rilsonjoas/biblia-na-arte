import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config.js';
import { findUserById } from '../db/queries.js';

// Painel administrativo (roadmap, 2026-09-05) — token no header
// `Authorization: Bearer <token>`, não cookie. A API roda num subdomínio
// diferente do site (api-biblianaarte vs. biblianaarte), então é CORS
// de verdade entre eles; token em header evita toda a complicação de
// cookie cross-site (SameSite=None, credentials:true) por um ganho de
// segurança que não existe pra esse volume de usuários.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string; role: 'admin' | 'revisor' };
    user: { sub: string; email: string; role: 'admin' | 'revisor' };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const jwtAuthPlugin = fp(async function jwtAuthPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: '7d' },
  });

  // preHandler pra qualquer rota que só exige estar logado (admin ou
  // revisor). Erros de token ausente/inválido/expirado já vêm com
  // statusCode 401 do próprio @fastify/jwt — o error-handler global
  // repassa isso sem precisar de tratamento especial aqui.
  //
  // Revalida contra o banco a cada requisição — achado real
  // 2026-09-06: só verificar a assinatura do JWT não bastava. Token
  // dura até 7 dias (sign.expiresIn); sem essa checagem, apagar um
  // usuário (a promessa de "revogar acesso é apagar uma linha em
  // users", ver ROADMAP) não revogava nada de verdade até o token
  // expirar sozinho — e uma troca de papel (admin → revisor) também
  // não valia enquanto o token antigo, com o papel velho embutido,
  // continuasse sendo aceito. Um SELECT a mais por requisição é custo
  // desprezível pro volume de tráfego do painel administrativo (não é
  // a API pública de leitura).
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    await request.jwtVerify();
    const user = await findUserById(request.user.sub);
    if (!user) {
      return reply.status(401).send({ error: 'unauthorized', message: 'Sessão inválida — usuário não existe mais' });
    }
    // Papel sempre o do banco, nunca o que veio (possivelmente velho)
    // dentro do token.
    request.user.role = user.role;
  });

  // preHandler mais estrito — só `admin` publica de verdade (ver
  // ROADMAP: "revisor" prepara, só "admin" aprova). Reusa a mesma
  // revalidação de `authenticate` (chamar os dois preHandlers seria
  // redundante — Fastify não deduplica, então esta função já faz tudo
  // sozinha em vez de depender de authenticate rodar antes).
  app.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    await request.jwtVerify();
    const user = await findUserById(request.user.sub);
    if (!user) {
      return reply.status(401).send({ error: 'unauthorized', message: 'Sessão inválida — usuário não existe mais' });
    }
    request.user.role = user.role;
    if (user.role !== 'admin') {
      return reply.status(403).send({ error: 'forbidden', message: 'Só administradores podem fazer isso' });
    }
  });
});
