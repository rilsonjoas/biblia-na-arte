import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config.js';

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
  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    await request.jwtVerify();
  });

  // preHandler mais estrito — só `admin` publica de verdade (ver
  // ROADMAP: "revisor" prepara, só "admin" aprova). Precisa rodar DEPOIS
  // de `authenticate` ter decodificado o token.
  app.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    await request.jwtVerify();
    if (request.user.role !== 'admin') {
      return reply.status(403).send({ error: 'forbidden', message: 'Só administradores podem fazer isso' });
    }
  });
});
