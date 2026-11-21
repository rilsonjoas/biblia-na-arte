#!/usr/bin/env tsx
/**
 * Confere as notas de pintura do vault contra o contrato do exportador (src/lib/vault-lint.ts).
 *
 *   pnpm --filter server exec tsx scripts/vault-lint.ts                 # todas as notas
 *   pnpm --filter server exec tsx scripts/vault-lint.ts Rembrandt Dyce   # só as cujo nome contém algum termo
 *   VAULT_LINT_AVISOS=1 ...                                              # mostra também os avisos
 *
 * Saída 0 = sem erros; 1 = há erros (avisos não derrubam). Rode depois de cada lote e antes do export.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { lintNote, lintSlugCollisions, type Finding } from '../src/lib/vault-lint.js';

const VAULT = process.env.VAULT_DIR ?? '/home/narniano/Documentos/Rilson';
const PINTURAS = path.join(VAULT, '10 - Arte e literatura/Pinturas');
const AUTORES = path.join(VAULT, '10 - Arte e literatura/Autores');

function allNoteNames(dir: string, acc = new Set<string>()): Set<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) allNoteNames(full, acc);
    else if (entry.name.endsWith('.md')) acc.add(entry.name.slice(0, -3));
  }
  return acc;
}

const terms = process.argv.slice(2);
const authors = new Set(readdirSync(AUTORES).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)));
const notes = allNoteNames(VAULT);
const files = readdirSync(PINTURAS).filter((f) => f.endsWith('.md')).sort();
const entries = files.map((file) => ({ file, content: readFileSync(path.join(PINTURAS, file), 'utf-8') }));
const selected = terms.length > 0 ? entries.filter((e) => terms.some((t) => e.file.includes(t))) : entries;

const findings: Finding[] = [
  ...selected.flatMap((e) => lintNote(e.file, e.content, { authors, notes })),
  ...lintSlugCollisions(entries).filter((f) => selected.some((e) => e.file === f.file)),
];

const errors = findings.filter((f) => f.severity === 'erro');
const warnings = findings.filter((f) => f.severity === 'aviso');
const show = process.env.VAULT_LINT_AVISOS === '1' ? findings : errors;
for (const f of show) console.log(`${f.severity === 'erro' ? '✖' : '⚠'} [${f.rule}] ${f.file}\n    ${f.message}`);

const byRule = new Map<string, number>();
for (const f of findings) byRule.set(`${f.severity}:${f.rule}`, (byRule.get(`${f.severity}:${f.rule}`) ?? 0) + 1);
console.log(`\n${selected.length} nota(s) conferida(s): ${errors.length} erro(s), ${warnings.length} aviso(s).`);
if (byRule.size > 0) console.log([...byRule].map(([k, v]) => `  ${k} ${v}`).join('\n'));
process.exit(errors.length > 0 ? 1 : 0);
