# Build a partir da RAIZ do monorepo (precisa do pnpm-workspace.yaml +
# lockfile compartilhado):
#   docker build -f web/Dockerfile -t biblianaarte-web \
#     --build-arg VITE_API_URL=https://api-biblianaarte.narniano.com .
#
# VITE_API_URL vira parte do bundle JS no momento do build (Vite não lê
# env var em runtime) — por isso é build-arg, não variável de ambiente do
# container final.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY web ./web
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runtime
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/web/dist /usr/share/nginx/html
EXPOSE 80
