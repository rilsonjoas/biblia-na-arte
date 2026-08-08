import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';

// Documentação OpenAPI 3.0 gerada a partir do `schema` declarado nas rotas.
// Publicada em GET /docs (JSON) — útil pra conferir o contrato da API sem
// olhar o código. Não expõe nada sensível: a API é pública e somente leitura.
// `fp` (fastify-plugin): sem encapsulation, senão o decorator `app.swagger()`
// não fica visível nas rotas registradas na instância raiz.
export const swaggerPlugin = fp(
  async function swaggerPlugin(app: FastifyInstance) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Bíblia na Arte — API',
          description:
            'Catálogo público e somente leitura de obras de arte inspiradas em passagens bíblicas.',
          version: '1.0.0',
        },
        tags: [
          { name: 'obras', description: 'Obras de arte do catálogo' },
          { name: 'livros', description: 'Livros bíblicos' },
          { name: 'saude', description: 'Health check' },
        ],
      },
    });
  },
  { name: 'swagger' },
);
