# Roadmap de Produção — Bíblia na Arte

> **Status atual: Fase 0 concluída** (2026-08-07)
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

- [x] **Testes no server** (Vitest): regras de parse do
      `scripts/export-vault-data.ts` (extraído para `server/src/lib/vault-parse.ts`
      testável: título, descrição, referência, slug) + testes de integração das
      rotas Fastify via `app.inject()` com Postgres de teste (Docker).
- [x] **Testes no web** (Vitest): `lib/utils`, mappers de `lib/api-data`,
      componentes críticos (ArtworkCard, referências).
- [x] **CI GitHub Actions**: `lint + typecheck + test` em todo PR;
      `pnpm audit --audit-level=high` (scan de dependências); build dos dois
      pacotes; Postgres service container pros testes de integração.
- [x] **Pre-commit**: husky + lint-staged (eslint --fix nos arquivos staged).
- [x] **tsconfig strict no web** (inclui `noUncheckedIndexedAccess`).
- [x] **OpenAPI**: `@fastify/swagger` publicado em `/docs` (JSON). Para ver
      com UI: abrir o JSON em https://editor.swagger.io.
- [x] **Auditoria de dependências**: `pnpm audit` = 0 vulnerabilidades
      (2026-08-07). Migração `react-router` v6.30 → **v7.18.2** (fixa os 3
      advisories moderados de open redirect / constructor injection — imports
      trocados `react-router-dom` → `react-router`, flag `future` removida).
      Override `esbuild: ^0.25.0` no root `package.json` (fixa o moderate do
      caminho dev do drizzle-kit).

## Fase 1 — Conteúdo e navegação

**Objetivo:** consertar o que quebra a experiência real do usuário e
elevar a qualidade do catálogo.

- [x] **Página de capítulo** `/biblia/:bookSlug/:chapter` (conserta o 404):
      `web/src/pages/Chapter.tsx` reusa `GET /artworks?bookSlug=&chapter=`;
      breadcrumb; navegação capítulo anterior/próximo; estados de loading,
      erro e vazio.
- [x] Lista de capítulos clicável na página do livro (`BibleBook.tsx`) —
      capítulos com obra em destaque, links para a página de capítulo.
- [x] **Texto bíblico do capítulo**: proxy no server para a Bible-API
      (`server/src/lib/bible-api.ts` + `GET /api/v1/bible-text/:bookSlug/:chapter`)
      na tradução João Ferreira de Almeida (domínio público), sem chave, com
      cache em memória (TTL 24h); exibido na página do capítulo. Substitui o
      plano original de coluna `passage_text` para o capítulo inteiro.
- [x] **Trecho bíblico por obra**: extrair o versículo do bloco "Contexto
      Bíblico" na exportação → coluna `passage_text` em `bible_references`
      (migration) → exibir na obra.
- [x] **Títulos numerados**: parse no export —
      `O bom samaritano (The Good Samaritan 2)` → título `O bom samaritano`
      + subtítulo com o original do pintor; desambiguação por ano;
      re-import no VPS.
- [x] **Descrições formatadas**: `react-markdown` no cliente
      (`web/src/components/ui/markdown.tsx` — **negrito**, *itálico*, links,
      listas, citações; escapa HTML cru). Usado na página da obra.
- [ ] **Conteúdo em lote**: escrever descrições + trechos bíblicos das
      ~350 notas-stub do vault (molde existente, em lotes revisáveis contínuos).

## Fase 2 — UI/UX profissional

**Objetivo:** o visual "museu digital" que a nota do projeto descreve.

- [x] **Design system**: tokens (paleta terrosa/papel envelhecido, dourado
      sutil, azuis profundos; tipografia serifada display para títulos);
      tema claro/escuro real (`next-themes` integrado com alternador `ThemeToggle`).
- [x] **Galeria & Busca Global**: busca global instantânea `⌘K` / `Ctrl+K`
      (`CommandPalette` com navegação para livros, capítulos, obras e temas);
      filtros na busca e categorias.
- [x] **Página da obra**: zoom/lightbox de alta resolução (`ArtworkLightbox`
      com controles de zoom, pan, tela cheia e atalhos), obras relacionadas
      (mesmo capítulo ou artista), licença/atribuição em destaque e metadados.
- [x] **Estados consistentes**: skeletons proporcionais (`ArtworkCardSkeleton`),
      erro com retry (`ErrorCard`), vazio com CTAs.
- [x] **Acessibilidade**: contraste refinado, foco visível, navegação fluida
      por teclado, botões de ação e atributos ARIA.

## Fase 3 — Performance e SEO

**Objetivo:** indexação no Google e carregamento rápido.

- [x] **Imagens**: pipeline de processamento `sharp` em `server/scripts/optimize-images.ts` gerando versões WebP de alta fidelidade e tamanho reduzido; comando `pnpm --filter server images:optimize`.
- [x] **Carregamento**: endpoint `GET /api/v1/artists` para agregação de artistas e contagem de obras; paginação real no catálogo e busca (`ArtCategories.tsx`, `Search.tsx`) em páginas de 24 itens.
- [x] **SEO**: componente `SEO.tsx` dinâmico com meta tags, canonical URLs, OpenGraph e Twitter Cards; dados estruturados Schema.org JSON-LD (`VisualArtwork` na obra, `CollectionPage` e `BreadcrumbList` em livros e capítulos, `WebSite` na home); `robots.txt` e gerador de `sitemap.xml` cobrindo 2115 URLs canônicas.

## Fase 4 — Segurança, observabilidade e infra

**Objetivo:** operação confiável e de baixo susto.

- [ ] **Segurança**: CSP explícito, sanitização de HTML (se necessário),
      imagem `distroless`/sem-root, scan de deps no CI, auditoria.
- [ ] **Observabilidade**: `/health/live` e `/health/ready` (check de DB),
      alertas (Uptime Kuma), logs pino, Sentry (`@sentry/node`) — mesma
      conta usada nos outros projetos, não precisa uma conta nova por app.
- [~] ~~Métricas Prometheus (`prom-client`)~~ — **adiado, 2026-08-08**:
      rodar um scraper Prometheus (mesmo sem Grafana) é mais um serviço
      permanente consumindo RAM num VPS pequeno com vários projetos já
      dividindo o mesmo servidor. Uptime Kuma (disponibilidade) + Sentry
      (erros) já cobrem o essencial sem esse custo. Reavaliar só se um
      dia isso não for mais suficiente pra diagnosticar um problema real.
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
| 0 — Engenharia base | ✅ concluída | 2026-08-07 |
| 1 — Conteúdo e navegação | ✅ concluída | 2026-08-08 |
| 2 — UI/UX profissional | ✅ concluída | 2026-08-08 |
| 3 — Performance e SEO | ⏳ pendente | — |
| 4 — Segurança/observabilidade/infra | ⏳ pendente | — |
| 5 — Produto | ⏳ pendente | — |


## Nota: se este projeto ganhar conta de usuário final (2026-08-14)

Decisão registrada no `meus-remedios` (único projeto pessoal com auth
de usuário real hoje): OAuth (Google) como atalho **nunca substitui**
conta local (e-mail/senha) — mantenha os dois, por 3 motivos que valem
pra qualquer projeto, não só aquele: (1) ponto único de falha — se a
conta do provedor for bloqueada, comprometida, ou a pessoa não tiver,
fica sem acesso nenhum; (2) fluxo OAuth mobile depende de deep link +
Custom Tabs + `Promise` resolvendo certo — classe de bug inteira que
conta local não tem (achado real: `meus-remedios/README.md`, seção
"Decisão: Google OAuth + conta local"); (3) App Store exige "Entrar
com Apple" se você oferece "Entrar com Google" (Guideline 4.8) — "só
Google" não é viável em iOS de qualquer forma.
