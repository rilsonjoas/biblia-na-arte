import { describe, expect, it } from 'vitest';
import { isValidDateKey } from './date-key.js';

describe('isValidDateKey', () => {
  it('aceita datas que existem, inclusive 29/02 de ano bissexto', () => {
    for (const d of ['2026-10-17', '2028-02-29', '2000-02-29', '1900-01-01', '2099-12-31']) {
      expect(isValidDateKey(d), d).toBe(true);
    }
  });

  it('rejeita dia ou mês que não existe (formato certo, calendário errado)', () => {
    for (const d of ['2026-13-45', '2026-02-30', '2027-02-29', '1900-02-29', '2026-00-10', '2026-04-31', '2026-10-00']) {
      expect(isValidDateKey(d), d).toBe(false);
    }
  });

  it('rejeita formato errado', () => {
    for (const d of ['', 'abc', '2026-1-1', '26-10-17', '2026/10/17', '2026-10-17T00:00', ' 2026-10-17']) {
      expect(isValidDateKey(d), d).toBe(false);
    }
  });
});
