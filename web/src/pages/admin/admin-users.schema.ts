import { z } from 'zod';

export const createUserFormSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(12, 'Senha precisa ter pelo menos 12 caracteres'),
  role: z.enum(['admin', 'revisor']),
});

export type CreateUserForm = z.infer<typeof createUserFormSchema>;
