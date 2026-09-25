import { describe, it, expect } from 'vitest';
import { parseThemesParam, parseBookSlugParam } from './search-params';

describe('parseThemesParam', () => {
  it('devolve vazio pra ausência ou string vazia', () => {
    expect(parseThemesParam(null)).toEqual([]);
    expect(parseThemesParam(undefined)).toEqual([]);
    expect(parseThemesParam('')).toEqual([]);
  });

  it('devolve um slug simples', () => {
    expect(parseThemesParam('criacao')).toEqual(['criacao']);
  });

  it('separa por vírgula (multi-tema, semântica "ou")', () => {
    expect(parseThemesParam('criacao,perdao')).toEqual(['criacao', 'perdao']);
  });

  it('ignora espaços ao redor e entradas vazias', () => {
    expect(parseThemesParam(' criacao , perdao , ')).toEqual(['criacao', 'perdao']);
  });
});

describe('parseBookSlugParam', () => {
  it('devolve o slug limpo ou undefined quando ausente', () => {
    expect(parseBookSlugParam('genesis')).toBe('genesis');
    expect(parseBookSlugParam(' genesis ')).toBe('genesis');
    expect(parseBookSlugParam(null)).toBeUndefined();
    expect(parseBookSlugParam('')).toBeUndefined();
    expect(parseBookSlugParam('   ')).toBeUndefined();
  });
});