#!/usr/bin/env bash
# Reseed do catálogo em dois tempos (ADR 008). Roda NO VPS, em /opt/biblia-na-arte.
#
#   scripts/reseed-if-data-changed.sh dry <commit-antes-do-pull>
#       Chamado pelo job `deploy` do ci.yml. Se os arquivos de DADOS mudaram
#       (vault-export.json, slug-redirects.json, removed-slugs.json), roda o ENSAIO
#       (DRY_RUN=1) e imprime o relatório. NÃO grava nada. Se o ensaio abortar (a
#       trava: obra ativa sumindo sem explicação), sai com erro e o job fica vermelho.
#
#   scripts/reseed-if-data-changed.sh apply
#       Chamado pelo workflow manual "Reseed do catálogo" (botão no GitHub). Refaz o
#       ensaio e, só se ele passar, grava (uma transação: ou grava tudo ou nada).
#
# Por que dois tempos: o ensaio acontece sozinho a cada deploy de dados e o relatório
# fica no log do Actions; a gravação exige um clique humano depois de ler o relatório.
#
# RESEED_FORCE=1 faz o modo `dry` agir mesmo sem mudança nos dados.
# RESEED_PLAN_ONLY=1 faz o modo `dry` só imprimir "reseed" ou "skip" (usado nos testes).
set -euo pipefail

MODE="${1:-}"
case "$MODE" in
  dry) OLD="${2:?uso: $0 dry <commit-antes-do-pull>}" ;;
  apply) OLD="" ;;
  *) echo "uso: $0 dry <commit-antes-do-pull> | $0 apply" >&2; exit 2 ;;
esac
cd "$(dirname "$0")/.."

DATA_FILES=(server/scripts/vault-export.json server/scripts/slug-redirects.json server/scripts/removed-slugs.json)

decide() {
  [[ "${RESEED_FORCE:-0}" == "1" ]] && { echo reseed; return; }
  # Commit antigo desconhecido (clone novo, histórico reescrito): na dúvida, ensaia;
  # o ensaio não grava nada.
  git cat-file -e "${OLD}^{commit}" 2>/dev/null || { echo reseed; return; }
  if git diff --quiet "$OLD" HEAD -- "${DATA_FILES[@]}"; then echo skip; else echo reseed; fi
}

if [[ "$MODE" == "dry" ]]; then
  PLAN=$(decide)
  if [[ "${RESEED_PLAN_ONLY:-0}" == "1" ]]; then echo "$PLAN"; exit 0; fi
  if [[ "$PLAN" == "skip" ]]; then echo "↷ Dados do catálogo não mudaram; nada a ensaiar."; exit 0; fi
fi

wait_api() {
  for _ in $(seq 1 36); do
    [[ "$(docker inspect -f '{{.State.Health.Status}}' biblianaarte-api 2>/dev/null || true)" == "healthy" ]] && return 0
    sleep 5
  done
  echo "❌ API não ficou saudável em 3 minutos; nada foi executado." >&2
  return 1
}

run_seed() { # $1 = valor de DRY_RUN
  docker run --rm --network proxy-network --env-file server/.env \
    -e NODE_ENV=development -e CI=true -e "DRY_RUN=$1" \
    -v "$(pwd)":/app -w /app node:22-alpine \
    sh -c "corepack enable && pnpm install --frozen-lockfile --filter server >/dev/null 2>&1 && pnpm --filter server db:seed"
}

# Imprime a saída sem o ruído dos NOTICE do Postgres (linhas de objeto JSON).
show() { grep -v "^[{} ]" || true; }

if [[ "$MODE" == "apply" ]]; then
  # Só grava com o código do main já implantado: o seed usa schema/queries do checkout.
  git fetch -q origin main
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
    echo "❌ O checkout do VPS não está em origin/main; aguarde o deploy terminar. Nada foi gravado." >&2
    exit 1
  fi
fi

wait_api

echo "▶ Ensaio (DRY_RUN=1): nada é gravado."
if ! OUT=$(run_seed 1 2>&1); then
  echo "$OUT" | tail -30
  echo "❌ Ensaio falhou ou a trava abortou; banco intocado."
  exit 1
fi
echo "$OUT" | show | tail -12

if [[ "$MODE" == "dry" ]]; then
  echo "✅ Ensaio passou. O banco NÃO foi alterado."
  echo "   Para gravar: GitHub → Actions → \"Reseed do catálogo\" → Run workflow."
  exit 0
fi

echo "▶ Reseed de verdade."
if ! OUT=$(run_seed 0 2>&1); then
  echo "$OUT" | tail -30
  echo "❌ Reseed falhou (a transação desfez tudo)."
  exit 1
fi
echo "$OUT" | show | tail -12
echo "✅ Reseed concluído."
