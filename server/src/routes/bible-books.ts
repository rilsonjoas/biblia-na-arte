import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { listBibleBooks, getBibleBookBySlug } from '../db/queries.js';
import { slugParamSchema } from '../schemas/common.schema.js';
import { NotFoundError } from '../plugins/error-handler.js';

const listQuerySchema = z.object({
  testament: z.enum(['old', 'new']).optional(),
});

export async function bibleBookRoutes(app: FastifyInstance) {
  app.get('/bible-books', async (request) => {
    const query = listQuerySchema.parse(request.query);
    return listBibleBooks(query.testament);
  });

  app.get('/bible-books/:slug', async (request) => {
    const { slug } = slugParamSchema.parse(request.params);
    const book = await getBibleBookBySlug(slug);
    if (!book) throw new NotFoundError('Livro bíblico');
    return book;
  });
}
