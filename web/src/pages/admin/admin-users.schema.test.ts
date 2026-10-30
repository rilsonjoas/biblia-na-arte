import { describe, expect, it } from 'vitest';
import { createUserFormSchema as schema } from './admin-users.schema';

const msgs = (r: ReturnType<typeof schema.safeParse>) => (r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));

/** Formulário de criação de usuário do painel. Migração para o Zod 4 (30/10/2026): mesmas mensagens e regras. */
describe('formulário de criação de usuário', () => {
  const ok = { email: 'a@exemplo.org', password: 'uma-senha-de-12+', role: 'revisor' };

  it('aceita dados válidos e apara o e-mail', () => {
    expect(schema.parse({ ...ok, email: '  a@exemplo.org ' }).email).toBe('a@exemplo.org');
  });

  it('e-mail inválido e senha curta, com as mensagens em português', () => {
    const m = msgs(schema.safeParse({ ...ok, email: 'x', password: '12345678901' }));
    expect(m).toContain('email: E-mail inválido');
    expect(m).toContain('password: Senha precisa ter pelo menos 12 caracteres');
  });

  it('a senha de 12 caracteres passa e a de 11 não', () => {
    expect(schema.safeParse({ ...ok, password: '123456789012' }).success).toBe(true);
    expect(schema.safeParse({ ...ok, password: '12345678901' }).success).toBe(false);
  });

  it('só admin e revisor são papéis válidos', () => {
    expect(schema.safeParse({ ...ok, role: 'admin' }).success).toBe(true);
    expect(schema.safeParse({ ...ok, role: 'dono' }).success).toBe(false);
  });
});
