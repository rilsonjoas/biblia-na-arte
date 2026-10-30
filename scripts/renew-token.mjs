#!/usr/bin/env node
/**
 * Renova o token do Threads ou do Instagram e grava no secret do GitHub, sem o token passar pelo chat.
 *
 * Uso (no SEU terminal):
 *   node scripts/renew-token.mjs threads [--dry-run]
 *   node scripts/renew-token.mjs instagram [--dry-run]
 *
 * O que ele pede: o token atual (ou o que você gerou no painel do app da Meta), digitado sem eco.
 *   1. confirma de quem é o token (/me);
 *   2. tenta o refresh (só precisa do token; funciona em token long-lived ainda válido);
 *   3. se o refresh recusar (token curto, por exemplo), pede o app secret (sem eco) e troca por um long-lived;
 *   4. mostra em quantos dias vence e grava THREADS_ACCESS_TOKEN / INSTAGRAM_ACCESS_TOKEN.
 * `--dry-run` faz tudo, menos gravar o secret. Nada do token é impresso. Regras puras: token-renewal.mjs.
 */
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { PLATAFORMAS, urlMe, urlRenovar, urlTrocar, lerRenovacao } from './token-renewal.mjs';

const REPO = 'rilsonjoas/biblia-na-arte';
const nome = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!PLATAFORMAS[nome]) {
  console.error('Uso: node scripts/renew-token.mjs <threads|instagram> [--dry-run]');
  process.exit(2);
}
const { secret } = PLATAFORMAS[nome];

/** Lê uma linha sem ecoar o que é digitado: modo raw no terminal; com stdin redirecionado não há eco algum. */
let rlPipe = null;
function perguntarSemEco(pergunta) {
  stdout.write(pergunta);
  if (!stdin.isTTY) {
    rlPipe ??= createInterface({ input: stdin }); // sem `output`: nada é ecoado
    return new Promise((resolve) => rlPipe.once('line', (l) => { stdout.write('\n'); resolve(l.trim()); }));
  }
  return new Promise((resolve) => {
    let texto = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const fim = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', aoReceber);
      stdout.write('\n');
    };
    const aoReceber = (trecho) => {
      for (const c of trecho) {
        if (c === '\r' || c === '\n') { fim(); return resolve(texto.trim()); }
        if (c === '\u0003') { fim(); process.exit(130); } // Ctrl+C
        if (c === '\u007f' || c === '\b') texto = texto.slice(0, -1);
        else if (c >= ' ') texto += c;
      }
    };
    stdin.on('data', aoReceber);
  });
}

async function json(url) {
  const r = await fetch(url);
  return r.json();
}

async function main() {
  console.log(`══ Renovação do token de ${nome} ${dryRun ? '(--dry-run: não grava)' : ''} ══`);
  const atual = await perguntarSemEco('Cole o token (não aparece na tela): ');
  if (!atual) { console.error('vazio'); process.exit(1); }

  console.log('1/3 Conferindo de quem é o token...');
  const me = await json(urlMe(nome, encodeURIComponent(atual)));
  if (me.error) { console.error(`✗ Token recusado: erro ${me.error.code}: ${me.error.message}`); process.exit(1); }
  console.log(`   ✓ @${me.username} (${me.id})`);

  console.log('2/3 Renovando (refresh)...');
  let r = lerRenovacao(await json(urlRenovar(nome, atual)));
  if (!r.ok) {
    console.log(`   ✗ O refresh não aceitou o token (${r.motivo}).`);
    console.log('   Isso acontece com token curto (do painel) ou com menos de 24 h de vida. Vou tentar trocar por um long-lived.');
    const appSecret = await perguntarSemEco(`   Cole o App Secret do app de ${nome} (não aparece na tela): `);
    if (!appSecret) { console.error('vazio'); process.exit(1); }
    r = lerRenovacao(await json(urlTrocar(nome, atual, appSecret)));
    if (!r.ok) { console.error(`✗ A troca também falhou: ${r.motivo}`); process.exit(1); }
  }
  console.log(`   ✓ Token novo; vence em ~${r.dias} dias.`);

  console.log('3/3 Gravando o secret no GitHub...');
  if (dryRun) {
    console.log(`   (dry-run) ${secret} NÃO foi alterado.`);
    return;
  }
  execFileSync('gh', ['secret', 'set', secret, '--repo', REPO], { input: `${r.token}\n`, stdio: ['pipe', 'ignore', 'inherit'] });
  console.log(`   ✓ ${secret} atualizado. Anote: renovar de novo em ~${Math.max(r.dias - 7, 1)} dias.`);
}

main().catch((e) => { console.error('Falhou:', e.message); process.exit(1); });
