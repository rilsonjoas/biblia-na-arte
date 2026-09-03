import { describe, expect, it } from 'vitest';
import {
  getLectionaryEntry,
  getReferencesForSeason,
  parseLectionaryRef,
} from './lectionary-refs.js';

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

describe('getLectionaryEntry', () => {
  it('encontra as leituras + estação de uma data real coberta pela tabela copiada do Lecionário', () => {
    // 13/07/2025 — Domingo do Bom Samaritano no ciclo C, verificado contra
    // o Lecionário antes de fixar no teste.
    const entry = getLectionaryEntry('2025-07-13');
    expect(entry?.season).toBe('ordinary');
    expect(entry?.refs).toEqual(expect.arrayContaining(['Lucas 10:25-37']));
  });

  it('marca a Páscoa e o Advento com a estação certa', () => {
    // Páscoa 2026 (calculada via algoritmo Gregoriano, verificado contra
    // fonte externa antes de fixar — ver ROADMAP): 05/04/2026.
    expect(getLectionaryEntry('2026-04-05')?.season).toBe('easter');
    // 1º Domingo do Advento 2026: 29/11/2026.
    expect(getLectionaryEntry('2026-11-29')?.season).toBe('advent');
  });

  it('devolve undefined pra data fora da tabela (ex.: muito no futuro)', () => {
    expect(getLectionaryEntry('2099-01-01')).toBeUndefined();
  });
});

describe('getReferencesForSeason', () => {
  it('junta referências de várias datas da mesma estação, sem duplicar', () => {
    const refs = getReferencesForSeason('easter');
    expect(refs.length).toBeGreaterThan(10);
    expect(refs).toEqual([...new Set(refs)]);
  });

  it('devolve vazio pra estação que não existe na tabela', () => {
    expect(getReferencesForSeason('nao-existe')).toEqual([]);
  });
});
