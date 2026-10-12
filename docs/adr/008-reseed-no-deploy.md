# ADR 008 — Reseed do catálogo em dois tempos (ensaio no deploy, gravação por clique)

## Contexto
Até 2026-10-12, atualizar o catálogo era: exportar o vault, commitar, abrir PR, mesclar,
esperar o deploy e **entrar por SSH no VPS para rodar o reseed à mão** (RUNBOOK passo 5).
O passo manual existia por medo de um reseed apagar obra do site sem ninguém ver. O custo
real foi um catálogo 17 dias sem publicar 211 correções do vault, e uma sessão inteira para
recuperar o atraso. Desde o ADR 007 o reseed tem trava (obra ativa que sumiria sem
explicação aborta), `DRY_RUN=1` (relatório sem gravar) e roda numa transação.

## Decisão
Dois tempos, com um humano entre eles:

1. **Ensaio automático.** O job `deploy` do `ci.yml` chama, depois do `make deploy`,
   `scripts/reseed-if-data-changed.sh dry <commit-antes-do-pull>`. Se `vault-export.json`,
   `slug-redirects.json` ou `removed-slugs.json` mudaram, espera a API ficar saudável e roda o
   reseed com `DRY_RUN=1`: imprime o relatório (obras novas, removidas, redirecionamentos) no
   log do job e **não grava nada**. Se a trava abortar, o job fica vermelho. Mudança só de
   código não dispara nada.
2. **Gravação por clique.** O workflow `reseed.yml` ("Reseed do catálogo"), disparado à mão
   (Actions → Run workflow → digitar `GRAVAR`), roda `... apply`: confere que o VPS está em
   `origin/main`, refaz o ensaio e só se ele passar grava, numa transação. Usa a mesma fila de
   concorrência do deploy, então nunca roda no meio de um deploy.

`RESEED_FORCE=1` faz o ensaio agir sem mudança nos dados. O comando do RUNBOOK passo 5
continua válido para reparos fora do fluxo.

## Fluxo de quem atualiza o catálogo
1. Rodar `scripts/publicar-catalogo.sh`: exporta o vault, compara com o export anterior,
   fecha os redirecionamentos de mesmo título e abre o PR de dados (o relatório de autor torto
   e as marcas `direitos:`/`publicar:`/`slug:` das notas já entram aqui).
2. Ler o PR e mesclar.
3. Esperar o deploy e ler o relatório do ensaio no log do job `deploy`.
4. Se o relatório estiver como esperado, rodar "Reseed do catálogo". Se não, corrigir por PR
   (`slug-redirects.json`, `removed-slugs.json`, `direitos:` na nota); o banco não foi tocado.

## Consequências
- Sem SSH nem comando decorado: o passo manual vira um clique, depois de ler o relatório.
- Entre o passo 3 e o 4 o site mostra o catálogo antigo com código novo. Isso já era assim
  antes; não há regressão. Esquecer o passo 4 deixa o catálogo defasado (sem dano).
- Uma obra que sai do vault de propósito precisa de `removed-slugs.json` (ou `direitos:` na
  nota); uma que muda de slug precisa de `slug-redirects.json`. Sem isso o ensaio aborta em
  vez de a obra sumir calada.
- Não coberto: dado errado que só "atualiza" (ex.: descrição ruim) passa na trava. Essa
  defesa é a leitura do PR de dados.
- Alternativa descartada: reseed 100% automático no deploy. Tira o último humano do caminho;
  reavaliar se o relatório do ensaio nunca surpreender ao longo de algumas semanas.
