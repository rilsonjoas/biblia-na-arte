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
#    na proxy-network (não roda local contra prod):
ssh narniano@debian13-4gb-narniano
cd /opt/biblia-na-arte
docker run --rm --network proxy-network \
  --env-file server/.env \
  -e NODE_ENV=development \
  -v $(pwd):/app -w /app \
  node:22-alpine sh -c "corepack enable && pnpm install && pnpm --filter server db:seed"
# NODE_ENV=development é necessário só pra tsx instalar certo — não afeta
# o app rodando (containers biblianaarte-api/web seguem com NODE_ENV real)

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
- **Migration nova não roda sozinha em produção** — `pnpm
  --filter server db:migrate` precisa ser disparado manualmente contra o
  VPS depois de qualquer PR que adicione uma migration (mesmo padrão do
  container one-off acima, trocando o comando final). Sintoma de
  migration esquecida: API responde `internal_error` na listagem de
  obras, coluna nova não existe na tabela real.

## Diagnóstico rápido — sintoma → causa provável

| Sintoma | Causa provável | Onde checar |
|---|---|---|
| Imagem quebrada (ícone de arquivo, não a pintura) | `git-lfs` não instalado no VPS, ou obra excluída da auditoria de copyright | `docker exec` no container, ver se o arquivo é ponteiro de texto (~130 bytes) ou binário real; conferir `AUDITORIA-COPYRIGHT.md` |
| `GET /api/v1/artworks` retorna `internal_error` | Migration não aplicada em produção | `db:migrate` manual (ver acima) |
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
