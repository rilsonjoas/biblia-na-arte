import { describe, it, expect } from 'vitest';
import { themeLabel, humanizeThemeSlug } from './theme-labels.js';

describe('themeLabel', () => {
  it('usa o nome curado (com acento) quando existe', () => {
    expect(themeLabel('ressurreicao')).toBe('Ressurreição');
    expect(themeLabel('bom-samaritano')).toBe('Bom Samaritano');
    expect(themeLabel('maria-e-marta')).toBe('Maria e Marta');
  });

  it('cai no fallback deslugificado (sem acento) pra tema não curado', () => {
    expect(themeLabel('tumba-vazia')).toBe('Tumba Vazia');
    expect(themeLabel('zombaria')).toBe('Zombaria');
  });
});

describe('humanizeThemeSlug', () => {
  it('troca hífen por espaço e capitaliza cada palavra', () => {
    expect(humanizeThemeSlug('mar-vermelho')).toBe('Mar Vermelho');
    expect(humanizeThemeSlug('sabado')).toBe('Sabado');
  });
});
