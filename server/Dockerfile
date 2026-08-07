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
USER app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
