/**
 * Testes da decisão de `reseed-if-data-changed.sh dry` (RESEED_PLAN_ONLY=1: só diz
 * "reseed" ou "skip", não toca em Docker nem em banco). Usa um repositório git
 * descartável com os mesmos caminhos de dados do projeto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SCRIPT = path.resolve(import.meta.dirname, 'reseed-if-data-changed.sh');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

function makeRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'reseed-test-'));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.email', 't@t');
  git(dir, 'config', 'user.name', 't');
  mkdirSync(path.join(dir, 'scripts'));
  mkdirSync(path.join(dir, 'server/scripts'), { recursive: true });
  copyFileSync(SCRIPT, path.join(dir, 'scripts/reseed-if-data-changed.sh'));
  writeFileSync(path.join(dir, 'server/scripts/vault-export.json'), '{}');
  writeFileSync(path.join(dir, 'server/scripts/slug-redirects.json'), '{}');
  writeFileSync(path.join(dir, 'server/scripts/removed-slugs.json'), '[]');
  writeFileSync(path.join(dir, 'README.md'), 'a');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'base');
  return dir;
}

function plan(dir, old, extraEnv = {}) {
  return execFileSync('bash', [path.join(dir, 'scripts/reseed-if-data-changed.sh'), 'dry', old], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, RESEED_PLAN_ONLY: '1', ...extraEnv },
  }).trim();
}

function commitChange(dir, file, content) {
  writeFileSync(path.join(dir, file), content);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'mudança');
}

test('sem mudança nos dados: skip', () => {
  const dir = makeRepo();
  const old = git(dir, 'rev-parse', 'HEAD');
  commitChange(dir, 'README.md', 'b');
  assert.equal(plan(dir, old), 'skip');
  rmSync(dir, { recursive: true, force: true });
});

for (const f of ['server/scripts/vault-export.json', 'server/scripts/slug-redirects.json', 'server/scripts/removed-slugs.json']) {
  test(`mudou ${path.basename(f)}: reseed`, () => {
    const dir = makeRepo();
    const old = git(dir, 'rev-parse', 'HEAD');
    commitChange(dir, f, f.endsWith('removed-slugs.json') ? '["x"]' : '{"a":1}');
    assert.equal(plan(dir, old), 'reseed');
    rmSync(dir, { recursive: true, force: true });
  });
}

test('RESEED_FORCE=1 força mesmo sem mudança', () => {
  const dir = makeRepo();
  const old = git(dir, 'rev-parse', 'HEAD');
  assert.equal(plan(dir, old, { RESEED_FORCE: '1' }), 'reseed');
  rmSync(dir, { recursive: true, force: true });
});

test('commit antigo desconhecido: reseed (na dúvida, a trava do DRY_RUN protege)', () => {
  const dir = makeRepo();
  assert.equal(plan(dir, '0000000000000000000000000000000000000000'), 'reseed');
  rmSync(dir, { recursive: true, force: true });
});

test('sem modo válido: erro de uso, nada é feito', () => {
  const dir = makeRepo();
  assert.throws(() =>
    execFileSync('bash', [path.join(dir, 'scripts/reseed-if-data-changed.sh'), 'qualquer'], {
      cwd: dir, stdio: 'pipe', env: { ...process.env, RESEED_PLAN_ONLY: '1' },
    }),
  );
  rmSync(dir, { recursive: true, force: true });
});
