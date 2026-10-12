#!/usr/bin/env bash
# Atualiza o catálogo do site a partir do vault, em um comando (ADR 008).
#
#   scripts/publicar-catalogo.sh
#
# Roda NO SEU COMPUTADOR, dentro do clone do repositório. O que faz, em ordem:
#   1. confere o ambiente (git, gh, pnpm, git-lfs, vault) e a árvore limpa;
#   2. cria a branch dados/AAAA-MM-DD a partir de origin/main;
#   3. exporta o vault (vault-export.json + imagens WebP), preservando createdAt;
#   4. compara com o export anterior e fecha os redirecionamentos óbvios (mesmo título);
#   5. regenera o sitemap (sem as URLs aposentadas);
#   6. mostra o que mudou e PERGUNTA antes de commitar, dar push e abrir o PR.
#
# Não mescla nada e não toca no banco: quem mescla é você; depois do deploy, o ensaio do
# reseed aparece no log do job `deploy` e a gravação é o workflow "Reseed do catálogo".
#
# Variáveis: STRICT_AUTOR=1 aborta se alguma nota exportada tiver `autor:` torto.
#            ASSUME_YES=1 pula as perguntas (use só em teste).
#            BASE_REF troca a base da branch (padrão origin/main; só para testar o script).
set -euo pipefail

cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

ok()   { printf '  ✓ %s\n' "$1"; }
say()  { printf '%s\n' "$1"; }
die()  { printf '\n  ✗ %s\n\n' "$1" >&2; exit 1; }
ask()  { [[ "${ASSUME_YES:-0}" == "1" ]] && return 0; local r; read -r -p "  ? $1 [y/N] " r; [[ "$r" =~ ^[Yy] ]]; }

say "▶ 1/6 Conferindo o ambiente"
for c in git gh pnpm git-lfs; do command -v "$c" >/dev/null 2>&1 || die "Falta o comando '$c'."; done
gh auth status >/dev/null 2>&1 || die "O gh não está autenticado (gh auth login)."
VAULT="${VAULT_DIR:-/home/narniano/Documentos/Rilson}"
[[ -d "$VAULT/10 - Arte e literatura/Pinturas" ]] || die "Não achei o vault em '$VAULT' (use VAULT_DIR, e ajuste os caminhos no exportador se for outro)."
[[ -z "$(git status --porcelain)" ]] || die "A árvore tem mudanças não commitadas. Commite ou guarde antes (git stash)."
ok "ambiente e árvore limpa"

say "▶ 2/6 Criando a branch a partir de origin/main"
git fetch -q origin main
BRANCH="dados/$(date +%F)"
git show-ref --verify --quiet "refs/heads/$BRANCH" && BRANCH="$BRANCH-$(date +%H%M)"
git checkout -q -b "$BRANCH" "${BASE_REF:-origin/main}"
ok "branch $BRANCH"
pnpm install --frozen-lockfile >/dev/null 2>&1 || die "pnpm install falhou."

say "▶ 3/6 Exportando o vault (leva alguns minutos)"
cp server/scripts/vault-export.json "$TMP/export-anterior.json"
pnpm --filter server export:vault 2>&1 | tail -12

say "▶ 4/6 Comparando com o export anterior"
set +e
pnpm --filter server exec tsx scripts/catalog-diff.ts "$TMP/export-anterior.json" --write-suggestions | tee "$TMP/relatorio.txt"
DIFF_STATUS=${PIPESTATUS[0]}
set -e
if [[ "$DIFF_STATUS" -eq 2 ]]; then
  die "Há obras que sumiram sem explicação (lista acima). Resolva (removed-slugs.json, direitos: na nota, ou slug-redirects.json) e rode de novo. A branch $BRANCH ficou como está para você olhar; para descartar: git checkout -q main && git branch -D $BRANCH && git checkout -q -- . && git clean -fdq web/public/images"
elif [[ "$DIFF_STATUS" -ne 0 ]]; then
  die "O comparador falhou (código $DIFF_STATUS)."
fi

say "▶ 5/6 Regenerando o sitemap"
pnpm sitemap:generate 2>&1 | tail -1

say "▶ 6/6 Resumo"
git add -A
if git diff --cached --quiet; then
  say "  Nada mudou em relação a main. Não há o que publicar."
  git checkout -q main && git branch -D "$BRANCH" >/dev/null
  exit 0
fi
git diff --cached --stat | tail -6
NOVAS=$(grep -E '^  novas' "$TMP/relatorio.txt" | grep -oE '[0-9]+' | head -1 || echo 0)
ALTER=$(grep -E '^  alteradas' "$TMP/relatorio.txt" | grep -oE '[0-9]+' | head -1 || echo 0)
echo
ask "Commitar, dar push em $BRANCH e abrir o PR de dados?" || {
  say "  Parei antes de commitar. Está tudo preparado (git add feito) na branch $BRANCH."
  exit 0
}

git commit -q -m "chore(dados): atualiza o catálogo a partir do vault ($NOVAS novas, $ALTER alteradas)

Gerado por scripts/publicar-catalogo.sh.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -q -u origin "$BRANCH"
{
  echo "Atualização do catálogo a partir do vault, gerada por \`scripts/publicar-catalogo.sh\`."
  echo
  echo '```'
  cat "$TMP/relatorio.txt"
  echo '```'
  echo
  echo "**Antes de mesclar, leia:** os pares de endereço sugeridos (autoria corrigida também gera par), o relatório de \`autor:\` torto no log do export e se alguma obra nova deveria estar bloqueada por direitos."
  echo
  echo "**Depois de mesclar:** o log do job \`deploy\` mostra o ensaio do reseed; se estiver como esperado, rode Actions → \"Reseed do catálogo\" → digite GRAVAR (ADR 008)."
  echo
  echo "🤖 Generated with [Claude Code](https://claude.com/claude-code)"
} > "$TMP/pr-body.md"
URL=$(gh pr create --base main --head "$BRANCH" --title "chore(dados): atualiza o catálogo a partir do vault ($NOVAS novas, $ALTER alteradas)" --body-file "$TMP/pr-body.md")
ok "PR aberto: $URL"
git checkout -q main
