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

# 4. Deploy do código (se mudou algo em web/ ou server/): o push pro main
#    dispara o CI (testes + build) e o "Deploy VPS" (git pull + make deploy
#    service=biblia-na-arte, que builda as imagens no próprio VPS). Não há
#    mais push no GHCR (removido 2026-09-27, nunca foi usado).
#    ATENÇÃO até 01/10/2026: cota de LFS estourada, não commitar imagem
#    nova (ver "Cota de banda do Git LFS").

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

- **`rsync` direto pro checkout do VPS antes de commitar/pushar trava o
  próximo `git pull` do "Deploy VPS"** (achado real, 2026-09-19): pra
  rodar o seed (passo 5) sem esperar o deploy de código, copiei
  `vault-export.json` + `web/public/images/` direto pro
  `/opt/biblia-na-arte` via `rsync`, sem passar por git. O seed funcionou
  (lê arquivo local, não liga pra git), mas isso deixou o checkout do VPS
  com mudanças locais/arquivos não rastreados; quando o commit normal foi
  pushado depois, o "Deploy VPS" falhou em `git pull` ("your local
  changes would be overwritten"). Resolvido com `git checkout --
  <arquivos> && git clean -fd web/public/images/` no VPS (escopado só
  nesses dois caminhos, sem tocar `.env`/`.pnpm-store`) seguido de
  `gh run rerun --failed`. **Ordem certa, sempre**: `export:vault` local
  → commit → push (dispara CI + "Deploy VPS" sozinho, que já atualiza o
  checkout do VPS via `git pull`) → **depois** SSH pro VPS rodar o
  `docker run` do seed (passo 5). Nunca usar `rsync` pra "adiantar" o
  seed antes do push — o próprio passo 5 do runbook já supõe que o
  checkout está limpo e no commit certo quando ele roda.

### Cota de banda do Git LFS (incidente 2026-09-27)

- **O que aconteceu:** e-mail do GitHub, "You have used 100% of the Git
  LFS bandwidth", 10 GB de 10 GB no ciclo. A conta inteira fica sem LFS
  até o próximo ciclo. Texto da documentação do GitHub: *"Git LFS support
  is disabled on your account until the next month."*
- **Causa:** o `ci.yml` tinha `lfs: true` no checkout dos 3 jobs (`ci`,
  `docker-api`, `docker-web`). O repo tem 1.104 arquivos em LFS, ~228 MB,
  quase tudo em `web/public/images`. Cada job baixava tudo: **~680 MB por
  push**, e 10 GB acabam em ~15 pushes (setembro teve 83 execuções de
  CI). Download do Actions conta na cota. Documentação do GitHub: *"If
  GitHub Actions downloads a 500 MB file that is tracked with Git LFS, it
  will use 500 MB of the repository owner's bandwidth."*
- **Por que era desperdício puro:** nenhum dos 3 jobs usa as imagens.
  - Os testes geram os próprios arquivos (`image-processing.test.ts`).
  - O build do web só copia `web/public` para `dist`.
  - `server/Dockerfile` nem copia `web/`.
  - A imagem `ghcr.io/.../biblianaarte-web` que o `docker-web` publica
    **não é usada**: o VPS builda do próprio checkout em
    `/opt/biblia-na-arte` (`build: context:` no compose do
    `hetzner-infra`), então a imagem do GHCR não tem uso.
- **Correção:** `lfs: false` nos 3 checkouts e `GIT_LFS_SKIP_SMUDGE: '1'`
  no `env` do workflow. O gasto do CI com LFS vai a zero.
- **O que ainda gasta cota (pouco, e é necessário):** o `git pull` do
  "Deploy VPS" baixa só os objetos LFS **novos** de cada push, ou seja,
  as pinturas de um lote novo do export. Clones novos (desktop ou VPS)
  baixam tudo.
- **Enquanto a cota estiver estourada:** não commitar lote novo de
  imagens. O `git pull` do VPS precisaria baixar os objetos LFS novos e
  falharia (`filter.lfs.required=true` no checkout), travando o deploy.
  Commit sem imagem nova passa normalmente.
- **Regra daqui pra frente:** workflow novo começa com `lfs: false`.
  `lfs: true` só com justificativa escrita de qual passo lê o binário.
  Ver checklist em `hetzner-infra/PADRAO-DE-ENGENHARIA.md`.
- **Jobs `docker-api` e `docker-web` removidos (mesmo dia, decisão do
  Rilson):** publicavam no GHCR imagens que ninguém usava. Conferido antes
  de remover: o `deploy.yml` é independente do CI; `make deploy` é
  `compose up -d --build`; o compose do VPS não tem `image:` do GHCR; as
  imagens rodando são as buildadas localmente; o repo não tem tag `v*`; e
  nada no repo nem no `hetzner-infra` referencia essas imagens. O CI ficou
  com um job só e sem `packages: write`. As imagens antigas continuam no
  GHCR, sem uso, e podem ser apagadas.
- **Quando a cota volta:** *"Usage resets on the first of the next
  month"* (documentação do GitHub), ou seja, 01/10/2026. Até lá, não
  clonar o repo de novo (desktop ou VPS), porque as imagens chegariam como
  ponteiros de texto.

### Threads: "Media Not Found" ao publicar (2026-09-18 e 2026-09-27)

- **Sintoma:** "Publicar Pintura do Dia" vermelho com `threads_publish
  falhou (400)`, `error_subcode 4279009`, "The media with id … cannot be
  found". O Instagram publica normalmente na mesma execução.
- **Causa:** o container do Threads respondeu `FINISHED` e o publish, 0,1s
  depois, não achou a mídia. Documentação da Meta
  (developers.facebook.com/docs/threads/posts): *"It is recommended to
  wait on average 30 seconds before publishing a Threads media container
  to give our server enough time to fully process the upload."* A Meta
  marca o erro como `is_transient: false`, então o retry não entrava.
- **Correção (2026-09-27):** espera mínima de 30s entre criar o container e
  publicar, e o subcode 4279009 passou a ser retentado (5 tentativas de 5s).
  O Threads roda em paralelo ao Instagram, então o post do Instagram não
  atrasa. **Em 2026-09-27 essa lógica foi extraída para
  `scripts/graph-api.mjs`** e coberta por 21 testes — a decisão
  "transitório ou permanente?" é o que mais já errou aqui, e era a única
  parte sem teste. Se for mexer em retry, o lugar é `graph-api.mjs`
  (`isGraphErrorTransient`), não o `post-daily-social.mjs`.
- **Repor o post do dia só no Threads:** `gh workflow run
  post-daily-social.yml -f platforms=threads`. Foi feito em 27/09.

## Testes dos scripts de publicação

`scripts/` **não é pacote do pnpm workspace** (o `pnpm-workspace.yaml`
lista só `web` e `server/`), então `pnpm -r test` nunca cobriu esse
diretório. Desde 2026-09-27 a raiz tem `test:scripts`
(`node --test "scripts/*.test.mjs"`) e o `pnpm test` da raiz já chama —
antes disso, o único caminho do projeto que publica em conta de produção
rodava sem nenhum teste no CI.

| arquivo | estado |
|---|---|
| `social-caption.mjs` | coberto (montagem de legenda) |
| `graph-api.mjs` | coberto (retry, poll de container, `PLATFORMS`) |
| `post-daily-social.mjs` | orquestrador, sem teste próprio — o risco está nos módulos |
| `renew-ig-token.mjs` | **sem teste** |
| `renew-threads-token.mjs` | **sem teste** |

Rodar só os de script, que é bem mais rápido que a suíte toda:
`pnpm test:scripts`.

**Não usar `node --check` no `lint-staged` para isso.** Com vários
arquivos ele retorna 0 mesmo quando um deles está quebrado — só verifica
o primeiro. A decisão e o porquê estão no registro de 2026-09-27.

## Diagnóstico rápido — sintoma → causa provável

| Sintoma | Causa provável | Onde checar |
|---|---|---|
| Imagem quebrada (ícone de arquivo, não a pintura) | `git-lfs` não instalado no VPS, ou obra excluída da auditoria de copyright | `docker exec` no container, ver se o arquivo é ponteiro de texto (~130 bytes) ou binário real; conferir `AUDITORIA-COPYRIGHT.md` |
| `GET /api/v1/artworks` retorna `internal_error` | Coluna nova no schema sem migration correspondente gerada (`db:generate` esquecido) | Conferir `server/src/db/migrations/`; migration em si roda sozinha no boot, só falta ela existir |
| `GET /artworks/:id` mostra campo novo certo mas `GET /artworks/search` devolve `null` | `functions.sql`/`queries.ts` (search) não atualizados com a coluna nova | Ver achado 2026-08-23 acima — checklist de onde atualizar |
| Obra nova não aparece no site depois do export | Seed não rodou em produção, ou `autor` bate em `UNKNOWN_AUTHOR_VALUES` sem estar no `ALLOWED_UNKNOWN_AUTHOR_FILENAMES` | Rodar `export:vault` local e checar o log de `skipped` no console |
| Duas obras com a mesma imagem | Colisão de slug (mesmo artista+título, ano igual ou ausente) | Log `⚠️ Slug duplicado desambiguado` do `export:vault`; preencher `ano` na nota mais recente ajuda o dedupe |
| Busca não acha nada com filtro sem texto | Regressão específica já documentada — ver `Search.tsx` / achado 22/08 no ROADMAP | `ROADMAP.md` § "Buscar artista no /busca" |
| CI falha no checkout, ou "Deploy VPS" falha no `git pull` com erro de LFS / "bandwidth" | Cota de banda do Git LFS estourada (LFS desligado na conta até o próximo ciclo) | GitHub → Settings → Billing → Git LFS; ver "Cota de banda do Git LFS" acima |
| "Publicar Pintura do Dia" vermelho só no Threads, subcode 4279009 | Publicou antes do container terminar de processar | Ver "Threads: Media Not Found" acima; repor com `-f platforms=threads` |
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
