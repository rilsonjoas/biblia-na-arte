# Build a partir da RAIZ do monorepo (precisa do pnpm-workspace.yaml +
# lockfile compartilhado):
#   docker build -f web/Dockerfile -t biblianaarte-web \
#     --build-arg VITE_API_URL=https://api-biblianaarte.narniano.com \
#     --build-arg VITE_UMAMI_SRC=https://umami.narniano.com/script.js \
#     --build-arg VITE_UMAMI_WEBSITE_ID=f3dae9ba-ad89-4ffe-bc9e-405a59d6c637 .
#
# VITE_* viram parte do bundle JS no momento do build (Vite não lê
# env var em runtime) — por isso são build-args, não variáveis de ambiente do
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
ARG VITE_UMAMI_SRC
ARG VITE_UMAMI_WEBSITE_ID
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_UMAMI_SRC=${VITE_UMAMI_SRC}
ENV VITE_UMAMI_WEBSITE_ID=${VITE_UMAMI_WEBSITE_ID}
COPY web ./web
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runtime
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/web/dist /usr/share/nginx/html
EXPOSE 80
