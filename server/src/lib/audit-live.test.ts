import { describe, expect, it } from 'vitest';
import { auditLive, noteSlug, parseLifeSpan, type LiveArtwork, type VaultNote } from './audit-live.js';

const obra = (over: Partial<LiveArtwork> = {}): LiveArtwork => ({
  slug: 'rembrandt-van-rijn-obra',
  title: 'Obra',
  artistOrDirector: 'Rembrandt van Rijn',
  description: 'Descrição limpa da obra.',
  year: '1633',
  licenseType: 'public-domain',
  ...over,
});
const base = {
  exportSlugs: new Set(['rembrandt-van-rijn-obra']),
  notes: [] as VaultNote[],
  lifeSpans: new Map<string, string | undefined>([['Rembrandt van Rijn', '1606-1669']]),
};
const regras = (live: LiveArtwork[], over: Partial<typeof base> = {}) => auditLive({ ...base, ...over, live }).map((f) => `${f.severity}:${f.rule}`);

describe('parseLifeSpan', () => {
  it('lê intervalos, nascimento sem morte e sem datas', () => {
    expect(parseLifeSpan('1907-1990')).toEqual({ birth: 1907, death: 1990 });
    expect(parseLifeSpan('n. 1953')).toEqual({ birth: 1953 });
    expect(parseLifeSpan('1949-')).toEqual({ birth: 1949 });
    expect(parseLifeSpan('c. 1445-1510')).toEqual({ birth: 1445, death: 1510 });
    expect(parseLifeSpan(undefined)).toBeUndefined();
    expect(parseLifeSpan('século XVII')).toBeUndefined();
  });
});

describe('auditLive', () => {
  it('obra correta não tem achados', () => {
    expect(regras([obra()])).toEqual([]);
  });

  it('ativa e ausente do export, ou marcada no vault, é erro', () => {
    expect(regras([obra()], { exportSlugs: new Set() })).toContain('erro:fora-do-export');
    const notes: VaultNote[] = [{ file: 'Rembrandt - Obra.md', slug: 'rembrandt-van-rijn-obra', exclusionReason: 'direitos: excluir' }];
    expect(regras([obra()], { notes })).toContain('erro:marcada-no-vault');
  });

  it('marca com slug de desempate por ano também é pega', () => {
    const notes: VaultNote[] = [{ file: 'X.md', slug: 'a-obra', exclusionReason: 'publicar: não' }];
    expect(regras([obra({ slug: 'a-obra-1950' })], { notes, exportSlugs: new Set(['a-obra-1950']) })).toContain('erro:marcada-no-vault');
  });

  it('autor vivo ou morto depois de 1955 em domínio público é erro; licença formal não', () => {
    const vivo = new Map([['Rembrandt van Rijn', 'n. 1953']]);
    expect(regras([obra()], { lifeSpans: vivo })).toContain('erro:autor-vivo');
    const recente = new Map([['Rembrandt van Rijn', '1907-1990']]);
    expect(regras([obra()], { lifeSpans: recente })).toContain('erro:pos-1955');
    expect(regras([obra({ licenseType: 'cc-by-sa-4.0' })], { lifeSpans: recente })).toEqual([]);
  });

  it('autor sem datas e obra do século XX é aviso; autor sem nota também', () => {
    const semDatas = new Map<string, string | undefined>([['Rembrandt van Rijn', undefined]]);
    expect(regras([obra({ year: '1928' })], { lifeSpans: semDatas })).toContain('aviso:autor-sem-datas');
    expect(regras([obra()], { lifeSpans: new Map() })).toContain('aviso:autor-sem-nota');
  });

  it('linguagem de trabalho na descrição e ano de processo são erros', () => {
    expect(regras([obra({ description: 'Fica como pendência.' })])).toContain('erro:linguagem-de-trabalho');
    expect(regras([obra({ year: 'não confirmado' })])).toContain('erro:ano-de-processo');
  });
});

describe('noteSlug', () => {
  it('usa o slug congelado; senão deriva de autor e título', () => {
    expect(noteSlug('meu-slug', 'A', 'B')).toBe('meu-slug');
    expect(noteSlug(undefined, 'Rembrandt van Rijn', 'A Obra')).toBe('rembrandt-van-rijn-a-obra');
  });
});
