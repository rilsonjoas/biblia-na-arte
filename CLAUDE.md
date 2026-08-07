# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project Overview

BiblianaArte.com explora a conexão entre passagens bíblicas e obras de arte
(inicialmente só pinturas; música/cinema ficam pra depois). Curadoria manual
a partir de um vault Obsidian com ~1000 pinturas catalogadas.

> [!IMPORTANT] Status (2026-08-07)
> Repo reestruturado hoje em monorepo pnpm workspace (`web/` + `server/`).
> O Supabase original (banco + storage, set/2025) morreu por inatividade —
> projeto saiu do ar sem aviso. Migração em andamento pra self-host total
> no VPS Hetzner do Rilson (ver `hetzner-infra/MIGRATION.md`, Fase 4.3).
> **Não usar Supabase de novo** — decisão explícita do Rilson.

## Estrutura (monorepo pnpm workspace)

```
biblia-na-arte/
├── pnpm-workspace.yaml
├── web/          — frontend Vite + React (SPA)
├── server/       — API REST (Fastify + Drizzle + Zod)
└── docs/legacy-supabase/  — docs obsoletos da era Supabase, arquivados
```

### `web/` — Frontend

- React 18 + TypeScript, Vite + SWC, React Router, TanStack Query, Tailwind + shadcn/ui
- `src/lib/data.ts` — camada de acesso a dados, hoje ainda referencia
  Supabase (`src/lib/supabase-data.ts`) via fallback pattern; será trocado
  pra chamar a API nova do `server/` quando o backend estiver no ar
- Imagens em `web/src/assets/` (961 arquivos, ~467MB) versionadas via **Git
  LFS** — não commitar sem o `git-lfs` instalado, senão o push quebra ou
  perde conteúdo. `.gitattributes` na raiz declara o filtro
  (`web/src/assets/*`)
- Dev: `pnpm dev:web` (porta 8080) · Build: `pnpm build:web`

### `server/` — Backend (novo, 2026-08-07)

REST API só-leitura (v1), Fastify + Drizzle ORM + Zod, aponta pro
`biblia_na_arte_db` no Postgres compartilhado do VPS.

- `src/db/schema.ts` — schema Drizzle (tabelas `artworks`, `bible_books`,
  `bible_references`) — espelha o `supabase/schema.sql` original sem as
  partes de Supabase Auth (RLS/policies não fazem sentido aqui, o controle
  de acesso é feito na própria API)
- `src/db/custom-sql/functions.sql` — trigger de `updated_at` e a função
  `search_artworks()` (full-text search em português, `ts_rank`) — SQL puro
  não expressável no schema DSL do Drizzle, aplicado via `pnpm db:migrate`
  depois das migrations do drizzle-kit
- `src/routes/` — `artworks` (list/get/search), `bible-books`, `health`
- `src/schemas/` — validação Zod dos query params/params de rota
- `src/plugins/security.ts` — helmet, CORS restrito, rate limit
- Campos novos no schema que não existiam no Supabase: `license_type` e
  `attribution_text` em `artworks` — resultado direto da auditoria de
  direitos autorais de 2026-08-07 (ver nota no vault Obsidian)
- Dev: `pnpm dev:server` (porta 3000, hot reload via `tsx watch`)
- Build: `pnpm build:server` → `server/dist/`
- Migrations: `pnpm --filter server db:generate` (gera SQL a partir do
  schema) → `pnpm --filter server db:migrate` (aplica no Postgres)
- Deploy: `server/Dockerfile`, multi-stage com `pnpm deploy` (poda pra só
  as deps de produção), build a partir da **raiz** do monorepo:
  `docker build -f server/Dockerfile -t biblianarte-api .`

## Arquitetura de dados

- **Artwork**: título, artista/diretor, ano, categoria
  (pintura|música|filme), descrição, imagem, `license_type` +
  `attribution_text` (novo)
- **BibleReference**: liga uma obra a livro/capítulo/versículo(s) da Bíblia
- **BibleBook**: metadados de livro bíblico (slug, capítulos, testamento)

## Infra (VPS Hetzner, não Supabase)

Fonte da verdade: `~/Downloads/Programação/1 - Pessoal/hetzner-infra/MIGRATION.md`
(Fase 4.3). Resumo:

- Banco: Postgres compartilhado do VPS, banco lógico `biblia_na_arte_db` (já
  criado)
- API: container `biblianarte-api` na `proxy-network` do Traefik, subdomínio
  `api-biblianarte.narniano.com`
- Frontend: build estático do Vite, servido também via Traefik
- Imagens: estático via Traefik direto de `web/src/assets/` no VPS (não é
  upload de usuário, não precisa de S3/MinIO)

## O que falta pro ar (em ordem)

1. Rodar as migrations no Postgres real do VPS
2. Reescrever `server/scripts-legacy/migrate-data.ts` pra popular o banco a
   partir do vault Obsidian, aplicando as decisões da auditoria de direitos
   autorais (excluir os artistas 🔴 "não incluir", incluir Andrei Mironov
   com atribuição CC BY-SA)
3. Trocar `web/src/lib/data.ts` pra chamar a API nova em vez do Supabase
4. `docker-compose.yml` do serviço em `hetzner-infra/biblia-na-arte/`
   (seguir o padrão de `hetzner-infra/bancada/docker-compose.yml`)
5. Deploy + DNS + validação
