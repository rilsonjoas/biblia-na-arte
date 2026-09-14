import { describe, it, expect } from 'vitest';
import { cn, toRomanBookName, normalizeForSearch, toRomanNumeral, sortByTitleAz } from './utils';

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

describe('toRomanNumeral', () => {
  it('converte séculos reais do acervo (achado 2026-09-02, filtro Período)', () => {
    expect(toRomanNumeral(4)).toBe('IV');
    expect(toRomanNumeral(9)).toBe('IX');
    expect(toRomanNumeral(15)).toBe('XV');
    expect(toRomanNumeral(19)).toBe('XIX');
    expect(toRomanNumeral(20)).toBe('XX');
    expect(toRomanNumeral(21)).toBe('XXI');
  });

  it('devolve o número como string pra entrada inválida', () => {
    expect(toRomanNumeral(0)).toBe('0');
    expect(toRomanNumeral(-5)).toBe('-5');
    expect(toRomanNumeral(1.5)).toBe('1.5');
  });
});

describe('normalizeForSearch', () => {
  it('ignora acento e caixa — filtro de /biblia não deve exigir digitar acento certo', () => {
    expect(normalizeForSearch('Êxodo')).toBe('exodo');
    expect(normalizeForSearch('EXODO')).toBe('exodo');
    expect(normalizeForSearch('João')).toBe('joao');
  });
});

describe('sortByTitleAz', () => {
  it('ordena por título em pt-BR sem mutar o array original', () => {
    const items = [
      { id: 'a', title: 'Zacarias' },
      { id: 'b', title: 'Abraão' },
      { id: 'c', title: 'Água viva' },
    ];
    const result = sortByTitleAz(items);
    // localeCompare 'pt-BR' é insensível a acento: "Ab" < "Ág", então
    // "Abraão" vem antes de "Água viva" — sem reordenar acentuados pro fim
    // do alfabeto, que é o que esperamos de uma lista alfabética real.
    expect(result.map((i) => i.title)).toEqual(['Abraão', 'Água viva', 'Zacarias']);
    expect(items.map((i) => i.title)).toEqual(['Zacarias', 'Abraão', 'Água viva']);
  });

  it('trata itens sem título com string vazia (não quebra)', () => {
    const items = [{ id: 'a', title: 'Beta' }, { id: 'b' }, { id: 'c', title: 'Alfa' }];
    expect(sortByTitleAz(items).map((i) => 'title' in i ? i.title : '')).toEqual(['', 'Alfa', 'Beta']);
  });
});
