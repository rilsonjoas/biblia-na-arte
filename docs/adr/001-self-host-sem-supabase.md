# 001 — Self-host em VPS, sem Supabase

**Data:** 2026-08-07 (formalizado aqui em 2026-08-22)

## Contexto
O projeto nasceu no Supabase. O banco e o storage morreram por
inatividade em set/2025 (plano free, sem uso por tempo demais) — perda
total do backend enquanto o frontend seguia estático.

## Decisão
Migrar pra monorepo pnpm (`web/` + `server/`) self-hosted no VPS Hetzner
que já hospeda os outros projetos do cluster A Biblioteca (Lecionário,
Scriptorium, Gerador). API própria em Fastify + Drizzle + Zod, Postgres
próprio, nada de plataforma terceira gerenciando dado ou storage.
**Decisão explícita: não usar Supabase de novo**, registrada no README.

## Consequências
- Positivo: sem risco de perda por inatividade de plano free; mesmo
  padrão de engenharia dos outros projetos (CI, backup, observabilidade,
  documentado em `hetzner-infra/PADRAO-DE-ENGENHARIA.md`) — reuso de
  infra já validada, não reinventar por projeto.
- Custo: manutenção de infra é responsabilidade própria (backup, restore,
  monitoramento) — mitigado por já ser o padrão comum do cluster, não um
  fardo extra só deste projeto.
- Legado: pasta `server/db-legacy-supabase-reference/` mantida só como
  referência histórica do schema antigo, fora do fluxo real.
