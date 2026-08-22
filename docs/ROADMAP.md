# Roadmap de Produção — Bíblia na Arte

> **Status atual: Fase 0 concluída** (2026-08-07)
>
> Este documento é a fonte da verdade do caminho até produção confiável.
> O `README.md` do repo e a nota `Bíblia na Arte.md` no vault Obsidian
> apontam pra cá.
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
- [~] **Conteúdo em lote — números reais (checado 2026-08-16, achado
      testando o site em produção)**: de 853 obras, **184 (21%) têm
      descrição curta demais** (<80 caracteres), sendo **18 delas só o
      fallback genérico do export** ("X, de Y.", sem conteúdo real
      nenhum) e **73 (8%) sem nenhuma referência bíblica associada**.
      Não é suposição — contado via API real, obra por obra.
  - [x] **As 18 do fallback genérico — concluídas (2026-08-16)**: cada
        uma pesquisada de verdade (não texto genérico gerado) — fonte
        real por obra (National Gallery of Art, Philadelphia Museum,
        Met, Getty, Alte Pinakothek, museus russos e outros), formato
        completo (Descrição da Obra + Contexto Bíblico verso a verso).
        3 correções de dado achadas no caminho: ano errado do Brueghel
        (1569 era o nascimento do pintor, não da obra — corrigido pra
        c. 1609), ano errado do Guido Reni "Martírio de André" (1600 →
        1608, confirmado pela obra original), link do Notion quebrado
        no campo `livros` da nota de Ester/Guercino. Honestidade
        teológica mantida onde relevante: desmaio de Ester é das
        Adições Gregas (apócrifas), não do texto hebraico canônico;
        cruz em X de André é tradição da igreja, não Escritura; "Os
        temperados e os intemperados" nem é cena bíblica — é iluminura
        ilustrando Valério Máximo (autor romano), catalogada pelo tema
        moral partilhado, não por narrar episódio das Escrituras.
  - [x] **`extractDescription()` tinha bug real, achado testando o
        próximo lote (2026-08-16)**: 29 obras mostravam literalmente
        "---" como descrição (capturava o divisor markdown por causa
        do `\s*` guloso quando a seção existe mas está vazia) e ~138
        mostravam o placeholder de navegação "Ver [[Livro]], [[Livro
        Capítulo]]." como se fosse texto real. Corrigido na função
        (`isPlaceholderText()`, com 2 testes novos, 46/46 passando) —
        as ~167 obras voltam a cair no fallback "X, de Y." em vez de
        mostrar lixo, sem precisar editar nota por nota.
  - [x] **2º lote de conteúdo real — 10 obras (2026-08-16)**: Rembrandt
        (O retorno do filho pródigo, O sacrifício de Isaque, O bom
        samaritano, Pedro na Prisão, O apedrejamento de Estevão —
        primeira obra assinada dele, aos 19 anos —, Moisés com os dez
        mandamentos), Ticiano (O descer do Espírito Santo, O
        sepultamento de Cristo), William Blake (O fantasma de Samuel
        aparecendo a Saul), Willem de Poorter (Salomão e a Rainha de
        Sabá). 1 correção de capítulo (Moisés: Êxodo 34 → 32, a cena é
        antes de quebrar as tábuas, não a segunda entrega).
  - [x] **3º lote de conteúdo real — 10 obras (2026-08-16)**: Rembrandt
        (Simeão e Ana no Templo, Paisagem na fuga para o Egito, O sonho
        de José, Jesus expulsando os vendilhões do Templo, Fuga para o
        Egito — 5 obras diferentes do mesmo pintor, cada uma com fonte
        própria), Ticiano (Salomé com a cabeça de João Batista — versão
        de oficina, distinta da nota já existente sobre a versão do
        Prado —, Os peregrinos em Emaús), Pieter Bruegel o Velho
        (Jesus e os discípulos no caminho de Emaús), Philippe de
        Champaigne (O bom pastor), Rogier van der Weyden (O nascimento
        de João Batista, painel do Tríptico de São João Batista).
        2 achados no caminho:
        1. **Correção de dado**: "O sonho de José" de Rembrandt estava
           catalogado como Gênesis 37 (sonho de José filho de Jacó) —
           mas a obra retrata o segundo sonho de José, marido de
           Maria, avisado a fugir para o Egito (Mateus 2:13-15); a
           própria imagem mostra um anjo sobre a Sagrada Família
           dormindo, não os irmãos de José reagindo a um sonho.
           Corrigido `livros`/`capítulos` no frontmatter.
        2. **Honestidade sobre o meio**: a nota "Jesus e os discípulos
           no caminho de Emaús" atribuída a Bruegel não é uma pintura
           — é uma gravura de Philips Galle publicada em 1571, dois
           anos depois da morte de Bruegel, a partir de um desenho
           dele (inscrições "P. BRVEGEL INVENTOR" / "P. GAL. FE." na
           própria chapa). Descrito como tal no texto, em vez de
           tratar como óleo original.
  - [x] **3 obras do Van Gogh excluídas do catálogo (achado 2026-08-16,
        curadoria, não bug de parsing)**: "A Amoreira", "Celebração" e
        "Paisagem com casas" eram notas-esqueleto (frontmatter e corpo
        vazios, `livros`/`capítulos` nunca preenchidos) — paisagens/
        gênero sem nenhuma cena bíblica. Mesmo princípio já usado pra
        obra sem licença permissiva: se não pertence de fato ao
        escopo, não entra forçado. Excluídas via lista explícita em
        `export-vault-data.ts` (`EXCLUDED_NON_BIBLICAL_FILENAMES`),
        notas continuam no vault, só fora da exportação.
  - [ ] **4 problemas de embed pré-existentes no vault (achado
        2026-08-16, script de verificação, não fazem parte dos lotes
        de conteúdo)**: Briton Riviere "Daniel na cova dos leões",
        Giotto "Jonas Sendo Engolido Pelo Grande Peixe", James Tissot
        "Adão e Eva São Expulsos do Paraíso" (embed genérico "Pasted
        image ...png", arquivo original parece ter sido renomeado/
        perdido), Kim Ki-chang "A Última Ceia" — todas com embed
        apontando pra arquivo que não existe mais em `0 - Anexos`,
        excluídas silenciosamente do catálogo. Achar a imagem certa
        (ou uma substituta em domínio público) quando for a vez
        dessas.
  - [ ] **Restam ~143 obras com fallback genérico e ~53 sem referência
        bíblica** (estimado a partir dos 153/55 do check anterior menos
        as 10 deste lote; confirmar via API real depois do reseed) —
        trabalho de curadoria contínua, próximos lotes quando fizer
        sentido retomar.
  - [x] **3 achados reais testando as 18 no ar (2026-08-16), corrigidos
        na raiz**:
        1. Blocos `[!info]` (sintaxe exclusiva do Obsidian) apareciam
           crus no site, com "[info]" literal na tela — convertidos
           pra link markdown simples nas 17 notas afetadas.
        2. **Achado maior do que parecia**: minha citação
           `- **[[Livro Cap]]:verso` dentro do blockquote nunca fecha
           o `**` — bold sem fechamento quebra a renderização
           (asteriscos literais). Isso não afetava só as minhas 18 —
           **~100 notas do vault usam essa mesma convenção**, bug
           pré-existente nunca antes percebido. Corrigido de vez em
           `extractPassageText()` (`vault-parse.ts`): descarta linhas
           de citação automaticamente, não precisa editar nota por
           nota, corrige as ~100 de uma vez (presente e futuro).
        3. Hero ainda ilegível no tema escuro: `bg-primary/80` parecia
           ok no claro, mas `--primary` no escuro é dourado (cor de
           marca), não o vinho do claro — "dourado sobre dourado",
           contraste real **1.13:1** calculado. Trocado por
           `--hero-scrim`, token fixo dedicado (não compartilha com
           cor de marca) — 5.77:1/10.49:1 nos dois temas agora.

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
- [ ] **Achado 2026-08-16, checagem rápida**: 17 `aria-label`/`alt` em 81
      componentes (~21%) — ainda não auditado a fundo (contagem, não
      auditoria completa de teclado/foco).
- [x] **2 falhas WCAG reais corrigidas, com conta (2026-08-16, testando
      em produção)**: (1) título do hero ("Arte e Cultura") com gradiente
      dourado sobre imagem também dourada — contraste real calculado
      **2.92:1** (abaixo do mínimo de 3:1 pra texto grande); overlay de
      `bg-primary/60` pra `/80` resolve, sobe pra 4.46:1. (2)
      `--gradient-card` não tinha override no tema escuro — herdava o
      segundo stop do claro (95% de luz, quase branco), cards com
      `CardDescription` (calibrado pro escuro) ficavam ilegíveis por
      cima. Corrigido com override específico, contraste real
      6.18-7.46:1 nas duas pontas do gradiente.
- [x] **Markdown cru vazando pra fora da página da obra (2026-08-16)**:
      cards (`ArtworkCard.tsx`) e meta description/JSON-LD
      (`ArtworkDetail.tsx`) mostravam literalmente `**Édouard Manet**`
      com os asteriscos — só a página da obra em si renderizava
      markdown de verdade. Nova função `stripMarkdown()` em
      `lib/utils.ts` pra resumo em texto puro (cards/meta não devem
      renderizar markdown de qualquer forma — `line-clamp` corta no
      meio de elemento em bloco).
- [x] **Rodapé/cabeçalho: "BiblianaArte.com" e "Desenvolvido com ♡..."
      removidos (2026-08-16)** — ver item de marca corrigida acima.

## Fase 3 — Performance e SEO

**Objetivo:** indexação no Google e carregamento rápido.

- [x] **Imagens — pipeline automático, não mais manual (2026-08-15/16)**:
      até aqui a otimização WebP era um script à parte
      (`images:optimize`) que só valia se alguém lembrasse de rodar
      *depois* de todo re-export do vault — e ninguém lembrava: só 25 de
      ~1580 arquivos em `web/public/images/` estavam em WebP, o banco de
      produção nunca apontou pra nenhum deles (`imageUrl` guardava a
      extensão original, `.jpg`/`.png`), e o diretório tinha acumulado
      ~2280 imagens órfãs de artistas excluídos numa auditoria de
      direitos autorais anterior. Corrigido na fonte:
      `server/scripts/export-vault-data.ts` agora converte cada imagem
      pra WebP (mesmos parâmetros de antes: max 1600px, qualidade 82)
      **no momento da cópia do vault**, já salva com `imageFile =
      slug.webp`, e limpa `web/public/images/` antes de regenerar (o
      diretório é saída 100% derivada do vault, mesma filosofia do
      `import-seed-data.ts` — não deve acumular sobra). `images:optimize`
      continua existindo só pra backfill manual pontual, não faz mais
      parte do fluxo normal. Rodado de ponta a ponta e **verificado em
      produção**: 853 obras, banco reseedado com `imageUrl` em `.webp`
      (confirmado via API real, `content-type: image/webp` na imagem
      servida), catálogo de imagens **958MB → 111MB** (~88%,
      incluindo a limpeza das órfãs — a redução só de WebP já validada
      antes era ~79%).
- [ ] **Achado no caminho (2026-08-16): 7 pares de notas duplicadas no
      vault** — mesmo título+artista (ex.: "Rembrandt van Rijn - A Ceia
      em Emaús" e "... 2.md"), gerando o mesmo slug e por isso a mesma
      imagem. Não quebra nada (as duas linhas do banco mostram a obra
      certa), mas infla a contagem do catálogo em ~7. Provavelmente são
      versões diferentes da mesma cena (Rembrandt pintou "A Ceia em
      Emaús" mais de uma vez) que o parser de título simplificou pro
      mesmo nome — checar no vault e, se forem obras diferentes mesmo,
      ajustar o título de uma delas pra desempatar o slug.
- [x] ~~`web/public/images/` rastreado no git~~ — checado 2026-08-16: já é
      **Git LFS** (`.gitattributes` cobre `*.webp`/`*.jpg`/`*.png` e
      `web/public/images/*`), não git normal. Não é o problema que
      pareceu à primeira vista — LFS já resolve o inchaço de histórico.
      845 objetos WebP novos (~114MB) enviados via `git lfs push` sem
      drama.
- [x] **Carregamento**: endpoint `GET /api/v1/artists` para agregação de artistas e contagem de obras; paginação real no catálogo e busca (`ArtCategories.tsx`, `Search.tsx`) em páginas de 24 itens.
- [x] **SEO**: componente `SEO.tsx` dinâmico com meta tags, canonical URLs, OpenGraph e Twitter Cards; dados estruturados Schema.org JSON-LD (`VisualArtwork` na obra, `CollectionPage` e `BreadcrumbList` em livros e capítulos, `WebSite` na home); `robots.txt` e gerador de `sitemap.xml` cobrindo 2115 URLs canônicas.
- [x] **Marca errada — resolvido de vez (2026-08-16)**: o problema era
      bem mais espalhado do que o achado original de 2026-08-14
      registrava (só `<title>`/OG). "BiblianaArte.com" aparecia em **16
      lugares reais**: cabeçalho e rodapé do site (visível pra todo
      visitante, achado pelo Rilson testando em produção), `SEO.tsx`
      (`SITE_NAME`), páginas Sobre/Contribuir/Index, `index.css`
      (comentário) e `index.html` (title/OG/Twitter). Trocado em todo
      lugar por "Bíblia na Arte" — incluindo concordância de gênero
      corrigida ("a Bíblia na Arte", não "o", já que "Bíblia" é
      feminino).
- [x] **`mailto:contato@biblianaarte.com` removido (2026-08-14)** —
      domínio que o Rilson não possui, todo clique falharia. Pendência
      real pra trás: e-mail de contato de verdade. Decisão central em
      `hetzner-infra/README.md` ("Roadmap") — alias no cPanel do
      narniano.com redirecionando pro Gmail já monitorado, não caixa
      nova por projeto. Até lá, se precisar de um contato clicável aqui,
      usar `rilsonjoas10@gmail.com` direto (mesmo padrão do
      `scriptorium-divinum`, 2026-08-16).

## Fase 4 — Segurança, observabilidade e infra

**Objetivo:** operação confiável e de baixo susto.

- [x] **Segurança — CSP (2026-08-14)**: Cabeçalho `Content-Security-Policy` configurado no `web/nginx.conf` cobrindo `script-src`, `style-src`, `font-src`, `img-src` e `connect-src`. Pendente: imagem `distroless`/sem-root, scan de deps no CI, auditoria completa.
- [x] **Google Search Console verificado (2026-08-14)**: Tag `<meta name="google-site-verification">` adicionada ao `web/index.html`; propriedade `https://biblianaarte.narniano.com` verificada com sucesso.
- [ ] **Verificar sitemap no Search Console**: Acessar [Google Search Console](https://search.google.com/search-console) → propriedade `biblianaarte.narniano.com` → Sitemaps → confirmar que `https://biblianaarte.narniano.com/sitemap.xml` está com status "Sucesso" e URLs sendo indexadas.
- [x] **Backup (2026-08-14)**: Confirmado. O banco `biblia_na_arte_db` está incluído no VPS Hetzner, coberto pelo script de backup diário (`backup.sh`) e validado pelo teste de restore semanal automático (`backup-restore-test.sh`).
- [x] **Observabilidade e Resiliência (2026-08-14)**: `/health`, `/health/live` e `/health/ready` (validação de DB ativa) implementados no Fastify; tratamento gracioso de `SIGTERM`/`SIGINT` configurado; Sentry integrado.
- [ ] **`biblianaarte-web` sem healthcheck (achado 2026-08-14)**: o
      `docker-compose.yml` em `hetzner-infra/biblia-na-arte/` define
      `healthcheck` só na API — o serviço `biblianaarte-web` (nginx)
      não tem. Se o Nginx travar sem derrubar o processo, o Traefik
      continua roteando tráfego pra um container quebrado silenciosamente,
      sem o Uptime Kuma necessariamente pegar no mesmo instante (depende
      do endpoint monitorado). Adicionar `healthcheck` simples (`curl`/`wget`
      no `/` servido pelo nginx) segue o mesmo padrão já usado na API.
- [x] **Uptime Kuma com alerta real**: monitorando `biblianaarte.narniano.com`
      e `api-biblianaarte.narniano.com`, com alerta configurado em
      **Telegram e e-mail** (não é só painel visual) — item concluído,
      sem pendência.
- [~] ~~Métricas Prometheus (`prom-client`)~~ — **adiado, 2026-08-08**:
      rodar um scraper Prometheus (mesmo sem Grafana) é mais um serviço
      permanente consumindo RAM num VPS pequeno com vários projetos já
      dividindo o mesmo servidor. Uptime Kuma (disponibilidade) + Sentry
      (erros) já cobrem o essencial sem esse custo. Reavaliar só se um
      dia isso não for mais suficiente pra diagnosticar um problema real.
- [x] **Backup (2026-08-14)**: `pg_dump` diário do `biblia_na_arte_db` confirmado via `hetzner-infra/backup/backup.sh`; teste de restore automático semanal via `backup-restore-test.sh`.
- [x] **CI/CD completo** (2026-08-14): Actions → build das 2 imagens (`biblianaarte-api` e `biblianaarte-web`) → push automático no GHCR com permissões de pacotes e escopo do owner resolvidos. Deploy no VPS agendado no roadmap geral.
- [ ] **Docs de operação**: runbook, ADRs.
- [x] **Achado e corrigido (2026-08-16): migration `0001_fuzzy_overlord.sql`
      nunca tinha rodado em produção** — existia no repo desde a
      reestruturação em monorepo, mas nunca foi aplicada no
      `biblia_na_arte_db` real. Resultado: a coluna `subtitle` não
      existia na tabela `artworks`, e qualquer query que a selecionasse
      (a listagem de obras da API, `GET /api/v1/artworks`) quebrava com
      `internal_error` — **esse era o "não consigo ver as obras no site"
      que o Rilson já vinha notando**, não relacionado a WebP. Rodado
      `pnpm --filter server db:migrate` contra produção via container
      temporário (`node:22-alpine` isolado, `--network proxy-network`,
      código copiado por `docker cp` — não fica nada residual no host);
      confirmado a coluna existe e a API volta a responder com dados
      reais.
- [x] **Incidente registrado (2026-08-16): `.env` de produção apagado por
      engano, recuperado sem downtime** — durante o deploy da migração
      WebP, um `rsync -az --delete` do repo local pro `/opt/biblia-na-arte/`
      apagou `server/.env` (só existe no VPS, nunca no repo local — o
      `--delete` espelha o destino igual à origem, e origem não tinha o
      arquivo). Os containers já rodando não caíram (Compose só lê
      `env_file` na *criação* do container, não em restart — mesmo achado
      já documentado no `hetzner-infra/README.md`), então produção seguiu
      no ar o tempo todo; a senha foi restaurada do Bitwarden e
      verificada com uma query real antes de qualquer outra ação. Lição
      prática: **nunca rodar `rsync --delete` sem `--exclude='.env'`
      explícito** quando a origem é um repo local que não tem os
      segredos do destino — melhor ainda, considerar excluir `.env` por
      padrão do fluxo de deploy documentado no `hetzner-infra/README.md`
      (hoje o exemplo de comando lá não tem esse exclude).

## Identidade aplicada aqui (2026-08-15)

> Fonte: `Identidade visual geral.md` e `Identidade Visual - Guia Técnico
> (Código).md` no vault. Registro predominante: **A Biblioteca**, com
> toque pontual de **Os Céus** em obras de temática de criação/cosmos.
> A cara própria deste projeto, vs. o Scriptorium (que compartilha a
> mesma base): aqui a assinatura é a **moldura da obra**, não o texto.

- [~] Moldura em cada obra — EXECUTADO 2026-08-22 como **`.gallery-frame`**
      (filete duplo dourado em passe-partout via overlay, tokens crus
      `--canela/--dourado/--vinho` adicionados ao `index.css`): aplicado
      nos cards do catálogo e no hero da página da obra. Decisão honesta:
      o `frame-arch` literal do guia (retrato 280×380) exigiria RECORTAR
      pinturas paisagem com object-cover — aqui a obra fica inteira dentro
      da moldura. Arco literal reservado pra contextos retrato futuros.
- [x] Capitular (`.capitular::first-letter`) na descrição da obra
      (2026-08-22) — com a lição WCAG do Lecionário respeitada: vinho no
      tema claro, dourado só no escuro.
- [x] `.signature-italic` no subtítulo de artista na página da obra
      (2026-08-22).
- [ ] `--gradiente-ceus` + `.halo-glow` reservado só pra obras de temática
      de criação/cosmos (ex. representações da Criação, Gênesis 1) — não
      usar em todo lugar, senão perde o significado. Dependência: marcar
      quais obras são de Criação.
- [x] Curvas `--ease-liturgico`/`--ease-vela` nas transições (2026-08-22):
      zoom do lightbox, hover dos cards e transição do hero.
- [x] **Convergência tipográfica com o cânone (2026-08-22)**: display
      migrado Playfair Display → **Cormorant Garamond** (igual ao
      Lecionário); import do Playfair REMOVIDO — uma fonte a menos.
      Bônus: tailwind.config ganhou mapeamento `fontFamily` via vars
      (padrão Lecionário) — sem ele a classe `font-display` nem existia
      (bug silencioso: título do lightbox caía no sans). Inter segue no
      chrome de UI (igual aos irmãos), EB Garamond no corpo.
- [x] **Footer "Conheça também" (2026-08-22)** — modelo Gerador adaptado:
      rótulo caps espaçadas + Narniano · Scriptorium · Lecionário · Gerador
      unidos por ✦ dourado (`var(--dourado)`), pares atômicos flex-wrap.
      Fecha o item cruzado dos 4 projetos.
- [x] **Logo/favicon — dourado divergente é tarefa de ASSET, não de código
      (verificado 2026-08-22)**: grep confirma que `#F0C663` não existe em
      nenhum código/CSS — está queimado nos PNGs (`logo-header-*.png`,
      favicons). Reconciliar com `#B49A60` exige regenerar os assets a
      partir do arquivo de design original. Manual, quando houver acesso.

## Fase 5 — Produto

**Objetivo:** features que transformam catálogo em plataforma.

- [ ] Coleções/playlists temáticas ("A Vida de Cristo", "As Parábolas")
      reaproveitando o vault (personagens, parábolas, milagres).
- [ ] Modo devocional/leitura.
- [ ] Compartilhamento com OG-image dinâmica.
- [ ] Favoritos locais.
- [ ] **Expansão do acervo: música e cinema (2026-08-22)** — decisão do
      Rilson: precisa necessariamente acontecer, depois das pinturas
      estarem sólidas. O schema já nasceu com `category`
      (pintura|música|filme) e a UI já prevê filtros/cards (ArtCategories,
      Search, ArtworkCard) — mas o catálogo real hoje é 100% pintura, e a
      cópia prometia os três meios (hero, footer, About, Contribute,
      Search): textos ajustados pra verdade em 2026-08-22, cards/filtros
      ficam como infra pronta esperando o primeiro lote real de cada meio
      (ou esconder até lá — decidir na hora). Material de curadoria no
      vault: notas de música sacra/livros (`10 - Arte e literatura`) e
      análise de cinema via Rookmaaker (`3 - Clippings`, Scorsese).

### Integração com o Lecionário — "Pintura do Dia" (2026-08-16)

Ideia do Rilson: o Lecionário mostra um card opcional com obra de arte
relacionada à leitura do dia, linkando pra cá. Lado recíproco registrado
em `lecionario/ROADMAP.md`, seção 4.5 — este projeto **não precisa fazer
nada além do que já existe**: `GET /api/v1/artworks?bookSlug=&chapter=`
já está pronto e testado, é só o Lecionário consumir. Nenhum trabalho
novo aqui, só o link de conhecimento entre os dois roadmaps.

### PWA instalável, antes de considerar app nativo (2026-08-16)

Discutido: cabe um app React Native pra este projeto? Decisão consciente
por enquanto — **não agora**. Manter um segundo app nativo em paralelo
ao Lecionário tem custo real e permanente (visto na prática nesta mesma
sessão: build EAS, versão de SDK, ícone/splash, acessibilidade por
plataforma). Caminho mais barato primeiro: **PWA instalável**, mesmo
padrão que o Lecionário já usa e validou (manifest, "Adicionar à tela
inicial", cache de imagem). Reavaliar React Native só se uso real
mostrar que PWA não é suficiente — não por suposição.

- [ ] Adicionar manifest.json + ícones PWA (mesmo padrão do Lecionário)
- [ ] Avaliar service worker pra cache de imagem (galeria funciona bem
      offline depois da primeira visita)

### Rodapé cruzado — cluster A Biblioteca (2026-08-16)

- [ ] Mesmo item registrado nos outros 3 projetos (`lecionario/ROADMAP.md`
      4.8) — link estático pros 4 (este, Scriptorium, Lecionário, Gerador
      C.S. Lewis), sem integração de dado

### Estratégia — o que "sucesso" significa aqui (2026-08-15)

Público-alvo: qualquer pessoa com interesse em arte sacra e referência
bíblica precisa — professores de EBD, seminaristas, pastores buscando
imagem pra sermão, estudantes de arte/teologia, amantes de arte em
geral. Sem recorte denominacional — a proposta (buscar por passagem
bíblica → obra de arte) serve igualmente a qualquer tradição cristã.

**Estimativa de potencial (teto plausível, não medição real):** o
diferencial real é a curadoria com referência bíblica verificada, algo
que busca de imagem genérica (Google Imagens) não oferece. Isso é nicho
de cauda longa em SEO, não produto de massa — sucesso plausível é
tráfego orgânico constante de buscas específicas ("pintura Bíblia
Gênesis 1", "arte sacra domínio público"), não viralização.

**O que isso implica pra estratégia e infra:**
- Cada página de obra com contexto histórico-bíblico é uma página de
  SEO — vale mais investir aí do que em features novas antes de medir
  se o tráfego orgânico está crescendo.
- **Gargalo real em escala não é a API, é servir imagem em alta
  resolução.** Com ~467MB hoje isso não é problema; se o catálogo
  crescer bastante, migrar imagens pra armazenamento tipo objeto
  (Cloudflare R2/Backblaze B2, ambos com free tier generoso) é a
  próxima etapa de infra — não antes disso ser um problema real.
- Monetização, se fizer sentido, com cuidado pra não quebrar a
  experiência contemplativa (ads intrusivos destroem esse tipo de
  produto) — apoio via PIX/Patreon combina melhor com o propósito do
  que ads agressivos.

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


## Qualidade de Conteúdo (2026-08-22)

Padrão cross-projeto: `Padrão de Qualidade de Conteúdo.md` no vault
(princípio #7 de `Filosofia e Padrões de Engenharia.md`). Aqui
especificamente:

- **Já aconteceu de errado**: a página "Sobre o Projeto" contava a
  origem do projeto como inspirada na "Capela Sistina" — história
  fabricada, nunca aconteceu de verdade. Corrigida em 2026-08-22 pela
  história real (Rookmaaker → Arte Cristã Diária → o site), com
  citação real do Rookmaaker atribuída a obra e ano — esse rodapé de
  citação (`— Hans Rookmaaker, *A Arte Não Precisa de Justificativa*
  (1978)`) é o padrão a repetir sempre que citar alguém direto.
- **Checklist antes de publicar obra/descrição nova**:
  - [ ] Referência bíblica confirmada (livro/capítulo/versículo bate
        com o conteúdo da obra, não só "parece bíblico")
  - [ ] Dados da obra (autor, ano, técnica, dimensões) confirmados na
        fonte do museu/instituição, não copiados de agregador terceiro
  - [ ] Se a descrição cita alguém (Rookmaaker, Schaeffer, Lewis...):
        trecho textualmente confirmado no livro, não paráfrase de
        memória — ver questão aberta abaixo ("vozes dos clássicos")
  - [ ] Licença/domínio público confirmado, não assumido
  - [ ] Uma releitura antes de publicar — erro de conteúdo não aparece
        em `tsc --noEmit` nem nos 28 testes


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

## Identidade visual — logo real aplicada (2026-08-16)

- [x] **Logo real no favicon/header/footer**, escolhida pelo Rilson
      entre 2 versões (moldura dourada sobre vinho — a outra, livro +
      planta, ficou genérica demais pra um projeto sobre *arte*).
      Variação clara/escura gerada (vinho↔dourado invertidos), trocada
      via `dark:` do Tailwind, sem JS. Conjunto completo de favicons
      (ico, 16/32px, apple-touch-icon, android-chrome, webmanifest).
      Faz parte do **Design Narniano**, cluster "A Biblioteca" — ver
      `12 - Redes sociais/Identidade visual geral.md` no vault (seção
      1C, Mapa de Aplicação) e `hetzner-infra/PADRAO-DE-ENGENHARIA.md`
      pro lado técnico/deploy. Pendência registrada lá: o dourado da
      logo (`#F0C663`) não bate com o token oficial (`--dourado:
      #B49A60`) — reconciliar quando fizer sentido, não urgente.
      2 achados no caminho: esqueci o Footer na primeira passada (só
      tinha trocado o Header — Rilson achou testando ao vivo); e um
      bug sério de infra descoberto durante o deploy — `git-lfs` não
      instalado na VPS fazia toda imagem (não só a logo) virar um
      ponteiro de texto de ~130 bytes em vez do binário real, quebrando
      a exibição de **todas** as pinturas do site por um tempo.
      Corrigido e documentado em `hetzner-infra/README.md`.

---

## Backlog de Produto — Issues e Bugs (levantamentos 2026-08-21 e 2026-08-22)

> Levantamento feito pelo Rilson — complementa o roadmap de Fases acima.

### 🔴 Crítico — bloqueio de confiança e monetização

- [x] **Git LFS — push com objetos desconhecidos (RESOLVIDO 2026-08-22,
      era quase todo falso alarme)** — `Your push referenced at least 2
      unknown Git LFS objects`. Diagnóstico definitivo em vez de chute:
      inventário dos **1.904 OIDs que já existiram em todo o histórico**
      (`git lfs ls-files --all` + dry-run salvo) consultado um a um na
      **Batch API do GitHub** (`POST .../info/lfs/objects/batch`,
      chunks de 100, auth via `gh auth token`). Resultado: **1.903/1.904
      presentes e íntegros no servidor** — todas as pinturas, logos e
      favicons, incluindo versões antigas substituídas por re-exports.
      Local também íntegro (`git lfs fsck` OK). O único faltante é o OID
      da **string vazia** (`e3b0c442…b855`, sha256 de zero bytes),
      associado ao `server/db-legacy-supabase-reference/fix-security-view.sql`
      — arquivo-placeholder VAZIO da era Supabase. Causa-raiz: git-lfs
      **não gerencia arquivos de 0 byte** ("does not manage files with a
      size of 0 bytes") — nenhum commit alcançável jamais guardou ponteiro
      daquele arquivo (o blob no histórico é o vazio puro do git,
      `e69de29…`); o fantasma nasce do scan interno do próprio git-lfs.
      Tentativas de subir o objeto vazio (push --object-id, PUT manual na
      URL assinada do S3 com headers assinados) falham ou são ignoradas
      pelo backend — **GitHub não indexa objeto LFS de 0 byte**, ponto.
      Impacto residual: ZERO — clone fresco funciona perfeito, nada de
      valor faltando. Lições registradas: (1) esse aviso do GitHub não diz
      quais objetos são — o caminho certo de auditoria é a Batch API;
      (2) nunca commitar arquivos vazios sob padrões rastreados pelo LFS;
      (3) `--dry-run` do git-lfs lista TODOS os elegíveis sem consultar o
      servidor — não serve pra medir o que falta.
- [x] **Auditoria de direitos autorais das obras (CONCLUÍDA — fonte da
      verdade: [`AUDITORIA-COPYRIGHT.md`](AUDITORIA-COPYRIGHT.md))** — a
      "planilha de controle" pedida aqui virou aquele documento, melhor:
      critério legal brasileiro (LDA 9.610/98, morte ≤ 1955), 19 casos
      bloqueados com verificação individual e fonte primária, implementação
      no banco (coluna `active`, migration 0002, API só serve active=true,
      `data-fixes.sql` idempotente a cada deploy) e checklist pra inclusão
      futura. Cauda dos 4 pendentes fechada em 2026-08-22 por busca web
      com fonte primária: **Clementz (†1930) e Guétin (†1916) liberados**
      — reativação já escrita no `data-fixes.sql`, entra no próximo deploy;
      **Lu Hongnian bloqueado até 2059** (†1989); **Gao Di'an intracável**
      (permanece bloqueado por precaução). Com isso o pré-requisito de
      confiança pra **AdSense está cumprido** (ver seção Monetização).
- [ ] **Informação fabricada no "Sobre o projeto" (2026-08-22)** — a seção
      "Como Tudo Começou" (`web/src/pages/About.tsx`, ~linha 153) inventa uma
      origem que **não aconteceu** ("surgiu durante uma visita à Capela
      Sistina observando Michelangelo"). A história real: o projeto nasceu da
      paixão por arte bíblica, da leitura de Hans Rookmaaker, e foi lançado
      primeiro como **Arte Cristã Diária** no Instagram — o site veio depois.
      Reescrever com a história verdadeira e revisar o resto da página (e o
      parágrafo equivalente na home, `Index.tsx`) contra fatos verificáveis.
      Mesma classe de problema do item de copyright: a credibilidade é o
      produto.

### 🟡 Melhoria — produto (ver Fases 1-3 do roadmap principal)

- [ ] **"Conheça também" no rodapé — seção de links do cluster A Biblioteca** — o footer atual (4 colunas) não linka os projetos irmãos. Adicionar bloco compacto seguindo o **modelo aprovado no Gerador C.S. Lewis (2026-08-21)**: rótulo-nicho em caps espaçadas ("CONHEÇA TAMBÉM", tom apagado) → links uniformes (mesmo tamanho/peso) separados por ✦ dourado, em grupos atômicos `flex-wrap` (ornamento + link indivisíveis, quebra de linha limpa no mobile) → © discreto na base. Uma família tipográfica só, coluna centrada. Links: Narniano, Scriptorium Divinum, Lecionário, Gerador C.S. Lewis. Referência: `ClusterFooter.tsx` em `GeradorCSLewis/src/components/`. (Mesma tarefa registrada nos ROADMAPs do Lecionário e Scriptorium.)

- [x] **Scroll to top na navegação** — RESOLVIDO (2026-08-22): confirmado
      que NÃO havia restauração — SPA preservava posição de scroll entre
      rotas (abrir obra vinda de catálogo rolado = página "carrega no
      meio", reclamação original do Rilson). Criado
      `web/src/components/ScrollToTop.tsx` (`useLocation` →
      `window.scrollTo(0,0)` a cada troca de pathname), montado dentro do
      `BrowserRouter` no `App.tsx`. Os scrolls manuais de paginação
      (ArtCategories/Search) permanecem inofensivos. (Mesmo bug da Bancada
      e Scriptorium — replicar lá.)
- [ ] **Descrições com markdown cru** — algumas obras têm `**negrito**` visível como texto. Verificar se `react-markdown` está aplicado em todas as rotas de detalhe de obra.

### 🟡 Melhoria — mobile e UX da página da obra (2026-08-22)

> Contexto do Rilson: maior parte dos usuários vem de mobile e não há app
> nativo — legibilidade, breakpoints bem feitos e visual fácil de seguir
> são prioridade. Princípio adotado: **corpo de texto nunca abaixo de
> 16px no mobile**; o que se reduziu foi o EXAGERO dos títulos, nunca o
> corpo.

- [~] **Responsividade mobile geral + escala tipográfica** — normalizada a
      escala em todas as páginas principais: hero/H1 de livro/capítulo
      `text-4xl md:text-6xl` → `text-3xl sm:text-4xl md:text-6xl`; H1s de
      página `text-3xl` → `text-2xl sm:text-3xl md:text-4xl`; H2s estáticos
      de 30px → escala progressiva; subtítulo do hero 20px→16px no base.
      **Legibilidade de corpo corrigida onde feria o princípio**: descrição
      da obra era `text-sm` (14px!) no mobile → `text-base`; texto das
      passagens bíblicas era `text-xs` (12px!) → `text-sm md:text-base`.
      Pendente: varredura final nas páginas secundárias com viewport real.
- [x] **Ampliação da obra no mobile sem layout próprio** — ArtworkLightbox
      reconstruído (2026-08-22): barra superior agora **empilha** no mobile
      (título truncado numa linha, toolbar na outra — acabou a disputa de
      pixel com o "menuzinho"; percentual de zoom some no mobile);
      **gestos touch reais**: pinch-zoom, pan com um dedo quando ampliado,
      duplo-toque alterna ajustado↔2x (`touch-none` entrega os gestos pros
      handlers em vez do navegador); paddings reservam topo e painel
      inferior pra imagem nunca ficar debaixo deles. Typecheck + 22/22
      testes passando.
- [x] **Badges de licença chamando atenção demais** — "Domínio Público"
      estava em VERDE esmeralda e "Licenciado" em âmbar na página da obra:
      metadado tratado como CTA. Ambos agora neutros com tokens do tema
      (`text-muted-foreground border-border bg-muted/50`) — adapta aos dois
      temas sem cor gritante.
- [x] **Botão ℹ️ da inspeção repetia informação** — mostrava exatamente
      título/artista/ano/licença que já estavam na barra de topo. Agora tem
      função própria: revela a **descrição da obra** em texto puro
      (`stripMarkdown()`, `line-clamp-4`) + atribuição; só cai pro rótulo
      clássico quando não há descrição (obras-stub). Atribuição permanece
      visível porque é obrigação de licença CC, não decoração.

### ❓ Pendência — modo claro/escuro à altura dos irmãos (2026-08-22)

- [ ] **Auditoria de paridade dark/light vs Lecionário e Gerador** —
      esclarecimento: o modo claro/escuro JÁ EXISTE aqui (next-themes +
      ThemeToggle no Header, padrão "system", Fase 2 concluída; contraste
      do hero e gradient-card no escuro já corrigidos com conta feita). A
      pendência real é outra: percorrer TODAS as páginas/componentes nos
      DOIS temas comparando com o padrão dos irmãos (Lecionário tem motor
      de 8 estações litúrgicas recolorindo o tema; Gerador tem tokens
      cs-* próprios por tema) — procurar elementos que só ficam bons num
      dos temas, estados de hover/foco esquecidos no escuro, e decidir se
      vale adotar tokens de marca crus (canela/dourado/vinho) em mais
      pontos hoje cobertos só pelos HSL genéricos.

### 🟡 Passada de padrão-indústria no mobile (2026-08-22, mesma sessão)

- [x] **Scroll ao navegar** — ver item do backlog 2026-08-21 acima:
      `ScrollToTop` criado e montado no router.
- [x] **Alvos de toque** — botões da toolbar do lightbox eram 32px
      (`h-8 w-8`), abaixo do mínimo de 44px (Apple HIG) / 48dp (Material):
      agora 40px no mobile, 32px preservado no desktop (`h-10 w-10
      sm:h-8 sm:w-8`) — a toolbar própria já ocupa linha exclusiva, então
      cabe sem aperto.
- [x] **Safe areas do iPhone (notch/home indicator)** — barra superior do
      lightbox respeita `env(safe-area-inset-top)` e painel inferior
      `env(safe-area-inset-bottom)` via `max()` com o padding normal.
- [x] **Zoom involuntário do iOS em inputs** — Safari dá zoom automático ao
      focar input com fonte <16px: `CommandInput` (⌘K) estava `text-sm`
      (14px) → `text-base md:text-sm`. O `Input` do shadcn e o campo de
      busca grande já estavam corretos.
- [x] **`prefers-reduced-motion`** — media query global no `index.css`
      anulando animações/transições pra quem pede menos movimento no
      sistema (acessibilidade, padrão da indústria).
- [x] **Viewport meta confirmada correta** (`width=device-width,
      initial-scale=1.0`).

### 🟡 Melhoria — identidade visual (2026-08-22)

- [x] **Emojis no lugar de lucide-react** — RESOLVIDO (2026-08-22), varredura
      completa: Header (📜→`ScrollText`, ✝️→`Cross`, 🔍→`Search`,
      🤝→`HeartHandshake`), CommandPalette (4 headings com emoji — removidos,
      o estilo do cmdk já hierarquiza) e ThemeToggle (✓→`Check`). Grep final
      de emojis em pages+components: **zero**.
- [ ] **Auditoria tipográfica vs Design Narniano** — nem todas as fontes do
      app conversam com a identidade ("algumas definitivamente não
      combinam"); revisar stack de fontes contra `Identidade visual geral.md`
      (vault, seção 1C) e consolidar tokens.

### 🟡 Melhoria — conteúdo (2026-08-22)

- [ ] **Conexões bíblicas mais evidentes** — nem sempre a ligação entre a
      pintura e a passagem fica clara na descrição; explicitar o porquê da
      conexão cena a cena (continuidade natural dos lotes de curadoria da
      Fase 1 — qualidade acima de quantidade nos próximos lotes).

### ❓ Questão em aberto — vozes dos clássicos nas descrições (2026-08-22)

- [ ] **Cabe citar Rookmaaker, Schaeffer e C.S. Lewis comentando obras
      específicas dentro das descrições delas?** (levado pelo Rilson como
      questão aberta, não decisão). Onde um desses autores opinou sobre uma
      obra que já está no catálogo, trazer a opinião pra descrição —
      profundidade alinhada à missão. Pontos a pesar antes de decidir:
      1. **Fonte verificada**: só entra opinião textualmente confirmada nos
         livros deles (o vault já tem notas de vários: *A arte não precisa
         de justificativa*, *Filosofia e Estética*, *O dom criativo*,
         *A arte e a Bíblia*...) — nada de paráfrase travestida de citação.
      2. **Copyright dos próprios autores** (ironia não perdida aqui):
         Rookmaaker (†1977 → protegido até 2047), Schaeffer (†1984 → 2054),
         Lewis (†1963 → 2033). Trecho breve com fonte e fim de crítica/
         discussão cabe na exceção de citação da LDA art. 46, VIII; bloco
         extenso exigiria autorização de editora (Ultimato, Hagnos etc.).
         Definir limite de extensão ANTES de escrever a primeira.
      3. **Escopo real**: mapear primeiro quais obras do catálogo têm
         comentário documentado (Rookmaaker estudou Rembrandt a fundo;
         Schaeffer discute obras pontuais em *Art and the Bible*) —
         provavelmente conjunto pequeno e precioso, curadoria de
         profundidade, não escala.
      4. **Forma**: seção própria na página da obra ("Na leitura de...")
         vs. integrado à descrição — decidir com exemplos reais na mão.

### 🟢 Features de produto (candidatas à Fase 5 — 2026-08-22)

- [x] **Botão de doação** como o do Lecionário — **feito (2026-08-22)**:
      Pix estático (BR Code EMV) com a chave `biblianaarte@narniano.com`,
      mesmo padrão do Lecionário copiado 1:1 (`src/lib/pix.ts` — geração
      do payload + CRC16 — e `src/components/apoiar/PixDonationCard.tsx`
      — QR + copiar código), com 6 testes (`pix.test.ts`, mesmos vetores
      do Lecionário). Integrado na página `/contribuir`, seção "Apoie o
      Projeto". Sem valor fixo: quem doa escolhe quanto. Verificado:
      tsc limpo, 28/28 testes passando (22 + 6 novos), build ok.
      Coerente com a estratégia já registrada na Fase 5 (apoio direto
      combina mais que ads).
- [ ] **Botão de copiar imagem** na página da obra.
- [ ] **Botão de copiar descrição** no bloco "Sobre a Obra" — mesmo padrão
      dos versículos e outros dados copiáveis do Lecionário.
- [ ] **Exportar Story do Instagram** — imagem + metadados da obra +
      logo/nome do projeto na fonte certa, tudo seguindo o design; mesmo
      padrão já validado no Gerador C.S. Lewis e no Teste Político.
      Sinergia direta com @artecristadiaria (seção Distribuição abaixo):
      material altamente compartilhável gerado do próprio catálogo.

---

## Distribuição e Marketing (2026-08-22)

### Bloqueio anterior a qualquer push: auditoria de copyright

- 🔴 Item crítico acima. **Não divulgar antes de resolver** — obra contestada viralizando vira print e derruba a credibilidade do site inteiro (mesma lógica do item 0 do plano do Teste Político)

### A sinergia principal: @artecristadiaria (manual pronto no Obsidian)

- O manual (`12 - Redes sociais/@artecristadiaria.md`) **é** a estratégia de distribuição deste site: museu devocional digital, Obra do Dia, carrossel de detalhes, reels de zoom contemplativo
- Cada post liga à página da obra aqui no site (as descrições reais escritas em 16/08 são exatamente a legenda desses posts) → Instagram alimenta o site, o site dá profundidade ao Instagram

### Pinterest (segunda frente)

- Arte sacra performa muito bem e o pin vive anos — tráfego composto; pins linkando as páginas das obras

### SEO em curso

- Sitemap 2.115 URLs + GSC verificados (2026-08-14); monitorar indexação semanal
- Cauda longa: "[passagem] arte", "quadros sobre [tema bíblico]", "arte sacra domínio público"

### Monetização (destrava após auditoria)

- **Limite de saque é por CONTA, não por site** (esclarecido ao Rilson em
  2026-08-22): todos os sites cadastrados despejam no mesmo saldo único
  de US$ 100. Cadastrar o subdomínio separadamente separa apenas
  RELATÓRIOS (quanto cada projeto rende), nunca o pagamento. Fragmentar
  só ocorreria com contas AdSense distintas por projeto — evitar.
- AdSense + Amazon Associates (livros de arte sacra) — planejados desde a
  concepção; o bloqueio de copyright **foi removido em 2026-08-22**
  (auditoria concluída, ver 🔴 acima)
- **Passos do AdSense (2026-08-22, Rilson iniciou o cadastro) — código
  concluído no mesmo dia:**
  1. **Não é obrigatório cadastrar o subdomínio — e na prática JÁ ESTÁ
     cadastrado** (2026-08-22): ao tentar adicionar, o AdSense respondeu
     "você já adicionou esse site" — subdomínios da raiz verificada são
     associados automaticamente. Confirmar em Sites buscando
     "biblianaarte". NUNCA cadastrar `biblianaarte.com`, domínio que o
     Rilson não possui (mesmo achado do mailto removido 2026-08-14)
  2. [x] **`ads.txt`** — a raiz `narniano.com/ads.txt` já cobre todos os
     subdomínios (spec IAB), mas duplicamos em `web/public/ads.txt`
     deste subdomínio também por robustez (mesma linha de publisher-ID)
     — antes `/ads.txt` aqui caía no fallback do SPA e servia
     `index.html` com 200, o que não ajudava o crawler.
  3. [x] **Página de Política de Privacidade** — `/privacidade`
     (`src/pages/Privacy.tsx`), mencionando cookies de anúncios,
     AdSense, doação via Pix e direitos LGPD; linkada no rodapé.
  4. [x] **Script + tag + CSP** — `<meta name="google-adsense-account">`
     + loader `adsbygoogle.js` (client `ca-pub-5482566824255473`) no
     `index.html`; `nginx.conf` CSP liberado pros domínios do Google
     (script/frame/img/connect-src — cada anúncio roda em iframe
     isolado com seu próprio CSP, então isso só libera carregar o
     iframe, não o script-src de dentro dele); um único slot
     (`AdUnit.tsx`, ad-slot `4884773751`) na página de obra, numa
     quebra natural de conteúdo (depois das referências bíblicas, antes
     de "Obras Relacionadas") — nunca dentro do texto de
     descrição/citação, pra não brigar com a experiência contemplativa.
     Verificado: tsc limpo, 28/28 testes passando, build ok.
  5. Amazon Associates: cadastro separado, sem bloqueio técnico
