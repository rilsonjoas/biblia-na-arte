import { z } from 'zod';


// Espelha createSubmissionSchema do servidor (server/src/schemas/
// submission.schema.ts) — mesma régua, mensagens em português direto
// pro usuário final em vez de reaproveitar o schema do backend (que
// lida com string bruta de multipart, não com o File já tipado do
// input).
export const submitArtworkFormSchema = z.object({
  submitterName: z.string().trim().min(1, 'Seu nome é obrigatório').max(200),
  submitterEmail: z.string().trim().email('E-mail inválido'),
  submitterContact: z.string().trim().max(200).optional(),
  rightsConfirmed: z.literal(true, { error: 'É preciso confirmar que você tem direito sobre a imagem' }),
  title: z.string().trim().min(1, 'Título da obra é obrigatório').max(300),
  subtitle: z.string().trim().max(300).optional(),
  artistName: z.string().trim().max(200).optional(),
  year: z.string().trim().max(50).optional(),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(300).optional(),
  sourceUrl: z.string().trim().url('URL inválida').optional().or(z.literal('')),
  suggestedBook: z.string().trim().max(100).optional(),
  suggestedChapter: z.coerce.number().int().positive().optional().or(z.literal('')),
  suggestedVerses: z.string().trim().max(50).optional(),
  suggestedPassageText: z.string().trim().max(3000).optional(),
});

// Com o Zod 4 e `z.coerce`, o tipo de ENTRADA do formulário (o que se digita) difere do de SAÍDA (o que o schema entrega).
export type SubmitArtworkFormInput = z.input<typeof submitArtworkFormSchema>;
export type SubmitArtworkFormValues = z.output<typeof submitArtworkFormSchema>;
