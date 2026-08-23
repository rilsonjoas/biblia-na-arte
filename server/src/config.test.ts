import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// CORS_ORIGIN precisa aceitar mais de um domínio (2026-08-23): o
// Lecionário passou a consumir essa API direto do navegador (card
// "Pintura do Dia"), então o valor de produção virou uma lista separada
// por vírgula em vez de uma string única. `env` é lido no import do
// módulo, então cada teste precisa de `vi.resetModules()` + re-import
// com o `process.env` já ajustado.
describe('config — CORS_ORIGIN', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, DATABASE_URL: 'postgresql://u:p@localhost:5432/db' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('aceita uma única origem (retrocompatível)', async () => {
    process.env.CORS_ORIGIN = 'https://biblianaarte.narniano.com';
    const { env } = await import('./config.js');
    expect(env.CORS_ORIGIN).toEqual(['https://biblianaarte.narniano.com']);
  });

  it('separa múltiplas origens por vírgula', async () => {
    process.env.CORS_ORIGIN =
      'https://biblianaarte.narniano.com,https://lecionario.narniano.com';
    const { env } = await import('./config.js');
    expect(env.CORS_ORIGIN).toEqual([
      'https://biblianaarte.narniano.com',
      'https://lecionario.narniano.com',
    ]);
  });

  it('remove espaços em volta de cada origem', async () => {
    process.env.CORS_ORIGIN =
      'https://biblianaarte.narniano.com, https://lecionario.narniano.com ';
    const { env } = await import('./config.js');
    expect(env.CORS_ORIGIN).toEqual([
      'https://biblianaarte.narniano.com',
      'https://lecionario.narniano.com',
    ]);
  });

  it('usa o default de localhost quando a variável não é definida', async () => {
    delete process.env.CORS_ORIGIN;
    const { env } = await import('./config.js');
    expect(env.CORS_ORIGIN).toEqual(['http://localhost:8080']);
  });
});
