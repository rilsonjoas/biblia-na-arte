import { describe, it, expect } from 'vitest';
import { CATEGORIES, getCategoryMeta } from './categories';

describe('categories', () => {
  it('tem as 3 categorias do acervo', () => {
    expect(CATEGORIES.map((c) => c.slug)).toEqual(['painting', 'music', 'film']);
  });

  it('getCategoryMeta acha pela slug', () => {
    expect(getCategoryMeta('painting')?.name).toBe('Pinturas');
    expect(getCategoryMeta('film')?.name).toBe('Filmes');
  });

  it('getCategoryMeta devolve undefined pra slug inválida ou vazia', () => {
    expect(getCategoryMeta('sculpture')).toBeUndefined();
    expect(getCategoryMeta(undefined)).toBeUndefined();
  });
});
