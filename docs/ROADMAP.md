# Roadmap de Produção — Bíblia na Arte

> **Status atual: Fase 0 em andamento** (2026-08-07)
>
> Este documento é a fonte da verdade do caminho até produção confiável.
> O `CLAUDE.md` e a nota `Bíblia na Arte.md` no vault Obsidian apontam pra cá.
> Toda fase concluída deve marcar os itens e atualizar o `## Status` aqui.
>
> As fases 0/4 abaixo já cobrem, na prática, o mesmo padrão comum
> documentado em `hetzner-infra/PADRAO-DE-ENGENHARIA.md` (CI, testes,
> OpenAPI, Sentry-equivalente, backup) — não precisou reestruturar nada
> aqui, este roadmap já nasceu no formato certo.

## Diagnóstico (2026-08-07)

O projeto está no ar (self-host VPS Hetzner, zero Supabase), com fundação
técnica sólida — mas longe de "produção confiável" nas camadas de
engenharia, conteúdo e SEO.

| Dimensão | Estado | Nota |
|---|---|---|
| Fundação técnica | Monorepo pnpm, API tipada (Fastify+Drizzle+Zod), FTS português, segurança base (helmet/CORS/rate-limit), auditoria de direitos autorais | 80% |
| Conteúdo | ~850 obras exportadas; ~350 notas-stub sem descrição; títulos com lixo tipo `2 (The Good Samaritan)`; descrições com `**markdown**` cru; sem trecho do versículo | 55% |
| UX/Navegação | **Capítulo dá 404** (`/biblia/isaiah/9`); referências bíblicas sem o texto; catálogo inteiro numa request; sem lazy loading; sem paginação real; sem dark mode | 45% |
| Engenharia | Zero testes, zero CI/CD, sem OpenAPI, sem monitoramento, sem staging | 15% |
| SEO/Performance | SPA sem meta/OG/sitemap; 540MB de imagens sem otimização (sem webp/avif, sem CDN, sem LQIP) | 20% |

## Decisões travadas (2026-08-07)

- **Trecho bíblico:** texto curado no vault/export (extrair do bloco
  "Contexto Bíblico" das notas → coluna `passage_text`), sem API externa.
- **Descrições:** armazenar markdown e renderizar com `react-markdown` no
  cliente (sem `dangerouslySetInnerHTML`).
- **Ordem de execução:** Fase 0 (engenharia) primeiro, depois Fase 1.
- **SEO:** importa — o site deve ser indexado no Google (Fase 3 é prioridade).

---

## Fase 0 — Engenharia base (testes + CI + rigor)

**Objetivo:** blindar o pipeline de dados e a API antes de novas features.

- [ ] **Testes no server** (Vitest): regras de parse do
      `scripts/export-vault-data.ts` (extrair para módulo testável:
      título, descrição, referência, slug) + testes de integração das rotas
      Fastify via `app.inject()` com Postgres de teste (Docker).
- [ ] **Testes no web** (Vitest): `lib/utils`, mappers de `lib/api-data`,
      componentes críticos (ArtworkCard, referências).
- [ ] **CI GitHub Actions**: `lint + typecheck + test` em todo PR;
      `pnpm audit` (scan de dependências); build dos dois pacotes;
      Postgres service container pros testes de integração.
- [ ] **Pre-commit**: husky + lint-staged (lint/typecheck no commit).
- [ ] **tsconfig strict no web** (hoje `strict: false` no
      `tsconfig.app.json`).
- [ ] **OpenAPI**: `@fastify/swagger` publicado em `/docs`.

## Fase 1 — Conteúdo e navegação

**Objetivo:** consertar o que quebra a experiência real do usuário e
elevar a qualidade do catálogo.

- [ ] **Página de capítulo** `/biblia/:bookSlug/:chapter` (conserta o 404):
      reusar `GET /artworks?bookSlug=&chapter=`; lista de capítulos clicável
      na página do livro; breadcrumb; navegação capítulo anterior/próximo.
- [ ] **Trecho bíblico**: extrair o versículo do bloco "Contexto Bíblico"
      na exportação → coluna `passage_text` em `bible_references`
      (migration) → exibir na obra e na página do capítulo.
- [ ] **Títulos numerados**: parse no export —
      `O bom samaritano (The Good Samaritan 2)` → título `O bom samaritano`
      + subtítulo com o original do pintor; desambiguação por ano;
      re-import no VPS.
- [ ] **Descrições formatadas**: `react-markdown` no cliente
      (**negrito**, *itálico*, links).
- [ ] **Conteúdo em lote**: escrever descrições + trechos bíblicos das
      ~350 notas-stub do vault (molde existente, em lotes revisáveis).

## Fase 2 — UI/UX profissional

**Objetivo:** o visual "museu digital" que a nota do projeto descreve.

- [ ] **Design system**: tokens (paleta terrosa/papel envelhecido, dourado
      sutil, azuis profundos; tipografia serifada display para títulos);
      tema claro/escuro real (`next-themes` já instalado).
- [ ] **Galeria**: lazy loading + placeholder blur (LQIP); filtros reais
      (artista/período/categoria vindos da API); busca global `⌘K`.
- [ ] **Página da obra**: zoom/lightbox, obras relacionadas (mesmo capítulo
      ou artista), licença/atribuição em destaque, metadados.
- [ ] **Estados consistentes**: skeletons, erro com retry, vazio com CTA.
- [ ] **Acessibilidade**: contraste AA, foco visível, alt text rico,
      skip-link, aria.

## Fase 3 — Performance e SEO

**Objetivo:** indexação no Google e carregamento rápido.

- [ ] **Imagens**: pipeline `sharp` no export → webp/avif em ~3 tamanhos +
      LQIP/blurhash; CDN opcional (Cloudflare na frente do VPS).
- [ ] **Carregamento**: paginação/infinite scroll no catálogo (hoje busca
      1000 obras numa request com descrições inteiras); endpoint `/artists`.
- [ ] **SEO**: meta/OG/canonical por página, sitemap.xml, dados estruturados
      (Schema.org `VisualArtwork`, `ItemList`), URLs por slug (não UUID),
      fontes self-hosted.

## Fase 4 — Segurança, observabilidade e infra

**Objetivo:** operação confiável e de baixo susto.

- [ ] **Segurança**: CSP explícito, sanitização de HTML (se necessário),
      imagem `distroless`/sem-root, scan de deps no CI, auditoria.
- [ ] **Observabilidade**: `/health/live` e `/health/ready` (check de DB),
      métricas Prometheus (`prom-client`), alertas (Uptime Kuma), logs pino,
      Sentry (`@sentry/node`) — mesma conta usada nos outros projetos, não
      precisa uma conta nova por app.
- [ ] **Backup**: `pg_dump` agendado do `biblia_na_arte_db` + teste de
      restauração.
- [ ] **CI/CD completo**: Actions → build das 2 imagens → push → deploy
      automático no VPS com rollback; staging opcional.
- [ ] **Docs de operação**: runbook, ADRs.

## Fase 5 — Produto

**Objetivo:** features que transformam catálogo em plataforma.

- [ ] Coleções/playlists temáticas ("A Vida de Cristo", "As Parábolas")
      reaproveitando o vault (personagens, parábolas, milagres).
- [ ] Modo devocional/leitura.
- [ ] Compartilhamento com OG-image dinâmica.
- [ ] Favoritos locais.

---

## Como executar

```bash
# Subir Postgres de teste (Fase 0)
docker compose -f docker-compose.test.yml up -d

# Testes
pnpm --filter server test
pnpm --filter web test

# CI roda: pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Pipeline de dados (desktop do Rilson, curadoria manual — não faz parte do deploy):

```bash
pnpm --filter server export:vault   # lê o vault → web/public/images + vault-export.json
pnpm --filter server db:seed        # importa o JSON no Postgres (VPS)
```

## Status

| Fase | Status | Início |
|---|---|---|
| 0 — Engenharia base | 🔨 em andamento | 2026-08-07 |
| 1 — Conteúdo e navegação | ⏳ pendente | — |
| 2 — UI/UX | ⏳ pendente | — |
| 3 — Performance e SEO | ⏳ pendente | — |
| 4 — Segurança/observabilidade/infra | ⏳ pendente | — |
| 5 — Produto | ⏳ pendente | — |
