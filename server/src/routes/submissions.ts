import type { FastifyInstance } from 'fastify';
import { createSubmissionSchema } from '../schemas/submission.schema.js';
import { createSubmission } from '../db/queries.js';
import { processSubmissionImage, InvalidImageError } from '../lib/image-processing.js';
import { env } from '../config.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — generoso pra foto de obra, sem abrir demais

/** Submissão de artistas (roadmap, 2026-09-05) — rota pública, única
 *  que aceita `multipart/form-data` nessa API (o resto é tudo GET/JSON).
 *  Validação em duas partes: os campos de texto via Zod
 *  (`createSubmissionSchema`, igual ao resto da API) e a imagem via
 *  `sharp` (só aceita o que ele conseguir decodificar de verdade —
 *  checar `mimetype` declarado pelo cliente não é suficiente sozinho,
 *  mas barra o caso comum antes de gastar CPU processando lixo). */
export async function submissionRoutes(app: FastifyInstance) {
  app.post(
    '/submissions',
    {
      // Rate limit bem mais restrito que o resto da API — formulário
      // público de upload de imagem é alvo natural de abuso/spam, o
      // limite geral (200/min) é generoso demais pra essa rota
      // especificamente.
      config: {
        rateLimit: { max: 5, timeWindow: '10 minutes' },
      },
      schema: {
        tags: ['submissoes'],
        summary: 'Submete uma obra pra revisão (artista externo)',
        description:
          'multipart/form-data: campos de texto + um arquivo de imagem (campo "image"). Cai em fila de revisão — nada aqui aparece no site antes de aprovado no painel.',
      },
    },
    async (request, reply) => {
      if (!request.isMultipart()) {
        return reply.status(400).send({
          error: 'validation_error',
          message: 'Requisição precisa ser multipart/form-data',
        });
      }

      const fields: Record<string, string> = {};
      let imageBuffer: Buffer | null = null;

      for await (const part of request.parts()) {
        if (part.type === 'file') {
          if (part.fieldname !== 'image') continue; // ignora campo de arquivo com nome errado
          if (!ALLOWED_MIME_TYPES.has(part.mimetype)) {
            return reply.status(400).send({
              error: 'validation_error',
              message: 'Imagem precisa ser JPEG, PNG ou WebP',
            });
          }
          imageBuffer = await part.toBuffer();
          if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
            return reply.status(400).send({
              error: 'validation_error',
              message: 'Imagem muito grande (máximo 10MB)',
            });
          }
        } else {
          fields[part.fieldname] = String(part.value);
        }
      }

      if (!imageBuffer) {
        return reply.status(400).send({ error: 'validation_error', message: 'Imagem é obrigatória' });
      }

      const input = createSubmissionSchema.parse(fields);

      let imagePath: string;
      try {
        const filename = await processSubmissionImage(imageBuffer, env.SUBMISSION_UPLOADS_DIR);
        imagePath = `${env.SUBMISSION_UPLOADS_DIR}/${filename}`;
      } catch (err) {
        if (err instanceof InvalidImageError) {
          return reply.status(400).send({ error: 'validation_error', message: err.message });
        }
        throw err;
      }

      const submission = await createSubmission({ ...input, imagePath });

      reply.status(201);
      return { id: submission.id, status: submission.status };
    },
  );
}
