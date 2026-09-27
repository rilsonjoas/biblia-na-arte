import { describe, it, expect } from 'vitest';
import { safeSourceUrl, hasSourceUrlLink } from './source-url';

describe('safeSourceUrl', () => {
  it('devolve a URL quando é uma URL', () => {
    expect(safeSourceUrl('https://www.museivaticani.va/content/x')).toBe(
      'https://www.museivaticani.va/content/x',
    );
    expect(safeSourceUrl('http://exemplo.org/obra')).toBe('http://exemplo.org/obra');
  });

  it('recusa texto de curadoria no lugar de URL', () => {
    // Os 6 casos reais encontrados na produção em 2026-09-27.
    expect(safeSourceUrl('Domínio Público')).toBeNull();
    expect(safeSourceUrl('Domínio Público (localização/acervo não confirmados)')).toBeNull();
  });

  it('limpa aspas que envolvem uma URL boa', () => {
    // Os outros 2 casos reais: URL válida envolvida em apóstrofos, que
    // quebravam porque o navegador não enxerga esquema.
    expect(safeSourceUrl("'https://www.museivaticani.va/content/x'")).toBe(
      'https://www.museivaticani.va/content/x',
    );
    expect(safeSourceUrl('"https://exemplo.org/obra"')).toBe('https://exemplo.org/obra');
    expect(safeSourceUrl("  'https://exemplo.org/obra'  ")).toBe('https://exemplo.org/obra');
  });

  it('não desfaz aspas que não envolvem o valor inteiro', () => {
    expect(safeSourceUrl("'https://a.org' e 'https://b.org'")).toBeNull();
  });

  it('recusa esquema que não é web', () => {
    expect(safeSourceUrl('javascript:alert(1)')).toBeNull();
    expect(safeSourceUrl('ftp://exemplo.org/arquivo.zip')).toBeNull();
    expect(safeSourceUrl('/obra/123')).toBeNull();
    expect(safeSourceUrl('mailto:alguem@exemplo.org')).toBeNull();
  });

  it('trata ausente e vazio como sem fonte', () => {
    expect(safeSourceUrl(null)).toBeNull();
    expect(safeSourceUrl(undefined)).toBeNull();
    expect(safeSourceUrl('')).toBeNull();
    expect(safeSourceUrl('   ')).toBeNull();
  });
});

describe('hasSourceUrlLink', () => {
  it('responde se vale renderizar o badge', () => {
    expect(hasSourceUrlLink('https://exemplo.org')).toBe(true);
    expect(hasSourceUrlLink('Domínio Público')).toBe(false);
    expect(hasSourceUrlLink("'https://exemplo.org'")).toBe(true);
    expect(hasSourceUrlLink(null)).toBe(false);
  });
});
