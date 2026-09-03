import { describe, expect, it } from 'vitest';
import { getReferencesForDate, parseLectionaryRef } from './lectionary-refs.js';

describe('parseLectionaryRef', () => {
  it('extrai livro (slug) + capítulo de uma referência simples', () => {
    expect(parseLectionaryRef('Lucas 10:25-37')).toEqual({ bookSlug: 'luke', chapter: 10 });
  });

  it('funciona sem versículo (leitura de capítulo inteiro)', () => {
    expect(parseLectionaryRef('Salmo 122')).toEqual({ bookSlug: 'psalms', chapter: 122 });
  });

  it('resolve livro com número no nome', () => {
    expect(parseLectionaryRef('1 Coríntios 1:3-9')).toEqual({
      bookSlug: '1-corinthians',
      chapter: 1,
    });
  });

  it('devolve null pra livro deuterocanônico (fora do cânon de 66 livros catalogado)', () => {
    // Achado real ao investigar "Pintura do Dia sumindo" (ROADMAP
    // 2026-09-02) — não quebra nada porque essa leitura simplesmente não
    // contribui pool, mas documenta o limite conhecido.
    expect(parseLectionaryRef('Sabedoria 4:7-15')).toBeNull();
  });

  it('devolve null pra texto que não bate o padrão livro+capítulo', () => {
    expect(parseLectionaryRef('')).toBeNull();
    expect(parseLectionaryRef('só texto sem número')).toBeNull();
  });
});

describe('getReferencesForDate', () => {
  it('encontra as leituras de uma data real coberta pela tabela copiada do Lecionário', () => {
    // 13/07/2025 — Domingo do Bom Samaritano no ciclo C, verificado contra
    // o Lecionário antes de fixar no teste.
    expect(getReferencesForDate('2025-07-13')).toEqual(
      expect.arrayContaining(['Lucas 10:25-37']),
    );
  });

  it('devolve undefined pra data fora da tabela (ex.: muito no futuro)', () => {
    expect(getReferencesForDate('2099-01-01')).toBeUndefined();
  });
});
