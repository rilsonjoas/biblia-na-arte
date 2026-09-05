import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './auth.js';

describe('hashPassword / verifyPassword', () => {
  it('verifica corretamente a senha certa', () => {
    const stored = hashPassword('minha-senha-secreta');
    expect(verifyPassword('minha-senha-secreta', stored)).toBe(true);
  });

  it('rejeita senha errada', () => {
    const stored = hashPassword('minha-senha-secreta');
    expect(verifyPassword('senha-errada', stored)).toBe(false);
  });

  it('gera hashes diferentes pra mesma senha (salt aleatório)', () => {
    const a = hashPassword('mesma-senha');
    const b = hashPassword('mesma-senha');
    expect(a).not.toBe(b);
    expect(verifyPassword('mesma-senha', a)).toBe(true);
    expect(verifyPassword('mesma-senha', b)).toBe(true);
  });

  it('não quebra com hash em formato inválido/corrompido', () => {
    expect(verifyPassword('qualquer-coisa', 'nao-e-um-hash-valido')).toBe(false);
    expect(verifyPassword('qualquer-coisa', '')).toBe(false);
  });
});
