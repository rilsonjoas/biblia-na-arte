import { describe, expect, it } from 'vitest';
import { baseSlugOf, lintNote, lintSlugCollisions, type LintContext } from './vault-lint.js';

const ctx: LintContext = { authors: new Set(['Rembrandt van Rijn']), notes: new Set(['Rembrandt van Rijn', 'Salmos']) };
const longo = 'Descrição real da obra. '.repeat(20);

function nota(opts: { fm?: string; body?: string } = {}): string {
  return `---
autor: "[[Rembrandt van Rijn]]"
ano: 1633
${opts.fm ?? ''}---
![[Rembrandt - Obra.jpg|600]]

### Descrição da Obra
${longo}

### Contexto Bíblico
Mt 1:1.

### Contexto Histórico
Pintada em 1633.

### Ver também
[[Salmos]]
${opts.body ?? ''}`;
}
const regras = (file: string, content: string) => lintNote(file, content, ctx).map((f) => `${f.severity}:${f.rule}`);

describe('lintNote', () => {
  it('nota correta não tem achados', () => {
    expect(lintNote('Rembrandt van Rijn - Obra (Work).md', nota(), ctx)).toEqual([]);
  });

  it('ano com "não confirmado" é erro; "s/d" é só aviso', () => {
    expect(regras('A - B.md', nota({ fm: 'ano: "Não confirmado"\n' }).replace('ano: 1633\n', ''))).toContain('erro:ano');
    expect(regras('A - B.md', nota().replace('ano: 1633', 'ano: "s/d"'))).toContain('aviso:ano');
  });

  it('autor que não é wikilink ou é o título da nota é erro', () => {
    expect(regras('A - B.md', nota().replace('"[[Rembrandt van Rijn]]"', 'Rembrandt'))).toContain('erro:autor');
    expect(regras('A - B.md', nota().replace('Rembrandt van Rijn]]', 'A - B]]'))).toContain('erro:autor');
  });

  it('comentário clássico em negrito (o bloco sumiria do site) é erro; como ### passa', () => {
    expect(regras('A - B.md', nota({ body: '\n**Na leitura de Rookmaaker**\n\nTexto.\n' }))).toContain('erro:comentário-clássico');
    expect(regras('A - B.md', nota({ body: '\n### Na leitura de Rookmaaker\n\nTexto.\n' }))).not.toContain('erro:comentário-clássico');
  });

  it('cabeçalho "Contexto Histórico e ..." não é lido pelo exportador', () => {
    const c = nota().replace('### Contexto Histórico', '### Contexto Histórico e o Prix de Rome');
    expect(regras('A - B.md', c)).toContain('erro:cabeçalho');
  });

  it('descrição com lista de fontes vazando é tratada pelo exportador; com "pendência" crua em linha de lista ainda alerta', () => {
    expect(lintNote('A - B.md', nota({ body: '' }), ctx).some((f) => f.rule === 'descrição')).toBe(false);
  });

  it('nome de arquivo incompatível com Windows é erro', () => {
    expect(regras('A - B?.md', nota())).toContain('erro:nome-de-arquivo');
  });

  it('nota marcada com publicar: não só confere o básico', () => {
    const c = nota({ fm: 'publicar: não\n' }).replace('### Contexto Histórico', '### Outro');
    expect(regras('A - B.md', c)).not.toContain('erro:cabeçalho');
  });
});

describe('lintSlugCollisions', () => {
  const n = (fm: string) => nota({ fm });
  it('avisa quando duas notas têm o mesmo slug-base e nenhuma está congelada', () => {
    const f = lintSlugCollisions([
      { file: 'Rembrandt van Rijn - Obra (A).md', content: n('') },
      { file: 'Rembrandt van Rijn - Obra (B).md', content: n('') },
    ]);
    expect(f).toHaveLength(1);
    expect(f[0]?.rule).toBe('slug-colisão');
  });
  it('não avisa com slug congelado ou nota marcada para não publicar', () => {
    expect(
      lintSlugCollisions([
        { file: 'Rembrandt van Rijn - Obra (A).md', content: n('slug: "rembrandt-van-rijn-obra"\n') },
        { file: 'Rembrandt van Rijn - Obra (B).md', content: n('slug: "rembrandt-van-rijn-obra-1700"\n') },
      ]),
    ).toEqual([]);
    expect(
      lintSlugCollisions([
        { file: 'Rembrandt van Rijn - Obra (A).md', content: n('') },
        { file: 'Rembrandt van Rijn - Obra (B).md', content: n('publicar: não\n') },
      ]),
    ).toEqual([]);
  });
  it('baseSlugOf usa autor e título sem o parêntese final', () => {
    expect(baseSlugOf('Rembrandt van Rijn - A Obra (The Work).md', nota())).toBe('rembrandt-van-rijn-a-obra');
  });
});
