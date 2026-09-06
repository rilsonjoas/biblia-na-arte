import { z } from 'zod';

// Campos de texto de uma submissão de artista (roadmap, 2026-09-05).
// Só o mínimo pra ser revisável é obrigatório — o resto existe pra ser
// preenchido com a mesma qualidade do resto do acervo, mas não trava a
// submissão se vier incompleto (a régua de qualidade acontece na
// revisão, não na entrada). Validado à parte da imagem porque o corpo
// da requisição é multipart, não JSON — o Fastify não valida isso
// via `schema.body` como o resto da API.
export const createSubmissionSchema = z.object({
  submitterName: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  submitterEmail: z.string().trim().email('E-mail inválido'),
  submitterContact: z.string().trim().max(200).optional(),

  // Checkbox de confirmação de direito de imagem — não é opcional de
  // verdade, é proteção legal antes de publicar algo de terceiro.
  rightsConfirmed: z
    .string()
    .refine((v) => v === 'true' || v === 'on', 'É preciso confirmar que tem direito sobre a imagem')
    .transform(() => true),

  title: z.string().trim().min(1, 'Título é obrigatório').max(300),
  subtitle: z.string().trim().max(300).optional(),
  artistName: z.string().trim().max(200).optional(),
  year: z.string().trim().max(50).optional(),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(300).optional(),
  sourceUrl: z.string().trim().url('URL inválida').optional().or(z.literal('')),

  suggestedBook: z.string().trim().max(100).optional(),
  suggestedChapter: z.coerce.number().int().positive().optional(),
  suggestedVerses: z.string().trim().max(50).optional(),
  suggestedPassageText: z.string().trim().max(3000).optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export const listSubmissionsQuerySchema = z.object({
  status: z.enum(['pendente', 'aprovado', 'rejeitado']).optional(),
});

export const updateSubmissionSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  subtitle: z.string().trim().max(300).optional(),
  artistName: z.string().trim().max(200).optional(),
  year: z.string().trim().max(50).optional(),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(300).optional(),
  sourceUrl: z.string().trim().url().optional(),
  suggestedBook: z.string().trim().max(100).optional(),
  suggestedChapter: z.coerce.number().int().positive().optional(),
  suggestedVerses: z.string().trim().max(50).optional(),
  suggestedPassageText: z.string().trim().max(3000).optional(),
  reviewerNotes: z.string().trim().max(2000).optional(),
});

export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;

export const rejectSubmissionSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

// Criação de usuário do painel (roadmap, 2026-09-06) — min(12) na senha
// aqui é mais estrito que o login de propósito: essa conta publica
// obra de verdade, vale uma régua mais alta que uma senha qualquer.
export const createUserSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(12, 'Senha precisa ter pelo menos 12 caracteres'),
  role: z.enum(['admin', 'revisor']),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
