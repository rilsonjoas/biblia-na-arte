import type { FastifyInstance, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { isProduction } from '../config.js';

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} não encontrado(a)`);
    this.name = 'NotFoundError';
  }
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'validation_error',
        message: 'Parâmetros inválidos',
        issues: error.flatten().fieldErrors,
      });
    }

    if (error instanceof NotFoundError) {
      return reply.status(404).send({ error: 'not_found', message: error.message });
    }

    // fastify-rate-limit anexa statusCode 429 no erro
    const statusCode = 'statusCode' in error ? (error.statusCode ?? 500) : 500;

    request.log.error(error);

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
