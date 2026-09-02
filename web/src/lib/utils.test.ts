import { describe, it, expect } from 'vitest';
import { cn, toRomanBookName, normalizeForSearch } from './utils';

describe('cn', () => {
  it('junta classes e resolve conflitos de tailwind-merge', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('ignora falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});

describe('toRomanBookName', () => {
  it('converte o prefixo numérico de livros com 2ª/3ª carta pra romano', () => {
    expect(toRomanBookName('1 Pedro')).toBe('I Pedro');
    expect(toRomanBookName('2 Pedro')).toBe('II Pedro');
    expect(toRomanBookName('1 João')).toBe('I João');
    expect(toRomanBookName('2 João')).toBe('II João');
    expect(toRomanBookName('3 João')).toBe('III João');
    expect(toRomanBookName('1 Samuel')).toBe('I Samuel');
    expect(toRomanBookName('2 Crônicas')).toBe('II Crônicas');
  });

  it('não mexe em nomes sem prefixo numérico', () => {
    expect(toRomanBookName('Gênesis')).toBe('Gênesis');
    expect(toRomanBookName('Apocalipse')).toBe('Apocalipse');
  });
});

describe('normalizeForSearch', () => {
  it('ignora acento e caixa — filtro de /biblia não deve exigir digitar acento certo', () => {
    expect(normalizeForSearch('Êxodo')).toBe('exodo');
    expect(normalizeForSearch('EXODO')).toBe('exodo');
    expect(normalizeForSearch('João')).toBe('joao');
  });
});
