#!/bin/bash
# Dispara o workflow "Publicar Pintura do Dia" via GitHub API
# (workflow_dispatch) em vez de depender do `schedule:` do próprio
# GitHub Actions.
#
# Achado real (2026-09-07): o agendador `schedule:` do Actions é
# best-effort, sem SLA — confirmado no histórico real de execuções:
# atrasos de 2h30-3h consistentes (às vezes crescentes dia a dia) e um
# dia em que simplesmente não rodou nenhuma vez, sem erro nem rastro
# (04/09). É um limite documentado da própria GitHub, mais comum em
# repositórios de baixo tráfego — não tem fix do lado do cron em si (já
# foi tentado mudar o minuto uma vez, ver histórico do workflow).
#
# Este script roda como cron NESTA VPS (não no VPS que hospeda o app —
# é só um "aperta o botão" na hora certa) e dispara o mesmo workflow via
# API, que executa via workflow_dispatch quase imediatamente, sem fila.
# A publicação em si continua 100% no GitHub Actions, como sempre foi
# de propósito (ver comentário no .yml) — isto não roda nada do post em
# si, só o gatilho.
#
# Token: fine-grained PAT, escopado só a rilsonjoas/biblia-na-arte,
# permissão Actions: Read and write. Fica em
# /opt/biblia-na-arte/.github-dispatch-token (gitignored, chmod 600,
# nunca commitado).
set -euo pipefail

TOKEN_FILE="/opt/biblia-na-arte/.github-dispatch-token"
STATUS_FILE="/opt/biblia-na-arte/logs/trigger-daily-post-status.log"
mkdir -p "$(dirname "$STATUS_FILE")"

if [ ! -f "$TOKEN_FILE" ]; then
  echo "$(date -Iseconds) ERRO: token não encontrado em $TOKEN_FILE" > "$STATUS_FILE"
  exit 1
fi

# `>` (não `>>`) de propósito — só o resultado da última tentativa
# importa pra debugar; o histórico de verdade de cada dia já vive no
# próprio GitHub Actions (run history), não precisa duplicar aqui. Sem
# isso um log crescendo pra sempre é exatamente o tipo de coisa que já
# causou problema antes neste projeto.
HTTP_CODE=$(curl -sS -o /dev/null -w '%{http_code}' \
  -X POST \
  -H "Authorization: Bearer $(cat "$TOKEN_FILE")" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/rilsonjoas/biblia-na-arte/actions/workflows/post-daily-social.yml/dispatches" \
  -d '{"ref":"main"}')

if [ "$HTTP_CODE" = "204" ]; then
  echo "$(date -Iseconds) OK: workflow disparado (HTTP 204)" > "$STATUS_FILE"
else
  echo "$(date -Iseconds) ERRO: GitHub API retornou HTTP $HTTP_CODE (esperado 204)" > "$STATUS_FILE"
  exit 1
fi
