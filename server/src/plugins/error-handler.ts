import type { FastifyInstance, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { isProduction } from '../config.js';
import { BibleTextNotFoundError, BibleTextUpstreamError } from '../lib/bible-api.js';
import { SocialImageUpstreamError } from '../lib/image-processing.js';
import { captureException } from '../lib/sentry.js';

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} não encontrado(a)`);
    this.name = 'NotFoundError';
  }
}

/** Mapa campo → mensagens a partir do erro de validação do Fastify (schema JSON da rota). */
function issuesDoFastify(validation: NonNullable<FastifyError['validation']>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const v of validation) {
    const campo = v.instancePath.replace(/^\//, '') || String(v.params?.missingProperty ?? 'parametros');
    (out[campo] ??= []).push(v.message ?? 'inválido');
  }
  return out;
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'validation_error',
        message: 'Parâmetros inválidos',
        issues: error.flatten().fieldErrors,
        details: { issues: error.issues },
      });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: 'not_found', message: error.message });
    }

    if (error instanceof BibleTextNotFoundError) {
      return reply.status(404).send({ error: 'not_found', message: error.message });
    }

    if (error instanceof BibleTextUpstreamError) {
      return reply.status(502).send({ error: 'upstream_error', message: error.message });
    }

    if (error instanceof SocialImageUpstreamError) {
      return reply.status(502).send({ error: 'upstream_error', message: error.message });
    }

    // Validação do Fastify (schemas JSON das rotas) — mesmo corpo do Zod, pra quem consome a API não
    // precisar saber de qual camada veio o 400. Igual ao Scriptorium (hetzner-infra/CONTRATOS-ENTRE-PROJETOS.md,
    // seção 5): `issues` é sempre um mapa campo → mensagens; `details.issues` guarda a lista crua.
    if ('validation' in error && error.validation) {
      return reply.status(400).send({
        error: 'validation_error',
        message: 'Parâmetros inválidos',
        issues: issuesDoFastify(error.validation),
        details: { issues: error.validation },
      });
    }

    // fastify-rate-limit anexa statusCode 429 no erro
    const statusCode = 'statusCode' in error ? (error.statusCode ?? 500) : 500;

    request.log.error(error);

    if (statusCode >= 500) {
      captureException(error, {
        url: request.url,
        method: request.method,
        params: request.params,
        query: request.query,
      });
    }

    return reply.status(statusCode).send({
      error: statusCode === 429 ? 'rate_limited' : 'internal_error',
      message:
        statusCode === 429
          ? 'Muitas requisições, tente de novo em instantes'
          : // Nunca vazar detalhes internos (stack trace, query SQL) em produção
            isProduction
            ? 'Erro interno'
            : error.message,
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: 'not_found', message: 'Rota não encontrada' });
  });
}
