# Runbook — Bíblia na Arte

> Procedimentos operacionais específicos deste projeto. Pra recuperação de
> desastre no VPS (clone, `.env`, containers, DNS, restore de backup),
> ver `hetzner-infra/RECUPERACAO.md` — não duplicado aqui.

## Pipeline de dados (curadoria → produção)

Esse fluxo é o que torna este projeto diferente de qualquer outro do
cluster: o catálogo inteiro nasce de notas do Obsidian, não de um painel
admin. Roda do **desktop do Rilson**, nunca em CI — o vault não existe no
servidor nem no repo.

```bash
# 1. Curadoria: editar/criar notas em "10 - Arte e literatura/Pinturas"
#    no vault Obsidian. Ver checklist em ROADMAP.md § "Qualidade de
#    Conteúdo" antes de publicar obra nova.

# 2. Export: lê o vault, converte imagem pra WebP (1600px, qualidade 82),
#    escreve web/public/images/ + server/scripts/vault-export.json
pnpm --filter server export:vault

# 3. Conferir localmente antes de mandar pra produção
pnpm --filter web dev   # olhar as obras novas/alteradas em localhost

# 4. Deploy do código (se mudou algo em web/ ou server/) via CI normal —
#    build das imagens Docker, push GHCR, deploy no VPS (make deploy
#    service=biblia-na-arte, hetzner-infra/README.md)

# 5. Seed dos dados no Postgres de produção — via SSH, container one-off
#    na proxy-network (não roda local contra prod). Espera o "Deploy VPS"
#    (dispara sozinho no push) terminar primeiro — reseed usa o código já
#    deployado (schema/queries.ts precisam bater com as colunas do seed).
ssh narniano@debian13-4gb-narniano
cd /opt/biblia-na-arte
docker run --rm --network proxy-network \
  --env-file server/.env \
  -e NODE_ENV=development -e CI=true \
  -v $(pwd):/app -w /app \
  node:22-alpine sh -c "corepack enable && pnpm install --frozen-lockfile --filter server && pnpm --filter server db:seed"
# NODE_ENV=development é necessário só pra tsx instalar certo — não afeta
# o app rodando (containers biblianaarte-api/web seguem com NODE_ENV real).
#
# NÃO adicionar de volta "--config.dangerously-allow-all-builds=true"
# (achado 2026-08-23, REVERTIDO 2026-09-03) — aquela flag resolvia
# ERR_PNPM_IGNORED_BUILDS especificamente no pnpm 11.x, versão que o
# comando pegava sem querer por não fixar nenhuma (corepack sempre baixava
# "latest"). Agora que `package.json` tem `packageManager: "pnpm@10.30.1"`
# fixando a versão de verdade, essa flag CONFLITA com o
# `onlyBuiltDependencies` do `pnpm-workspace.yaml`
# (ERR_PNPM_CONFIG_CONFLICT_BUILT_DEPENDENCIES: "Cannot have both
# neverBuiltDependencies and onlyBuiltDependencies") — o
# `onlyBuiltDependencies` já existente (esbuild/sharp/@swc/core) resolve
# sozinho com a versão fixada, sem precisar de flag nenhuma.
#
# ⚠️ Esse comando escreve DIRETO no checkout do VPS (`-v $(pwd):/app`
# monta o diretório de verdade, não uma cópia) — se der erro no meio do
# `pnpm install`, pode deixar `pnpm-workspace.yaml`/`node_modules`
# modificados localmente ali, o que trava o PRÓXIMO `git pull --ff-only`
# (do humano ou do "Deploy VPS" automático) até alguém rodar
# `git checkout -- pnpm-workspace.yaml` manualmente. Se o reseed falhar,
# conferir `git status` em `/opt/biblia-na-arte` antes de tentar de novo.

# 6. Sitemap (se mudou quantidade de páginas indexáveis)
pnpm --filter server sitemap:generate
```

### Gotchas já vividos (não repetir)

- **`git-lfs` precisa estar instalado ANTES do clone**, no desktop e no
  VPS. Sem isso, toda imagem vira um ponteiro de texto de ~130 bytes em
  vez do binário — quebra a exibição de **todas** as pinturas
  silenciosamente (incidente real, 16/08). `sudo apt install git-lfs`
  (ou `dnf` fora do Debian) antes de clonar.
- **`rsync -az --delete` do repo local pro VPS apaga `server/.env`** — o
  arquivo só existe no VPS, nunca no repo local, e `--delete` espelha o
  destino igual à origem. Sempre `--exclude='.env'` explícito nesse
  rsync. Os containers já rodando não caem na hora (Compose só lê
  `env_file` na criação, não em restart), mas o próximo `docker compose
  up` sem o `.env` recriado vai falhar.
- **Migration e `functions.sql`/`data-fixes.sql` RODAM SOZINHOS no boot**
  (`server.ts` → `runMigrations()`) — confirmado ao vivo 2026-08-23 (2
  migrations novas + `functions.sql` atualizado aplicaram sozinhos no
  restart do "Deploy VPS", sem passo manual). Achado antigo (0001,
  16/08) que dizia o contrário está desatualizado — foi corrigido depois
  daquele incidente, exatamente pra nunca mais precisar de passo manual
  aqui. O que **continua** manual: o **seed** (dado, não schema — rodar
  em todo boot re-inseriria/duplicaria, por isso é deliberadamente um
  passo à parte, ver item 5 acima).
- **Função SQL com lista de coluna escrita à mão esquece coluna nova
  fácil** (achado 2026-08-23): `search_artworks()` em `functions.sql` +
  o wrapper em `queries.ts` (`SELECT` explícito de `search_artworks(...)`)
  listam cada coluna por fora — ao adicionar campo no `schema.ts`,
  `GET /artworks/:id` pega sozinho (Drizzle `select()` sem lista pega
  tudo), mas `GET /artworks/search` fica pra trás em silêncio até
  alguém notar campo faltando. Checklist ao adicionar coluna: `schema.ts`
  → migration → `export-vault-data.ts`/`import-seed-data.ts` →
  `response.schema.ts` → **`functions.sql` + `queries.ts` (search)** →
  frontend `types/index.ts` + UI.
- **`git commit --amend` + `--force-with-lease` depois que o "Deploy
  VPS" já rodou trava o próximo deploy** (achado real 2026-09-08): CI
  falhou (CVE "high" achada só na hora), corrigido local com
  `--amend`, force-pushed — mas "Deploy VPS" já tinha rodado em
  paralelo no push anterior e tinha feito `git pull --ff-only` com
  sucesso no checkout de `/opt/biblia-na-arte`, deixando-o num commit
  que não existe mais no histórico reescrito. Próximo `git pull
  --ff-only` do "Deploy VPS" falha com "Not possible to fast-forward"
  — branches divergentes, não uma continuação linear. Site não caiu
  (containers seguem rodando o código antigo), só o deploy trava.
  Resolvido com `git fetch origin main && git reset --hard
  origin/main` no checkout (`/opt/biblia-na-arte` é só destino de
  deploy, sem trabalho local que valha preservar — confirmar `git
  status` antes mesmo assim), seguido de `gh run rerun` no job que
  falhou. Lição: depois de um `--amend`+force-push num commit que já
  foi pro `main`, sempre checar se o "Deploy VPS" daquele push
  específico já rodou (`gh run list`) antes de assumir que o próximo
  push vai resolver sozinho.

## Diagnóstico rápido — sintoma → causa provável

| Sintoma | Causa provável | Onde checar |
|---|---|---|
| Imagem quebrada (ícone de arquivo, não a pintura) | `git-lfs` não instalado no VPS, ou obra excluída da auditoria de copyright | `docker exec` no container, ver se o arquivo é ponteiro de texto (~130 bytes) ou binário real; conferir `AUDITORIA-COPYRIGHT.md` |
| `GET /api/v1/artworks` retorna `internal_error` | Coluna nova no schema sem migration correspondente gerada (`db:generate` esquecido) | Conferir `server/src/db/migrations/`; migration em si roda sozinha no boot, só falta ela existir |
| `GET /artworks/:id` mostra campo novo certo mas `GET /artworks/search` devolve `null` | `functions.sql`/`queries.ts` (search) não atualizados com a coluna nova | Ver achado 2026-08-23 acima — checklist de onde atualizar |
| Obra nova não aparece no site depois do export | Seed não rodou em produção, ou `autor` bate em `UNKNOWN_AUTHOR_VALUES` sem estar no `ALLOWED_UNKNOWN_AUTHOR_FILENAMES` | Rodar `export:vault` local e checar o log de `skipped` no console |
| Duas obras com a mesma imagem | Colisão de slug (mesmo artista+título, ano igual ou ausente) | Log `⚠️ Slug duplicado desambiguado` do `export:vault`; preencher `ano` na nota mais recente ajuda o dedupe |
| Busca não acha nada com filtro sem texto | Regressão específica já documentada — ver `Search.tsx` / achado 22/08 no ROADMAP | `ROADMAP.md` § "Buscar artista no /busca" |
| Site fora do ar mas `docker ps` mostra tudo `healthy` | Provavelmente não é este projeto — ver `hetzner-infra/RECUPERACAO.md` | Health checks: `/health`, `/health/live`, `/health/ready` |

## Onde cada coisa mora

- **Vault (fonte da curadoria)**: só no desktop do Rilson, `10 - Arte e
  literatura/Pinturas` + `0 - Anexos`. Nunca no repo, nunca no servidor.
- **`server/scripts/vault-export.json`**: saída derivada do vault,
  regenerada a cada `export:vault` — não editar à mão.
- **`web/public/images/`**: 100% derivado do vault (WebP), limpo e
  regenerado a cada export — não é fonte de verdade de nada.
- **Postgres de produção**: fonte de verdade do que está *publicado*, mas
  sempre reimportável do vault via seed — nunca editar dado direto no
  banco de produção pra corrigir conteúdo, corrigir na nota e reexportar.
