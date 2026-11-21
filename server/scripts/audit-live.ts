#!/usr/bin/env tsx
/**
 * Confere o catálogo NO AR (API de produção) contra o vault e o vault-export.json.
 *
 *   pnpm --filter server exec tsx scripts/audit-live.ts
 *   AUDIT_API=https://api-biblianaarte.narniano.com/api/v1 AUDIT_AVISOS=1 ...
 *
 * Saída 0 = sem erros; 1 = há erros (avisos não derrubam). Rode depois de cada lote e de cada deploy.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { auditLive, noteSlug, type LiveArtwork, type VaultNote } from '../src/lib/audit-live.js';
import { deriveArtistFromFilename, extractFrontmatter, extractWikilink, frontmatterExclusionReason, parseTitleParts, titleFromFilename } from '../src/lib/vault-parse.js';

const API = process.env.AUDIT_API ?? 'https://api-biblianaarte.narniano.com/api/v1';
const VAULT = process.env.VAULT_DIR ?? '/home/narniano/Documentos/Rilson';
const PINTURAS = path.join(VAULT, '10 - Arte e literatura/Pinturas');
const AUTORES = path.join(VAULT, '10 - Arte e literatura/Autores');

async function fetchLive(): Promise<LiveArtwork[]> {
  const byId = new Map<string, LiveArtwork & { id: string }>();
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${API}/artworks?limit=1000&page=${page}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = (await res.json()) as { items: (LiveArtwork & { id: string })[]; total: number };
    for (const item of json.items) byId.set(item.id, item);
    if (byId.size >= json.total || json.items.length === 0) break;
  }
  return [...byId.values()];
}

const live = await fetchLive();
const exportSlugs = new Set(
  (JSON.parse(readFileSync(path.resolve(import.meta.dirname, 'vault-export.json'), 'utf-8')) as { artworks: { slug: string }[] }).artworks.map((a) => a.slug),
);

const notes: VaultNote[] = readdirSync(PINTURAS)
  .filter((f) => f.endsWith('.md'))
  .map((file) => {
    const content = readFileSync(path.join(PINTURAS, file), 'utf-8');
    const fm = extractFrontmatter(content);
    const artist = (fm?.autor ? extractWikilink(fm.autor) : '') || deriveArtistFromFilename(file);
    const title = parseTitleParts(titleFromFilename(file)).title;
    return { file, slug: noteSlug(typeof fm?.slug === 'string' ? fm.slug : undefined, artist, title), exclusionReason: frontmatterExclusionReason(fm) };
  });

const lifeSpans = new Map<string, string | undefined>();
for (const f of readdirSync(AUTORES).filter((n) => n.endsWith('.md'))) {
  const m = /^Período de vida:[ \t]*(.*)$/m.exec(readFileSync(path.join(AUTORES, f), 'utf-8'));
  lifeSpans.set(f.slice(0, -3), m?.[1]?.trim() || undefined);
}

const findings = auditLive({ live, exportSlugs, notes, lifeSpans });
const errors = findings.filter((f) => f.severity === 'erro');
const warnings = findings.filter((f) => f.severity === 'aviso');
for (const f of process.env.AUDIT_AVISOS === '1' ? findings : errors) console.log(`${f.severity === 'erro' ? '✖' : '⚠'} [${f.rule}] ${f.slug}\n    ${f.message}`);
const byRule = new Map<string, number>();
for (const f of findings) byRule.set(`${f.severity}:${f.rule}`, (byRule.get(`${f.severity}:${f.rule}`) ?? 0) + 1);
console.log(`\n${live.length} obra(s) no ar conferida(s): ${errors.length} erro(s), ${warnings.length} aviso(s).`);
if (byRule.size > 0) console.log([...byRule].map(([k, v]) => `  ${k} ${v}`).join('\n'));
process.exit(errors.length > 0 ? 1 : 0);
