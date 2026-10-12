import { describe, it, expect } from 'vitest';
import { catalogContentEquals, diffCatalog, preserveCreatedAt, suggestRedirects, dropSitemapSlugs, type CatalogArtwork } from './catalog-diff.js';

type Obra = CatalogArtwork & Record<string, unknown>;
const art = (slug: string, title: string, extra: Record<string, unknown> = {}): Obra => ({
  slug,
  title,
  createdAt: '2026-09-12T03:57:14.000Z',
  ...extra,
});

describe('diffCatalog', () => {
  it('separa novas, removidas e alteradas (ignora id/createdAt)', () => {
    const prev = [art('a', 'A'), art('b', 'B'), art('c', 'C', { description: 'x' })];
    const next = [art('a', 'A', { createdAt: '2026-10-12T00:00:00.000Z' }), art('c', 'C', { description: 'y' }), art('d', 'D')];
    const d = diffCatalog(prev, next);
    expect(d.added.map((x) => x.slug)).toEqual(['d']);
    expect(d.removed.map((x) => x.slug)).toEqual(['b']);
    expect(d.changed).toEqual(['c']);
  });
  it('catálogo igual: nada', () => {
    const a = [art('a', 'A')];
    expect(diffCatalog(a, a)).toEqual({ added: [], removed: [], changed: [] });
  });
});

describe('preserveCreatedAt', () => {
  it('mantém a data anterior de obra que já existia; obra nova fica com a sua', () => {
    const prev = [art('a', 'A', { createdAt: '2026-09-01T00:00:00.000Z' })];
    const next = [art('a', 'A', { createdAt: '2026-10-12T10:00:00.000Z' }), art('n', 'N', { createdAt: '2026-10-12T10:00:00.000Z' })];
    const out = preserveCreatedAt(next, prev, {});
    expect(out.find((x) => x.slug === 'a')!.createdAt).toBe('2026-09-01T00:00:00.000Z');
    expect(out.find((x) => x.slug === 'n')!.createdAt).toBe('2026-10-12T10:00:00.000Z');
  });
  it('obra renomeada herda a data da obra antiga via redirecionamento', () => {
    const prev = [art('velho', 'V', { createdAt: '2026-09-01T00:00:00.000Z' })];
    const next = [art('novo', 'V', { createdAt: '2026-10-12T10:00:00.000Z' })];
    expect(preserveCreatedAt(next, prev, { velho: 'novo' })[0]!.createdAt).toBe('2026-09-01T00:00:00.000Z');
  });
  it('não muta a entrada', () => {
    const next = [art('a', 'A', { createdAt: '2026-10-12T10:00:00.000Z' })];
    preserveCreatedAt(next, [art('a', 'A', { createdAt: '2026-09-01T00:00:00.000Z' })], {});
    expect(next[0]!.createdAt).toBe('2026-10-12T10:00:00.000Z');
  });
});

describe('suggestRedirects', () => {
  it('pareia removida e nova de mesmo título, uma para uma', () => {
    const removed = [art('velho-longo', 'O censo em Belém'), art('x', 'Outra')];
    const added = [art('novo', 'O censo em Belém'), art('y', 'Nada a ver')];
    const r = suggestRedirects(removed, added, {}, new Set());
    expect(r.pairs).toEqual({ 'velho-longo': 'novo' });
    expect(r.unmatched).toEqual(['x']);
  });
  it('título repetido dos dois lados é ambíguo: não sugere', () => {
    const removed = [art('v1', 'Mesmo'), art('v2', 'Mesmo')];
    const added = [art('n1', 'Mesmo')];
    const r = suggestRedirects(removed, added, {}, new Set());
    expect(r.pairs).toEqual({});
    expect(r.ambiguous.sort()).toEqual(['v1', 'v2']);
  });
  it('ignora removida já coberta por redirecionamento ou removed-slugs', () => {
    const removed = [art('v1', 'A'), art('v2', 'B')];
    const added = [art('n1', 'A'), art('n2', 'B')];
    const r = suggestRedirects(removed, added, { v1: 'n1' }, new Set(['v2']));
    expect(r.pairs).toEqual({});
    expect(r.unmatched).toEqual([]);
  });
});

describe('dropSitemapSlugs', () => {
  const locs = ['https://s/obra/a', 'https://s/obra/b', 'https://s/sobre'];
  it('tira só as URLs /obra/<slug> pedidas', () => {
    expect(dropSitemapSlugs(locs, new Set(['b']))).toEqual(['https://s/obra/a', 'https://s/sobre']);
  });
  it('não tira outra página com nome parecido', () => {
    expect(dropSitemapSlugs(['https://s/obra/ab', 'https://s/obra/a/b'], new Set(['a']))).toEqual(['https://s/obra/ab', 'https://s/obra/a/b']);
  });
});

describe('catalogContentEquals', () => {
  const base: { artworks: unknown; artists: unknown; themes: unknown; exportedAt: string } = { artworks: [art('a', 'A')], artists: [{ name: 'X' }], themes: [{ slug: 't' }], exportedAt: '2026-10-01T00:00:00.000Z' };
  it('ignora exportedAt', () => {
    expect(catalogContentEquals(base, { ...base, exportedAt: '2026-10-12T00:00:00.000Z' })).toBe(true);
  });
  it('detecta mudança em obras, artistas ou temas', () => {
    expect(catalogContentEquals(base, { ...base, artworks: [art('a', 'B')] })).toBe(false);
    expect(catalogContentEquals(base, { ...base, artists: [] })).toBe(false);
    expect(catalogContentEquals(base, { ...base, themes: [] })).toBe(false);
  });
});
