import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config.js';

export async function registerSecurity(app: FastifyInstance) {
  // Headers de segurança padrão (CSP, X-Frame-Options, etc.) — API não
  // serve HTML então a CSP default do helmet já cobre o que importa aqui.
  await app.register(helmet);

  // Só os domínios em CORS_ORIGIN podem chamar a API do navegador (o
  // próprio site + outros projetos da "Biblioteca" que também consomem
  // essa API client-side, ex. lecionario.narniano.com). Sem credenciais
  // (não tem cookie/sessão nessa API — login do painel usa token no
  // header Authorization, não cookie, ver plugins/jwt-auth.ts).
  //
  // POST/PATCH/DELETE liberados desde a submissão de artistas (roadmap,
  // 2026-09-05) — antes a API era só leitura. DELETE entrou depois,
  // junto da rota de apagar submissão/obra (achado real: sem isso o
  // preflight do navegador bloqueia a chamada antes dela nem chegar na
  // API — funcionava via curl, quebraria no painel de verdade).
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Limite por IP — protege o Postgres compartilhado (e o resto dos
  // serviços no mesmo VPS) de abuso ou bot mal comportado.
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });
}
