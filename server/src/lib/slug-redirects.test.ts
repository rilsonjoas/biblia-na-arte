import { describe, expect, it } from 'vitest';
import {
  MAX_REDIRECT_HOPS,
  findUnexplainedRemovals,
  flattenRedirects,
  formatProblems,
  parseRedirectConfig,
  validateRedirects,
} from './slug-redirects.js';

const set = <T extends string>(...xs: T[]) => new Set<T>(xs);

describe('flattenRedirects', () => {
  it('mantém redirecionamentos diretos como estão', () => {
    const { flat, problems } = flattenRedirects({ a: 'b', c: 'd' });
    expect(flat).toEqual({ a: 'b', c: 'd' });
    expect(problems).toEqual([]);
  });

  it('achata cadeia A→B→C em A→C e mantém B→C', () => {
    const { flat, problems } = flattenRedirects({ a: 'b', b: 'c' });
    expect(flat).toEqual({ a: 'c', b: 'c' });
    expect(problems).toEqual([]);
  });

  it('achata cadeia de três saltos até o destino final', () => {
    const { flat } = flattenRedirects({ a: 'b', b: 'c', c: 'd' });
    expect(flat).toEqual({ a: 'd', b: 'd', c: 'd' });
  });

  it('recusa autorredirecionamento e não o inclui no resultado', () => {
    const { flat, problems } = flattenRedirects({ a: 'a', b: 'c' });
    expect(flat).toEqual({ b: 'c' });
    expect(problems.map((p) => [p.code, p.slug])).toEqual([['autorredirecionamento', 'a']]);
  });

  it('recusa ciclo A→B→A nos dois lados', () => {
    const { flat, problems } = flattenRedirects({ a: 'b', b: 'a' });
    expect(flat).toEqual({});
    expect(problems.map((p) => p.code)).toEqual(['ciclo', 'ciclo']);
    expect(problems.map((p) => p.slug).sort()).toEqual(['a', 'b']);
  });

  it(`recusa cadeia com mais de ${MAX_REDIRECT_HOPS} saltos`, () => {
    const raw: Record<string, string> = {};
    for (let i = 0; i <= MAX_REDIRECT_HOPS; i++) raw[`s${i}`] = `s${i + 1}`; // s0→s1→…→s6
    const { flat, problems } = flattenRedirects(raw);
    expect(problems.some((p) => p.code === 'cadeia-longa' && p.slug === 's0')).toBe(true);
    expect(flat['s0']).toBeUndefined();
  });

  it('recusa slug antigo ou destino vazio', () => {
    const { flat, problems } = flattenRedirects({ '': 'b', a: '', c: 'd' });
    expect(flat).toEqual({ c: 'd' });
    expect(problems.filter((p) => p.code === 'vazio')).toHaveLength(2);
  });

  it('não altera o objeto recebido', () => {
    const raw = { a: 'b', b: 'c' };
    flattenRedirects(raw);
    expect(raw).toEqual({ a: 'b', b: 'c' });
  });
});

describe('validateRedirects', () => {
  const ctx = (exportSlugs: string[], removed: string[] = []) => ({
    exportSlugs: set(...exportSlugs),
    removedSlugs: set(...removed),
  });

  it('aceita redirecionamento cujo destino está no export e a origem não', () => {
    expect(validateRedirects({ antigo: 'novo' }, ctx(['novo']))).toEqual([]);
  });

  it('recusa destino que não está no export', () => {
    const problems = validateRedirects({ antigo: 'novo' }, ctx(['outro']));
    expect(problems.map((p) => [p.code, p.slug])).toEqual([['destino-fora-do-export', 'antigo']]);
  });

  it('recusa slug antigo que ainda é uma obra viva no export (nunca sombrear)', () => {
    const problems = validateRedirects({ vivo: 'novo' }, ctx(['vivo', 'novo']));
    expect(problems.map((p) => [p.code, p.slug])).toEqual([['slug-vivo-sombreado', 'vivo']]);
  });

  it('recusa destino que foi declarado removido', () => {
    const problems = validateRedirects({ antigo: 'novo' }, ctx(['novo'], ['novo']));
    expect(problems.map((p) => p.code)).toContain('destino-removido');
  });

  it('recusa slug declarado removido que continua no export', () => {
    const problems = validateRedirects({}, ctx(['obra'], ['obra']));
    expect(problems.map((p) => [p.code, p.slug])).toEqual([['removido-ainda-no-export', 'obra']]);
  });

  it('reporta todos os problemas de uma vez, não só o primeiro', () => {
    const problems = validateRedirects({ a: 'x', b: 'y' }, ctx(['a'], []));
    expect(problems.map((p) => p.code).sort()).toEqual(['destino-fora-do-export', 'destino-fora-do-export', 'slug-vivo-sombreado']);
  });
});

describe('findUnexplainedRemovals', () => {
  const base = { exportSlugs: set('fica'), redirectSources: set<string>(), removedSlugs: set<string>() };

  it('não acusa obra ativa que continua no export', () => {
    expect(findUnexplainedRemovals({ ...base, activeDbSlugs: ['fica'] })).toEqual([]);
  });

  it('não acusa o que tem redirecionamento', () => {
    expect(findUnexplainedRemovals({ ...base, activeDbSlugs: ['antigo'], redirectSources: set('antigo') })).toEqual([]);
  });

  it('não acusa o que foi removido de propósito', () => {
    expect(findUnexplainedRemovals({ ...base, activeDbSlugs: ['proibida'], removedSlugs: set('proibida') })).toEqual([]);
  });

  it('acusa obra ativa que sumiu sem redirecionamento nem remoção declarada, em ordem alfabética', () => {
    expect(findUnexplainedRemovals({ ...base, activeDbSlugs: ['zeta', 'fica', 'alfa'] })).toEqual(['alfa', 'zeta']);
  });

  it('lida com banco vazio', () => {
    expect(findUnexplainedRemovals({ ...base, activeDbSlugs: [] })).toEqual([]);
  });
});

describe('parseRedirectConfig', () => {
  it('aceita um mapa de strings e uma lista de strings', () => {
    const cfg = parseRedirectConfig({ antigo: 'novo' }, ['retirada']);
    expect(cfg).toEqual({ redirects: { antigo: 'novo' }, removed: ['retirada'], problems: [] });
  });

  it('arquivo ausente (undefined) vale como vazio, sem problema', () => {
    expect(parseRedirectConfig(undefined, undefined)).toEqual({ redirects: {}, removed: [], problems: [] });
  });

  it('recusa mapa que não é objeto (lista, null, texto)', () => {
    for (const raw of [['a', 'b'], null, 'texto', 42]) {
      const cfg = parseRedirectConfig(raw, []);
      expect(cfg.redirects).toEqual({});
      expect(cfg.problems.map((p) => p.code)).toEqual(['formato-invalido']);
    }
  });

  it('recusa destino que não é texto e mantém as entradas boas', () => {
    const cfg = parseRedirectConfig({ bom: 'novo', ruim: 7, pior: null }, []);
    expect(cfg.redirects).toEqual({ bom: 'novo' });
    expect(cfg.problems.map((p) => [p.code, p.slug]).sort()).toEqual([
      ['formato-invalido', 'pior'],
      ['formato-invalido', 'ruim'],
    ]);
  });

  it('recusa lista de removidos que não é lista', () => {
    const cfg = parseRedirectConfig({}, { a: 1 });
    expect(cfg.removed).toEqual([]);
    expect(cfg.problems.map((p) => p.code)).toEqual(['formato-invalido']);
  });

  it('recusa item de removidos vazio ou que não é texto, e tira duplicata', () => {
    const cfg = parseRedirectConfig({}, ['a', 'a', '', 5, 'b']);
    expect(cfg.removed).toEqual(['a', 'b']);
    expect(cfg.problems).toHaveLength(2);
  });
});

describe('formatProblems', () => {
  it('lista código, slug e detalhe de cada problema, uma linha por problema', () => {
    const text = formatProblems([
      { code: 'ciclo', slug: 'a', detail: 'a → b → a' },
      { code: 'vazio', slug: '', detail: 'destino vazio' },
    ]);
    expect(text).toContain('ciclo');
    expect(text).toContain('a → b → a');
    expect(text).toContain('vazio');
    expect(text.split('\n')).toHaveLength(2);
  });
});
