#!/usr/bin/env node
/**
 * Renova o token do Threads — análogo exato ao renew-ig-token.mjs:
 * token entra pelo SEU terminal (sem eco), nunca passa pelo chat
 * (por isso tuas pastas no chat sempre davam "Failed to decode" —
 * o chat truncava a string). Usa o THREADS_APP_SECRET já rotacionado
 * do arquivo local 600.
 *
 * Uso:
 *   node scripts/renew-threads-token.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const SECRETS_FILE = '/tmp/opencode/.stats-secrets';
const rl = createInterface({ input: stdin, output: stdout });

function secretByName(name) {
  const line = readFileSync(SECRETS_FILE, 'utf8').split('\n').find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} não está em ${SECRETS_FILE}`);
  return line.slice(name.length + 1);
}

async function main() {
  const appSecret = secretByName('THREADS_APP_SECRET_PASTED');

  console.log('══ Threads token renewal (token NÃO passa pelo chat) ══');
  const shortToken = (await rl.question('Cole o short-lived token do Threads (sem eco): ')).trim();
  if (!shortToken) { console.error('vazio'); process.exit(1); }
  rl.close();

  console.log('1/3 Validando...');
  const me = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(shortToken)}`,
  );
  const meBody = await me.json();
  if (meBody.error) { console.error(`✗ Token inválido: ${JSON.stringify(meBody.error)}`); process.exit(1); }
  console.log(`   ✓ Autenticado como @${meBody.username} (${meBody.id})`);

  console.log('2/3 Trocando short → long-lived...');
  const ex = await fetch(
    `https://graph.threads.net/access_token?grant_type=ig_exchange_code&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortToken)}`,
  );
  const exBody = await ex.json();
  if (exBody.error) { console.error(`✗ Exchange falhou: ${JSON.stringify(exBody.error)}`); process.exit(1); }
  const longToken = exBody.access_token;
  console.log(`   ✓ Long-lived OK (expira em ~${Math.round((exBody.expires_in ?? 0) / 86400)} dias)`);

  console.log('3/3 Gravando secret no GitHub...');
  execSync('gh secret set THREADS_ACCESS_TOKEN', { input: `${longToken}\n`, stdio: ['pipe', 'ignore', 'inherit'] });
  console.log('   ✓ THREADS_ACCESS_TOKEN atualizado.');
}

main().catch((e) => { console.error(e); process.exit(1); });
