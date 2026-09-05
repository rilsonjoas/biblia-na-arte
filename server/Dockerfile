# Build a partir da RAIZ do monorepo:
#   docker build -f server/Dockerfile -t biblianaarte-api .
#
# Multi-stage + `pnpm deploy` pra podar devDependencies e pacotes de outros
# workspaces (web/) — a imagem final não carrega nada do frontend nem do
# toolchain de build, só o runtime compilado + deps de produção.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY server ./server
RUN pnpm --filter server build

FROM build AS pruned
# --legacy: server/ e web/ não têm dependência workspace: entre si (não
# precisam de packages "injetados"), mas o pnpm 10.3x passou a exigir
# opt-in explícito pra pular esse comportamento por padrão.
RUN pnpm --filter server deploy --prod --legacy /prod/server

FROM node:22-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=pruned --chown=app:app /prod/server ./
# Migrations e SQL idempotente rodam no boot (server.ts → runMigrations)
# e precisam existir ao lado do dist/db/migrate.js compilado — tsc não
# copia .sql sozinho.
COPY --from=build --chown=app:app /repo/server/src/db/migrations ./dist/db/migrations
COPY --from=build --chown=app:app /repo/server/src/db/custom-sql ./dist/db/custom-sql
# Tabela de leituras do Lecionário (Pintura do Dia ligada à leitura
# litúrgica, ROADMAP 2026-09-02) — mesma razão do .sql acima: import
# JSON com `resolveJsonModule` funciona no `tsc --noEmit`/typecheck, mas
# não é o `tsc build` real que garante a cópia pro dist; explícito aqui
# evita depender desse detalhe de versão do tsc.
COPY --from=build --chown=app:app /repo/server/src/data ./dist/data
# Submissão de artistas (roadmap, 2026-09-05): pré-cria as pastas de
# upload já com dono correto. Sem isso, o volume Docker nomeado
# montado em /app/uploads nasce vazio e dono de root na primeira vez
# — o processo (USER app, não-root) recebe EACCES ao tentar criar
# subpastas nele. Docker semeia um volume novo com o conteúdo/dono
# que já existir no caminho de destino da imagem, então criar aqui
# resolve de vez (achado real: aconteceu no primeiro deploy da feature
# em produção, 2026-09-05).
RUN mkdir -p ./uploads/pending-submissions ./uploads/approved-submissions \
    && chown -R app:app ./uploads
USER app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
