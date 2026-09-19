#!/usr/bin/env node
/**
 * Renova o token do Instagram SEM o token passar pelo chat — que é a
 * única causa dos "Failed to decode" repetidos (a colagem corta a
 * string no meio do caminho). Rodando no SEU terminal, o token vai
 * direto do seu clipboard pro arquivo local (600) e depois pro GitHub
 * secret — o chat nunca vê o valor completo.
 *
 * Uso:
 *   node scripts/renew-ig-token.mjs /tmp/opencode/.stats-secrets
 *
 * Os novos *app secrets* (rotacionados) já estão nesse arquivo local
 * 600. O script:
 *   1. pede o token short-lived (digite/cole, sem eco)
 *   2. valida com a API do IG (/me)
 *   3. troca short-lived -> long-lived (60 dias) via app secret
 *   4. grava no secret INSTAGRAM_ACCESS_TOKEN do GitHub
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const appSecret = process.argv[2] ? readFileSync(process.argv[2], 'utf8') : null;

// em vez de depender de argv, lê do arquivo de segredos por nome de chave
function readSecretByName(file, name) {
  const line = readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${name}=`));
  if (!line) throw new Error(`${name} não encontrado em ${file}`);
  return line.slice(name.length + 1);
}

const rl = createInterface({ input: stdin, output: stdout });

async function main() {
  const file = process.argv[2] ?? '/tmp/opencode/.stats-secrets';
  const secret = readSecretByName(file, 'IG_APP_SECRET_PASTED');

  console.log('══ IG token renewal (ao vivo, sem passar pelo chat) ══');
  const shortToken = (await rl.question('Cole o short-lived token do Graph Explorer (sem eco): ')).trim();
  if (!shortToken) { console.error('vazio'); process.exit(1); }
  rl.close();

  console.log('1/3 Validando ...');
  const me = await fetch(
    `https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${encodeURIComponent(shortToken)}`,
  );
  const meBody = await me.json();
  if (meBody.error) {
    console.error(`✗ Token inválido: ${JSON.stringify(meBody.error)}`);
    process.exit(1);
  }
  console.log(`   ✓ Autenticado como @${meBody.username} (${meBody.id})`);

  console.log('2/3 Trocando short → long-lived...');
  const ex = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_code&client_secret=${encodeURIComponent(secret)}&access_token=${encodeURIComponent(shortToken)}`,
  );
  const exBody = await ex.json();
  if (exBody.error) { console.error(`✗ Exchange falhou: ${JSON.stringify(exBody.error)}`); process.exit(1); }
  const longToken = exBody.access_token;
  console.log(`   ✓ Long-lived OK (expira em ~${Math.round((exBody.expires_in ?? 0) / 86400)} dias)`);

  console.log('3/3 Gravando secret no GitHub...');
  execSync('gh secret set INSTAGRAM_ACCESS_TOKEN', { input: `${longToken}\n`, stdio: ['pipe', 'ignore', 'inherit'] });
  console.log('   ✓ INSTAGRAM_ACCESS_TOKEN atualizado. Próximo job deve publicar.');
}

main().catch((e) => { console.error(e); process.exit(1); });
