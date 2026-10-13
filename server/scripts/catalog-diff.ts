#!/usr/bin/env tsx
/**
 * Resume o que mudou entre dois exports do catálogo e ajuda a fechar os redirecionamentos.
 *
 *   tsx scripts/catalog-diff.ts <export-anterior.json> [--write-suggestions]
 *
 * Compara o export anterior com `vault-export.json` (o novo). Imprime obras novas,
 * removidas e alteradas. Para cada obra que SUMIU sem explicação (sem redirecionamento
 * nem removed-slugs.json), procura a nova de mesmo título e sugere o par. Com
 * `--write-suggestions` grava os pares únicos em slug-redirects.json.
 *
 * Saída 0 = tudo explicado; 2 = sobraram obras sumidas sem explicação (o reseed vai
 * recusar). Revise os pares sugeridos: autoria corrigida também gera par (Jan → Pieter).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { diffCatalog, suggestRedirects, type CatalogArtwork } from '../src/lib/catalog-diff.js';

const DIR = import.meta.dirname;
const NEW_JSON = path.resolve(DIR, 'vault-export.json');
const REDIRECTS_JSON = path.resolve(DIR, 'slug-redirects.json');
const REMOVED_JSON = path.resolve(DIR, 'removed-slugs.json');

const [prevPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const write = process.argv.includes('--write-suggestions');
if (!prevPath) {
  console.error('uso: tsx scripts/catalog-diff.ts <export-anterior.json> [--write-suggestions]');
  process.exit(1);
}

const readArtworks = (p: string) => (JSON.parse(readFileSync(p, 'utf-8')) as { artworks: CatalogArtwork[] }).artworks;
const prev = readArtworks(prevPath);
const next = readArtworks(NEW_JSON);
const redirects: Record<string, string> = existsSync(REDIRECTS_JSON) ? JSON.parse(readFileSync(REDIRECTS_JSON, 'utf-8')) : {};
const removedSlugs = new Set<string>(existsSync(REMOVED_JSON) ? (JSON.parse(readFileSync(REMOVED_JSON, 'utf-8')) as string[]) : []);

const d = diffCatalog(prev, next);
const s = suggestRedirects(d.removed, d.added, redirects, removedSlugs);

console.log(`Catálogo: ${prev.length} → ${next.length} obras`);
console.log(`  novas ........ ${d.added.length}`);
console.log(`  removidas .... ${d.removed.length}`);
console.log(`  alteradas .... ${d.changed.length}`);
for (const a of d.added.slice(0, 30)) console.log(`    + ${a.slug}`);

const pairs = Object.entries(s.pairs);
if (pairs.length) {
  console.log(`\nMudaram de endereço (mesmo título), ${pairs.length}:`);
  for (const [from, to] of pairs) console.log(`    ${from}\n      → ${to}`);
  if (write) {
    writeFileSync(REDIRECTS_JSON, JSON.stringify({ ...redirects, ...s.pairs }, null, 2) + '\n');
    console.log(`  ✓ gravado em slug-redirects.json`);
  } else {
    console.log('  (rode com --write-suggestions para gravar em slug-redirects.json)');
  }
}

const sobras = [...s.unmatched, ...s.ambiguous];
const aindaPendentes = write ? sobras : [...sobras, ...pairs.map(([from]) => from)];
if (sobras.length) {
  console.log(`\n⚠️  ${sobras.length} obra(s) sumiram e NÃO têm par:`);
  for (const slug of s.unmatched) console.log(`    ${slug}  (sem obra nova de mesmo título)`);
  for (const slug of s.ambiguous) console.log(`    ${slug}  (título repetido; decida o par à mão)`);
  console.log('  Se a remoção é de propósito (direitos), ponha o slug em removed-slugs.json; se o endereço mudou, em slug-redirects.json.');
}
process.exit(aindaPendentes.length ? 2 : 0);
