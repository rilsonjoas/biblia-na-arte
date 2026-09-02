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

  // Achado 2026-09-02: "Músicas"/"Filmes" sem nenhuma obra no acervo
  // ainda não devem aparecer como opção selecionável igual às outras em
  // Filtros Avançados (leria como promessa vazia) — só em /arte, que já
  // rotula "✦ Em breve" com contagem real. `hasContent` é o sinal único
  // que os dois lugares consultam.
  it('só pintura tem conteúdo real por enquanto', () => {
    expect(CATEGORIES.filter((c) => c.hasContent).map((c) => c.slug)).toEqual(['painting']);
  });
});
