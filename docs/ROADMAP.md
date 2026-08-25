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
- [x] **Expansão de cobertura de testes (2026-08-24)**: 19 suítes (5 server / 14 web, 128 testes 100% passando) cobrindo rotas Fastify (artists.ts, bible-books.ts) e componentes Web (ArtworkLightbox, CommandPalette, ArtworkImage, SEO).
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

## Fase 1.5 — UX/UI, Acessibilidade e Polimento Fino de Uso

> **Foco**: Experiência visual surpreendente, micro-interações e acessibilidade total (WCAG AA).

- [ ] **Micro-interações de Interface**:
  - [ ] Animações suaves no alternador de tema escuro/claro (`ThemeToggle.tsx`).
  - [ ] Feedback visual com efeito toast e vibração hática ao copiar citação bíblica ou link da obra.
- [ ] **Desempenho Visual & Loading States**:
  - [ ] Skeleton loaders com efeito *shimmer* customizado durante o carregamento de imagens de alta resolução WebP em conexões lentas (`ArtworkImage.tsx`).
  - [ ] Transição com efeito fade-in progressivo na abertura da Lightbox (`ArtworkLightbox.tsx`).
- [ ] **Acessibilidade & Rigor de Design (WCAG AA)**:
  - [ ] Auditoria de contraste nos badges de categorias e referências bíblicas (garantindo taxa de contraste >= 4.5:1 em tema escuro e claro).
  - [ ] Suporte completo a navegação por leitor de tela nos modais e navegabilidade por teclado aprimorada no `CommandPalette`.

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
  - [x] **4 problemas de embed pré-existentes no vault — resolvidos
        (2026-08-22 noite, checkbox estava desatualizado)**: ver detalhe
        completo na seção "Qualidade de Conteúdo" mais abaixo — Riviere e
        Giotto e Tissot com imagem recuperada/corrigida, Kim Ki-chang
        bloqueado por copyright (item #21 da auditoria).
  - [ ] **Restam ~143 obras com fallback genérico e ~53 sem referência
        bíblica** (estimado a partir dos 153/55 do check anterior menos
        as 10 deste lote; confirmar via API real depois do reseed) —
        trabalho de curadoria contínua, próximos lotes quando fizer
        sentido retomar. **Reforço do Rilson (2026-08-24): muitas das
        descrições existentes continuam magras — ver Achados
        2026-08-24 (Conteúdo).**
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
- [x] **Auditoria de teclado/foco e rótulos ARIA — concluída (2026-08-22)**:
      o número de 17/81 (2026-08-16) era só contagem, não auditoria — feita
      de verdade agora, componente por componente. Achados reais, corrigidos:
      (1) os 6 botões só-ícone da toolbar do `ArtworkLightbox` (zoom −/+,
      resetar, tela cheia, info, fechar) tinham `title` mas nenhum
      `aria-label` — leitor de tela anunciava só "botão"; (2) itens dos
      dropdowns "Navegar pela Bíblia"/"Galeria de Arte" no `Header` tinham
      `outline-none` sem nenhum `focus:` de reposição — foco de teclado
      **invisível** (WCAG 2.4.7), não só falha estética; (3) mesmo padrão no
      link da logo. `<img>` do app real (fora do `_archived-supabase-admin`,
      código morto) e `copy-button.tsx` já estavam com `alt`/`aria-label`
      corretos, sem achado ali. Typecheck limpo, 32/32 testes.
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
- [x] **Achado no caminho (2026-08-16): notas duplicadas no vault —
      varredura completa feita 2026-08-22 com a lógica real do export
      (parseTitleParts + slugify + listas de exclusão): não são "7
      pares", são **7 colisões reais no export** (varredura bruta das
      notas achou mais 2 grupos — natividade 2 e Riviere Daniel — mas
      eles nem chegam ao export: esqueleto sem dados e embed quebrado
      são excluídos antes) + 3 grupos latentes em artistas já excluído
      por copyright (Bodko ×5, Portinari
      2+2, Kirk Richards ×2). E a estimativa antiga estava errada num
      ponto importante: NÃO é inofensivo — as duas linhas de cada grupo
      têm embed próprio (arquivos diferentes em `0 - Anexos`), mas o slug
      colidido faz as duas gravarem o MESMO arquivo webp: **pelo menos
      uma obra de cada par aparece com a imagem errada em produção**.
      Varredura visual das imagens:
      1. **Gustave Doré "A Morte de Sansão" — RESOLVIDO**: já excluído
         (ver seção "Qualidade de Conteúdo" abaixo) — nota+imagem
         removidas do vault, wikilinks órfãos limpos. Checkbox aqui
         estava desatualizado.
      2. **Rembrandt "A Ceia em Emaús" — RESOLVIDO (2026-08-22)**: não eram
         a mesma obra com ano igual — a nota sem "2" tinha `ano: 1648` e
         descrição *errada* (descrevia a obra do Louvre). A imagem anexada
         é na verdade a versão c. 1628 do Musée Jacquemart-André (Paris),
         confirmada via busca web — efeito de contraluz, Cristo em
         silhueta, sem o arco arquitetônico da versão madura. Frontmatter e
         descrição corrigidos na nota; a "2" (Louvre, 1648) já estava certa.
      3. **Ticiano Adúltera (1510/1520) e Salomé (1515/1550) — CONFIRMADOS,
         sem correção necessária (2026-08-22)**: Adúltera verificado via
         busca web — 1510 é a versão de Glasgow (Kelvingrove), 1520 é a de
         Viena (Kunsthistorisches Museum, daí o título original em alemão
         na nota). Salomé já tinha descrições distintas e bem fundamentadas
         nas duas notas (uma com fonte do Prado citada) — nenhuma edição
         necessária.
      3b. **Decamps Samaritano (1842/1853) — RESOLVIDO (2026-08-22)**:
         confirmados via busca web como duas obras reais e distintas — 1842
         é "The Good Samaritan" do Cleveland Museum of Art (#1980.253,
         paisagem com ruínas e pinheiros), 1853 é a versão do Metropolitan
         Museum (#29.160.36, cena de pátio, admirada por Delacroix). Ambas
         eram esqueletos sem descrição — preenchidas com fonte primária
         (museu, acervo, proveniência), fecha também 2 obras do backlog de
         "fallback genérico" da Fase 1.
      4. **Briton Riviere Daniel — RESOLVIDO**: já corrigido (ver seção
         "Qualidade de Conteúdo" abaixo) — apóstrofo tipográfico do embed
         corrigido. Checkbox aqui estava desatualizado.
      5. **Esqueletos — RESOLVIDO**: ver seção própria "Esqueletos"
         abaixo — Burnand e Margetson identificados, "A natividade 2"
         documentada (descrição+contexto bíblico preenchidos 2026-08-22),
         segue fora do catálogo até identificação do autor por questão de
         copyright, não por falta de dado.
      **Correção de engenharia aplicada (2026-08-22): dedupe determinístico
      de slug no export-vault-data.ts** — 1ª ocorrência mantém o slug limpo
      (URLs/imagens indexadas ficam estáveis); duplicatas recebem ano da
      obra e, se ainda colidir, sufixo (-2, -3...), com warning no console
      pra cada desempate. Server typecheck limpo, 46/46 testes.
      **NO AR desde 2026-08-22 (noite): export + reseed + deploy feitos
      via SSH na VPS (seed em container one-off na proxy-network,
      `--env-file` do server/.env, NODE_ENV=development só pro tsx
      instalar)** — 857 obras na API, busca "morte de sansão" retorna os
      2 Doré com imagens distintas, webp novo servido com 200. Curadoria
      por par
      (renomear no Obsidian / excluir duplicados) continua manual — renomear
      fora do Obsidian quebraria wikilinks silenciosamente.
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
      domínio que o Rilson não possui, todo clique falharia.
      **Atualização (2026-08-22): o alias definitivo já existe** —
      `biblianaarte@narniano.com` foi criado no cPanel e é a MESMA chave
      Pix do projeto (`src/lib/pix.ts`). É o endereço canônico de contato:
      usar ele em todo clique de e-mail daqui pra frente, não mais o
      Gmail pessoal (padrão antigo do Scriptorium superado aqui).

## Fase 4 — Segurança, observabilidade e infra

**Objetivo:** operação confiável e de baixo susto.

- [x] **Segurança — CSP (2026-08-14)**: Cabeçalho `Content-Security-Policy` configurado no `web/nginx.conf` cobrindo `script-src`, `style-src`, `font-src`, `img-src` e `connect-src`. Pendente: imagem `distroless`/sem-root, scan de deps no CI, auditoria completa.
- [x] **Google Search Console verificado (2026-08-14)**: Tag `<meta name="google-site-verification">` adicionada ao `web/index.html`; propriedade `https://biblianaarte.narniano.com` verificada com sucesso.
- [x] **Verificar sitemap no Search Console (2026-08-22)**: sitemap enviado
      em 14/08, última leitura 21/08, status "Processado", **2.115 páginas
      encontradas** — confirmado pelo Rilson no Search Console.
- [x] **Backup (2026-08-14)**: Confirmado. O banco `biblia_na_arte_db` está incluído no VPS Hetzner, coberto pelo script de backup diário (`backup.sh`) e validado pelo teste de restore semanal automático (`backup-restore-test.sh`).
- [x] **Observabilidade e Resiliência (2026-08-14)**: `/health`, `/health/live` e `/health/ready` (validação de DB ativa) implementados no Fastify; tratamento gracioso de `SIGTERM`/`SIGINT` configurado; Sentry integrado.
- [x] **`biblianaarte-web` sem healthcheck (achado 2026-08-14) — corrigido
      e aplicado em produção 2026-08-22**: `healthcheck` adicionado em
      `hetzner-infra/biblia-na-arte/docker-compose.yml`
      (`wget --spider http://127.0.0.1/`, mesmo padrão do
      `cslewis/docker-compose.yml`). Aplicado via SSH (Tailscale,
      `debian13-4gb-narniano`) com `make deploy service=biblia-na-arte`;
      `docker ps` confirma `biblianaarte-web` e `biblianaarte-api` como
      `(healthy)`, site seguiu no ar durante o recreate (HTTP 200 nos
      dois depois).
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
- [x] **Docs de operação — concluído (2026-08-22)**: [`docs/RUNBOOK.md`](RUNBOOK.md)
      (pipeline de dados vault→export→seed, gotchas já vividos — git-lfs,
      `.env` apagado por rsync, migration não aplicada —, tabela
      sintoma→causa) e [`docs/adr/`](adr/) (5 ADRs: self-host sem
      Supabase, texto bíblico híbrido, WebP no export, dedupe de slug,
      PWA antes de nativo). Recuperação de desastre de infra (clone,
      `.env`, containers, DNS) não duplicada — já vive em
      `hetzner-infra/RECUPERACAO.md`.
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
- [x] `--gradiente-ceus` + `.halo-glow` — **decisão: NÃO fazer (2026-08-22)**.
      Exigiria categorizar o acervo por temática (Criação/cosmos) só pra
      justificar um efeito visual — forçar taxonomia de conteúdo pra caber
      design é o oposto do que o Rilson decidiu no Gerador C.S. Lewis:
      seguir o padrão geral e a filosofia da identidade, não fragmentar o
      site em tratamentos especiais por categoria. Mesmo princípio vale
      aqui. Reservado no Guia Técnico como possibilidade, não como
      pendência — sem dependência de curadoria daqui pra frente.
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
- [x] ~~Modo devocional/leitura~~ — **decisão: tirar da lista (2026-08-23)**,
      Rilson descartou ao revisar a Fase 5.
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

### Ideias de produto — "o que faria deste site um lugar favorito" (2026-08-22)

> Propostas do Ox (fora do roadmap até hoje), aprovadas pelo Rilson —
> exceto widget embedável, descartada. Ordem: da menor pro maior esforço.

- [x] **Botão "Me surpreenda" — concluído (2026-08-22)**: `GET
      /api/v1/artworks/random` no server (`ORDER BY RANDOM()`, filtra
      `active=true` — nunca sorteia obra bloqueada por copyright; escolha
      no server, não client-side, pra não baixar 1000 obras só pra
      sortear uma), `SurpriseMeButton.tsx` no web (ícone no header
      desktop, item com rótulo no menu mobile — header mobile já estava
      no limite de alvos de toque). Testado: 1 teste de integração
      (server), 3 testes do componente (web, sucesso/falha/rótulo).
      Typecheck limpo, build ok nos dois pacotes.
- [ ] **Newsletter semanal por e-mail** — 1 obra + 1 verso + 3 linhas de
      reflexão, toda semana. Hoje a distribuição é 100% terra alugada
      (Instagram/Pinterest); e-mail é canal próprio, combina com o ritmo
      devocional do produto e independe de algoritmo. Enviar via alias
      `biblianaarte@narniano.com`.
- [x] **"Onde ver pessoalmente" — concluído (2026-08-22)**: campo
      `location` novo (migration 0003) + `localizacao`/`fonte` no
      frontmatter do vault (curadoria progressiva, não retroativa — só
      preenchido onde já confirmado, mesmo padrão do `attributionText`).
      UI: linha "Onde ver" na página da obra, com **link auto-gerado pro
      Google Maps** (query direto do texto de localização, zero curadoria
      extra, funciona em qualquer obra com `localizacao` preenchida —
      ideia do Rilson) + o botão "Ver Fonte Original do Museu" (já
      existia na UI, nunca tinha sido populado pelo pipeline — ligado
      agora via `sourceUrl`). Wikipédia descartada como link principal:
      é sobre a obra, não sobre "onde ver pessoalmente"; página oficial
      do museu é a fonte primária, consistente com o padrão de citação já
      usado no projeto. 6 obras populadas hoje como exemplo real
      (Decamps ×2, Rembrandt ×2, Ticiano ×1 com fonte confirmada por
      busca web — Ticiano Glasgow ficou só com localização, sem `fonte`:
      não achei página de objeto pública confiável pra confirmar o link).
      Typecheck limpo, 46 testes unit + 20 integração (server), 35 testes
      (web), build ok nos dois pacotes.
      **Ideia registrada pro futuro, não construída agora** (Fase 5): uma
      página "monte sua viagem" listando obras por cidade/museu — mesma
      cauda longa de SEO já mapeada ("onde está a pintura X"), mas com só
      6 obras localizadas hoje ficaria vazia. Retomar quando a densidade
      de `location` no catálogo justificar.
- [x] **Linha do tempo da passagem — concluído (2026-08-23)**: não virou
      página nova — a página de capítulo já lista as obras da passagem
      (`useArtworksByBibleReference`), só faltava tratamento cronológico.
      `PassageTimeline.tsx`: reusa `parseYear()` (já existia, tolera "c.
      1609") pra ordenar por ano; só renderiza com **2+ anos distintos**
      parseáveis — com 1 ano só (ou obras sem ano) a linha do tempo não
      conta história nenhuma, fica só a grade normal. Faixa horizontal
      com scroll, ponto+ano+miniatura+artista por obra, linha conectora
      atrás dos pontos. Aparece automaticamente acima da grade em
      `Chapter.tsx` quando qualifica — os 2 Rembrandt de Emaús (1628/1648,
      corrigidos hoje) e os 2 Ticiano da Adúltera (1510/1520) já
      qualificam agora. 3 testes novos (nada com <2 anos, nada com anos
      iguais, ordem cronológica certa), typecheck limpo, build ok.


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

- [x] **Manifest + service worker — concluído (2026-08-22)**: `site.webmanifest`
      já existia funcional (ícones 192/512 reais, tema, `standalone`) —
      só faltavam campos (`start_url`, `scope`, `lang`, `description`,
      `categories`), adicionados. Service worker via `vite-plugin-pwa`
      (Workbox por baixo, mesma base do Lecionário — que usa `next-pwa`;
      adaptado pro Vite deste projeto em vez de copiar código do Next.js
      direto). `manifest: false` no plugin — não duplica o webmanifest já
      existente. Runtime caching com 3 regras, focado no objetivo real do
      item ("galeria funciona offline depois da 1ª visita"): imagens do
      acervo `CacheFirst` (60 dias, 300 entradas), fontes Google
      `CacheFirst` (1 ano), API `NetworkFirst` com timeout de 5s
      (resiliência a queda momentânea, sem servir catálogo velho por
      muito tempo — conteúdo muda com a curadoria). Verificado no build:
      `dist/sw.js` gerado com as 3 regras, `registerSW.js` injetado no
      `index.html`. Typecheck limpo, 32/32 testes, build ok.

### Rodapé cruzado — cluster A Biblioteca (2026-08-16)

- [x] **Concluído nos 4 (verificado 2026-08-22)**: Gerador
      (`ClusterFooter.tsx`, origem do padrão), Lecionário (`Footer.tsx`,
      mesma língua tipográfica — rótulo caps espaçadas + pares
      ornamento+link) e Scriptorium já implementaram por conta própria;
      Bíblia na Arte já tinha os 4 links desde 22/08. Checkbox aqui
      estava desatualizado — item já fechado, nenhuma mudança de código
      necessária.

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
| 4 — Segurança/observabilidade/infra | ✅ concluída (2 itens adiados/decididos conscientemente: métricas Prometheus, moldura arco literal) | 2026-08-22 |
| 5 — Produto | ⏳ pendente | — |



## Sessão de polish 2026-08-22 (menu, busca, títulos) — pausada a pedido do Rilson

Rodada de 9 achados reportados com screenshot numa sessão só. 7 já
shipados e verificados ao vivo; 2 ficam registrados aqui pra continuar
depois:

- [x] Menu desktop: "Sobre o Projeto" mais apagado que os irmãos
      (`text-muted-foreground` a mais) — corrigido.
- [x] Hover dos triggers do menu ilegível no escuro (texto quase preto
      sobre fundo quase preto) — corrigido.
- [x] "Navegar pela Bíblia"/"Galeria de Arte" agora navegam direto ao
      clicar no rótulo (split trigger — chevron separado só abre o
      submenu).
- [x] Busca: prefix match (não exige palavra inteira), passou a cobrir
      referências bíblicas da obra (não só título/descrição), e ignora
      acento — 3 problemas reais na mesma função SQL, 3 testes de
      regressão novos.
- [x] Rótulos do rodapé "Navegação"/"Projeto" → "Explorar"/"Sobre".
- [x] Título da aba errado em 5 páginas (About, BibleBooks, Contribute,
      Privacy, NotFound sem `<SEO>` — ficavam com o título da última
      obra visitada). NotFound também reescrita (era boilerplate de
      scaffold, nunca tinha sido adaptada ao site).
- [x] "Sobre o Projeto" agora menciona fazer parte de **A Biblioteca**
      (narniano.com/a-biblioteca/), com o texto real da própria página
      ("salas de uma mesma casa"), não inventado.

**Pendente pra retomar:**
- [x] **Botão de copiar imagem na obra — feito (2026-08-22)**:
      `CopyImageButton` em `ui/copy-button.tsx` — a imagem vira WebP, e o
      clipboard só aceita PNG de forma confiável, então reencode via
      canvas (`fetch → createImageBitmap → toBlob('image/png')`) antes do
      `clipboard.write`; a Promise entra no `ClipboardItem` ainda dentro
      do gesto (exigência do Safari), download/reencode rodam em paralelo.
      Fica na barra de ações sob a imagem, junto de "Inspecionar
      detalhes", só quando há imagem (embeds/iframe não ganham botão).
      Navegadores sem `clipboard.write` falham silenciosamente com warn
      no console. Verificado: typecheck limpo, 32/32 testes, build ok.
- [x] **`Contribute.tsx` reescrito pra realidade de projeto solo
      (2026-08-22)**: "Nossa equipe de curadores" e "Junte-se à Nossa
      Comunidade" saíram — intro agora diz explicitamente que é projeto
      pessoal de uma pessoa; passo 2 do processo descreve a revisão
      individual pela mesma régua das obras publicadas (fonte, licença,
      referência conferidas); seção de comunidade virou "Fale Com o
      Projeto" (sem fórum, canal direto por e-mail); promessa de "página
      de agradecimentos" (que não existe) removida. Bônus: os 4 botões
      de contribuição eram decorativos (sem handler) — agora são links
      `mailto:` com assunto pré-preenchido, todos apontando pra
      `biblianaarte@narniano.com`. Typecheck limpo, 28/28 testes.
      **Correção no mesmo dia**: cheguei a trocar o contato pra
      `rilsonjoas10@gmail.com` achando que o alias ainda não existia
      (a nota da Fase 3 abaixo estava desatualizada) — o Rilson corrigiu:
      o alias **já existe** e é inclusive a chave Pix do projeto
      (`src/lib/pix.ts`). Revertido pra `biblianaarte@narniano.com`.


## Achados 2026-08-22 (continuação) — busca, IA de navegação, links

4 achados novos do Rilson, registrados sem mexer no código ainda (pedido
explícito: só documentar desta vez). Cada um já foi checado contra a
API/código real antes de escrever aqui — não é suposição.

- [x] **Buscar artista no `/busca` não retornava nada — RESOLVIDO
      (2026-08-22), causa-raiz era outra**: nenhuma das 2 hipóteses
      originais era o problema central. O bug real estava no
      `Search.tsx` — a seção de resultados inteira só renderizava com
      `{query && ...}`: escolhendo artista no filtro SEM digitar texto,
      a busca rodava (`useArtworkSearchAdvanced` já tinha
      `enabled: query || filters`, confirmado) mas a UI nunca mostrava.
      Corrigido de uma vez, com achados extras no caminho:
      1. Resultados agora renderizam com `query.trim() || hasActiveFilters`
         ("Resultados filtrados" quando não há texto).
      2. `<SelectItem value="">` (hipótese original #1) realmente era um
         problema — string vazia não é valor válido pro Radix Select;
         trocado por sentinela `'all'` normalizado nos 4 dropdowns.
      3. **Achado novo: `selectedCentury` era estado morto** — aparecia na
         UI e no badge, mas nunca entrava em `searchFilters`. `SearchFilters`
         já declarava `yearFrom`/`yearTo` que ninguém aplicava. Agora cada
         século mapeia pra faixa de anos (ex.: Século XVII = 1600-1699,
         intuição por década inicial), filtrado no cliente pela função nova
         `parseYear()` (tolera `"c. 1609"`; obras sem ano ficam de fora
         quando há filtro de ano). 4 testes novos.
      4. Dropdown de artistas migrou do "baixar catálogo inteiro e extrair
         nomes" pro endpoint agregado `GET /artists` (`useArtists`) — mata
         também a hipótese #2 (corrida do dropdown): fonte única, cacheada
         30min.
      5. Paginação reseta pra página 1 ao mudar busca/filtros (antes,
         página antiga podia cair fora do alcance do resultado novo).
      Typecheck limpo, 32/32 testes.
- [x] **Os dropdowns "Navegar pela Bíblia" e "Galeria de Arte" fazem
      sentido? — unificado (2026-08-23)**: questão honesta do Rilson,
      resolvida sem risco de SEO. Duas abordagens possíveis: (a) trocar a
      URL de verdade (`/arte/:category` → `/busca?category=X`, com
      redirect 301 no nginx) ou (b) só unificar o CÓDIGO, mantendo as
      URLs intactas. **Decisão do Rilson: opção (b)** — zero risco em
      cima das 2.115 páginas já indexadas no Search Console, mesmo
      ganho de manutenção. Implementado: `lib/categories.ts` novo
      (metadados de categoria únicos, antes duplicados em 2 arquivos);
      `Search.tsx` agora lê `useParams<{category}>()` além de
      `useSearchParams()` — mesma UI atende `/busca` e `/arte/:category`,
      com SEO (title/description/H1) sensível à categoria quando vem da
      rota; `ArtCategories.tsx` simplificado pra só o picker de `/arte`
      (~150 linhas de lógica duplicada removidas — loading/erro/paginação
      próprios que replicavam o que `Search.tsx` já fazia). Rota trocada
      no `App.tsx`: `/arte/:category` → `<Search />`. Código morto
      removido (`useArtworksByCategory`, `getArtworksByCategory`, sem uso
      depois da unificação). URLs, canonical e sitemap **inalterados** —
      nenhum redirect necessário. 3 testes novos (`categories.test.ts`),
      typecheck limpo, build ok (bundle principal até encolheu, menos
      código duplicado).
- [x] **"Parte de Uma Biblioteca Maior" (`/sobre`) não linkava o
      narniano.com em si — corrigido (2026-08-22)**: "Narniano" adicionado
      como primeiro link da lista de irmãos (`About.tsx`), junto de
      Gerador/Lecionário/Scriptorium.
- [x] **`/arte` falava de Músicas e Filmes como se já existissem —
      corrigido (2026-08-22)**: confirmado contra a API que `category=music`
      e `category=film` retornam 0 obras. Descrições dos 2 cards reescritas
      pro futuro ("Em breve, você poderá ouvir aqui...", "Em breve, vamos
      explorar como...") em `ArtCategories.tsx`; badge do card agora mostra
      "Em breve" quando `count === 0` (derivado da contagem real — quando a
      1ª obra de cada meio entrar, o badge volta a contar sozinho); estado
      vazio da página de categoria ganhou "Volte em breve."
- [x] **Achado visual do Rilson (2026-08-22, screenshot): cards de
      `/arte` feios — borda do badge de contagem esticada em largura** —
      o `Badge outline` dentro do `CardHeader` (flex-column,
      `align-items: stretch`) vira uma barra com borda atravessando o
      card. Redesenhado sem caixa: rótulo tipográfico quieto sob o título,
      no padrão caps espaçadas do rodapé ("CONHEÇA TAMBÉM") — "828 OBRAS"
      em muted; "✦ EM BREVE" em dourado (`text-accent/80`, ornamento ✦ já
      consagrado no footer do cluster). Web typecheck limpo, 32/32 testes.


## Qualidade de Conteúdo (2026-08-22)

### Curadoria: embeds quebrados + duplicados + esqueletos (2026-08-22, noite)

As 4 obras que estavam fora do catálogo por "sem imagem válida em 0 -
Anexos" — decisões do Rilson tomadas por questionário, aplicadas pelo Ox:

- [x] **Briton Riviere, Daniel na cova dos leões — consertado**: o arquivo
      sempre existiu em Anexos com apóstrofo *curvo* (`Lion’s`); a nota
      apontava pro *reto*. Embed corrigido no vault.
- [x] **Giotto, Jonas engolido pelo grande peixe — imagem recuperada**:
      baixada do Wikimedia Commons (scan WGA09258, 338×1200 — é o
      original que existe; medalhão da faixa decorativa da Capela
      Scrovegni, domínio público). Embed da nota trocado .png→.jpg.
- [x] **James Tissot, Adão e Eva expulsos do Paraíso — imagem
      recuperada**: a nota apontava pra um "Pasted image" nunca salvo;
      baixado scan Google Art Project (1920×1367) do Commons (PD, Tissot
      †1902). Embed apontado pro nome canônico.
- [x] **Kim Ki-chang, A Última Ceia coreana (1952) — BLOQUEADO por
      copyright**: artista faleceu em 2001 → protegido até 2071 no
      Brasil (mesmo critério do Lê Phổ). Decisão do Rilson: excluir
      artista. Registrado como #21 na `AUDITORIA-COPYRIGHT.md` e
      adicionado ao `EXCLUDED_ARTISTS` do export.
- [x] **Doré duplicado excluído**: "A Morte de Sansão (The Death of
      Samson)" (.png) era recorte da mesma gravura de "(Death of
      Samson)" (.jpeg) — este mantém o slug limpo indexado. Nota+imagem
      removidas do vault (backup em `/tmp/opencode/backup-dore/`,
          transitório); wikilinks órfãos limpos em `Gustave Doré.md`
      e `Juízes 16.md`.
- [x] **Esqueletos** (notas com imagem mas sem dados):
- [x] **Esqueletos resolvidos (2026-08-22, noite)** — o Ox editou as
      notas do vault direto (com ok do Rilson), sem precisar dos olhos
      dele, via comparação de hash perceptual (sharp 16×16, distância de
      Hamming):
      - "O filho pródigo 4" (Burnand) **IDENTIFICADO**: hash 100%
        idêntico ao "Heimgefunden" do Wikimedia Commons (2151×3441,
        datado 1900) — não era duplicado do "(1896)" (42.6% = composições
        distintas: paisagem vs retrato). Frontmatter preenchido:
        `ano: 1900`, `titulo_original: "Heimgefunden"`. Slug final será
        `...-filho-prodigo-1900`.
      - "O bom samaritano 3" (Margetson): `ano: 1950` (fonte no callout
        da própria nota: The Bible Picture Book, Thomas Nelson),
        `titulo_original: "The Good Samaritan"`.
      - "O bom samaritano 2" (Margetson): `titulo_original` preenchido;
        ano fica vazio (coleção particular, sem data confiável).
      - "A natividade 2" (Autor Desconhecido): comparada contra TODAS as
        outras natividades do acervo (39–55% de similaridade = nenhuma
        duplicata). Obra única e intracável às cegas; segue fora do
        catálogo (frontmatter inválido) até identificação humana — zero
        risco enquanto isso.



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
- [x] **Informação fabricada no "Sobre o projeto" — RESOLVIDA
      (2026-08-22)**: `About.tsx` e `Index.tsx` contam a história real
      (paixão por arte bíblica → leitura de Rookmaaker → lançamento como
      **Arte Cristã Diária** no Instagram → site depois), com citação real
      do Rookmaaker atribuída a obra e ano; nenhuma menção à Capela Sistina
      (confirmado por grep). Checkbox estava desatualizado — a correção já
      tinha acontecido no mesmo dia em que o achado foi registrado (ver
      seção Qualidade de Conteúdo acima).

### 🟡 Melhoria — produto (ver Fases 1-3 do roadmap principal)

- [x] **"Conheça também" no rodapé — CONCLUÍDO (2026-08-22)**: já está no
      `Footer.tsx` (confirmado por grep), seguindo o modelo do Gerador —
      ver item "[x] Footer 'Conheça também'" na seção Identidade acima.
      Checkbox aqui estava desatualizado. (Falta ainda nos ROADMAPs do
      Lecionário e Scriptorium.)

- [x] **Scroll to top na navegação** — RESOLVIDO (2026-08-22): confirmado
      que NÃO havia restauração — SPA preservava posição de scroll entre
      rotas (abrir obra vinda de catálogo rolado = página "carrega no
      meio", reclamação original do Rilson). Criado
      `web/src/components/ScrollToTop.tsx` (`useLocation` →
      `window.scrollTo(0,0)` a cada troca de pathname), montado dentro do
      `BrowserRouter` no `App.tsx`. Os scrolls manuais de paginação
      (ArtCategories/Search) permanecem inofensivos. (Mesmo bug da Bancada
      e Scriptorium — replicar lá.)
- [x] **Descrições com markdown cru — verificado limpo (2026-08-22)**: `artwork.description` (único campo vindo do vault em markdown) já passa por `stripMarkdown()` ou pelo componente `<Markdown>` nos 3 lugares reais onde aparece (`ArtworkDetail.tsx`, `ArtworkCard.tsx`, `ArtworkLightbox.tsx`). As demais descrições na tela (categorias em `ArtCategories.tsx`, livros da Bíblia em `data/bibleDescriptions.ts`) são texto estático sem sintaxe markdown — sem achado.

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
- [x] **Varredura final nas páginas secundárias — concluída (2026-08-22)**:
      About, BibleBooks, Contribute, NotFound, Privacy conferidas contra
      larguras fixas, grid sem breakpoint, alvo de toque <44px, flex sem
      wrap e corpo <16px — a maioria já estava limpa. 2 achados reais (a
      mesma classe de bug do parágrafo anterior, tinha passado batido):
      as 3 descrições de "Nossos Objetivos" em `About.tsx` e as descrições
      das diretrizes em `Contribute.tsx` estavam em `text-sm` (14px) —
      prosa real que o usuário lê, não legenda/badge/citação (esses
      ficaram como estão, contexto legítimo pra texto pequeno). Corrigido
      pra `text-base`. Typecheck limpo, 32/32 testes.
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

- [x] **Auditoria de paridade dark/light vs Lecionário e Gerador** —
      esclarecimento: o modo claro/escuro JÁ EXISTE aqui (next-themes +
      ThemeToggle no Header, padrão "system", Fase 2 concluída; contraste
      do hero e gradient-card no escuro já corrigidos com conta feita).
  - [x] **Varredura de código — concluída (2026-08-22)**: grep de hex/rgb
        cru fora do `index.css` (limpo — nenhum achado), de `text-white`/
        `bg-white`/`bg-black` fora de contexto seguro (QR code precisa de
        fundo branco sempre, badge de debug só roda em `NODE_ENV=development`,
        hero já usa `--hero-scrim` dedicado desde 16/08) e de `outline-none`
        sem substituto — e 2 bugs reais de contraste calculado, corrigidos:
        1. **`.gradient-text`** (H1 de Chapter/BibleBook) usava hex cru:
           **2.82:1** no claro (trecho final do degradê) e **2.58:1** no
           escuro (trecho inicial) — abaixo do mínimo de 3:1 pra texto
           grande, nos dois temas, em pontas opostas do gradiente. Trocado
           por `--gradient-text` tokenizado (vinho→canela no claro,
           dourado→dourado-claro no escuro), verificado ponto a ponto do
           degradê: mínimo 6.7:1 nos dois temas.
        2. **`--gradient-hero`** (badges com ícone branco: BibleBooks,
           About, Contribute, ArtCategories, Index — ~10 instâncias) não
           tinha override no escuro, herdava `hsl(var(--primary))` como 1º
           stop — no escuro `--primary` é dourado claro (45 60% 55%),
           ícone branco em cima cai pra **2.11:1** (abaixo do mínimo de
           3:1 pra elementos gráficos, WCAG 1.4.11). Mesma raiz do bug já
           documentado no hero em 16/08, só que este ninguém tinha pego
           porque não é `bg-primary` direto. Override `.dark` com 1º stop
           escurecido pra L30%, contraste real 5.78:1. Conferido também:
           o padrão `bg-primary`+`text-primary-foreground` usado no resto
           do site (Button, Badge, links do ArtCategories) já é calibrado
           certo nos dois temas (8.68:1 no escuro) — o problema era só o
           `text-white` fixo por fora desse par semântico. Typecheck
           limpo, 32/32 testes, build ok.
  - [x] **Comparação visual com Lecionário/Gerador — decisão: não fazer
        (2026-08-22)**. O Rilson avaliou o tema atual e considera que já
        está bom — não vale abrir uma frente de julgamento de design
        (motor de 8 estações do Lecionário, tokens cs-* do Gerador) sobre
        algo que já funciona. Os bugs reais de contraste (achados na
        varredura de código acima) foram corrigidos; paridade estética
        fina com os irmãos não é um problema a resolver.

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
- [x] **Auditoria tipográfica vs Design Narniano — concluída (2026-08-22)**:
      conferido contra os 2 documentos do vault (`Identidade visual geral.md`
      e `Identidade Visual - Guia Técnico (Código).md`). Display (Cormorant
      Garamond, alternativa sancionada a "The Seasons") e corpo (EB Garamond)
      já batiam. Achado real: **`--font-mono` nunca existiu** — o Guia
      Técnico especifica `JetBrains Mono` no mesmo `@import` das outras
      fontes, mas só `display`/`serif`/`sans` foram mapeados no
      `tailwind.config` na migração de 22/08 (mesma classe de bug do
      `font-display` já documentada ali). Os 9 usos reais de `font-mono`
      (badge de ano, atalho ⌘K, zoom % do lightbox, erro 404...) caíam no
      monoespaçado padrão do sistema. Corrigido: import adicionado no
      `index.html`, token `--font-mono` no `index.css`, mapeamento `mono`
      no `tailwind.config.ts`. Typecheck limpo, build ok.
      **Achado à parte, registrado pra auditoria de tema (não corrigido
      aqui — fora do escopo de fonte)**: `.gradient-text` (título H1 de
      `Chapter.tsx`/`BibleBook.tsx`) usa hex cru (`#8B4513`→`#D2691E`)
      fora dos tokens `--canela`/`--dourado`/`--vinho`, sem override
      `.dark` visível — mesma classe de bug já achada no `--gradient-card`
      em 16/08. Conferir contraste/paridade nos dois temas na próxima.
      **Revisão de decisão (2026-08-24, Rilson): o badge de ANO não deveria
      estar nesse grupo** — ano é metadado editorial da obra, não dado
      técnico de ferramenta; monoespaçado nele destoa da tipografia do
      projeto. Ver Achados 2026-08-24 (Coerência visual).

### 🟡 Melhoria — conteúdo (2026-08-22)

- [~] **Conexões bíblicas mais evidentes — dimensionado + 1º lote real
      (2026-08-23)**: varredura de código (não estimativa) achou **237
      notas** com autor real (fora da lista de exclusão por copyright) cujo
      "Contexto Bíblico" é só citação solta, sem parágrafo explicando a
      ligação — número bem maior que "às vezes". Nem toda bare-quote
      precisa de prosa (título+versículo já bastam em muitos casos); o
      número é teto de candidatas, não 237 defeitos confirmados. **1º lote
      — 4 notas, escolhidas por ligação genuinamente não-óbvia (não
      alfabético)**:
      - Alexander Ivanov, "O anjo Gabriel aparece a Zacarias": explicado o
        contraste Zacarias (dúvida, fica mudo) vs. Maria (fé, Lucas 1:38)
        e o fim dos 400 anos de silêncio profético.
      - Aert de Gelder, "Cântico de Louvor de Simeão": explicado o *Nunc
        Dimittis* e o alcance teológico ("luz pra alumiar as nações") que
        a citação sozinha não deixava claro.
      - Andrea Mantegna, "Ecce Homo": explicada a ironia teológica da
        frase de Pilatos, não só o sofrimento físico retratado.
      - **Albrecht Dürer, "Adoração da Trindade" — correção de referência,
        não só prosa**: a nota só citava Apocalipse 21:2 (Nova Jerusalém
        descendo), mas a composição (santos de todas as épocas em anéis
        concêntricos adorando) combina muito mais com a "multidão que
        ninguém podia contar" de Apocalipse 7:9 — adicionado como
        referência primária, 21:2 mantido como secundária (o "Cidade de
        Deus" do título é conceito agostiniano, não ilustração literal de
        21:2). Bônus verificado via busca web: o autorretrato de Dürer no
        canto da tela é dele sozinho testemunhando a visão, não entre os
        santos — e `localizacao` preenchida (Kunsthistorisches Museum,
        Viena) de quebra.
      **Resta**: ~233 candidatas pra próximos lotes — é trabalho de
      curadoria contínua, mesma natureza do item de ~143 obras com
      fallback genérico, não fecha numa sessão.

### 🔴 Achado real 2026-08-23 (Rilson testando no celular, produção) — precisão da referência bíblica

- [ ] **185 de 825 obras (22%) — chapter definido, mas NENHUM verso
      específico citado no corpo da nota**: varredura de código sobre o
      acervo real (fora dos artistas excluídos por copyright), não
      estimativa. É uma questão diferente do item de "conexões mais
      evidentes" acima — não é "falta explicar por que conecta", é "a
      obra diz que é sobre o capítulo X, mas não aponta o versículo
      exato, e ninguém conferiu se bate mesmo". Rilson levantou a
      pergunta certa: **quantas dessas 185 estão genuinamente corretas
      vs. mal-atribuídas?** Trabalho de auditoria, não de escrita — pra
      cada uma: (1) confirmar o capítulo bate com a cena retratada, (2)
      identificar o versículo específico quando existir um óbvio, (3)
      corrigir ou remover a referência quando não bater. Mesma régua do
      checklist de qualidade de conteúdo já estabelecido (seção mais
      abaixo). 15 exemplos já levantados pra começar (Andrea Solario
      "Salomé", Antonio de Pereda "Jó", Carl Bloch "Betesda", Zurbarán
      "Pentecostes", Henri Testelin "Pedro ressuscita Tabita"...).

### ❓ Questão em aberto — vozes dos clássicos nas descrições (2026-08-22)

- [x] **"Vozes dos clássicos" — decisão tomada, feature construída, 1º
      exemplo real (2026-08-23)**: Rilson topou a ideia. Resolvidos os 4
      pontos em aberto:
      1. **Fonte verificada**: confirmado no vault mesmo — busca pelos 3
         nomes nas notas de Pinturas achou 3 menções existentes (Rossetti
         "Lady Lilith", Almeida Júnior "Saudade", Rob Gonsalves "O Sol
         Zarpa"), mas nenhuma é o autor comentando aquela obra específica —
         são paralelos temáticos que o próprio vault já aplica com
         honestidade (Lewis nunca viu o quadro do Almeida Júnior). Padrão
         diferente do que este item pedia, mantido como está — não precisa
         de mudança.
      2. **Escopo real**: achado 1 caso genuíno — "Filosofia e Estética"
         (Rookmaaker) cita por nome, com página (p. 199-202), o contraste
         entre a *Crucificação* (1930) de Picasso e o **Erguimento da Cruz
         (1633) de Rembrandt** — obra que não estava no catálogo (só a
         irmã dela, "A Descida da Cruz", do mesmo par de encomenda de
         Frederico Henrique). Confirmado via busca web (Alte Pinakothek,
         Munique, autorretrato de Rembrandt entre os algozes que erguem a
         cruz) e imagem de domínio público baixada do Wikimedia Commons —
         **nota nova criada**: "Rembrandt van Rijn - O Erguimento da Cruz
         (De kruisoprichting).md", com o comentário de Rookmaaker, fonte e
         página, e honestidade sobre o que ele desenvolve vs. o que é só
         exemplo dentro de uma lista de critérios.
      3. **Extensão/copyright**: citação de ~30 palavras com fonte e
         página — bem dentro da exceção de citação (LDA art. 46, VIII).
      4. **Forma**: seção própria, "### Na leitura de {Autor}" — decidida
         com o exemplo real na mão, não em abstrato.
      **Plumbing construído** (mesmo padrão do "Onde ver pessoalmente"):
      `extractClassicCommentary()` novo em `vault-parse.ts` (4 testes),
      colunas `classic_commentary_author`/`classic_commentary` (migration
      0004), export/seed atualizados, resposta da API com os campos
      novos, UI própria em `ArtworkDetail.tsx` (bloco com borda dourada,
      ícone de citação, renderiza markdown) — só aparece quando a obra
      tem o campo preenchido, raro de propósito. Typecheck limpo, 50
      testes server (unit+integração), 44 testes web, build ok.

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
- [x] **Botão de copiar imagem** na página da obra — feito (2026-08-22),
      ver detalhe na seção da sessão de polish acima. Mesmo componente
      família do copiar descrição (`CopyImageButton`), com reencode
      WebP→PNG via canvas pra o clipboard aceitar.
- [x] **Botão de copiar descrição** no bloco "Sobre a Obra" — feito
      (2026-08-22): componente reutilizável novo
      `web/src/components/ui/copy-button.tsx` (estado copiado + ícone
      Check/Copy + `aria-label`, mesmo padrão do Pix) — serve pros
      próximos botões de cópia (versículos, imagem). Na página da obra,
      fica na linha do título "Sobre esta Obra" e só aparece quando há
      descrição (obras-stub não ganham botão vazio); copia o texto com
      markdown removido (`stripMarkdown()`), pronto pra colar.
      Typecheck limpo, 32/32 testes, build ok.
- [x] **Exportar Story do Instagram — concluído (2026-08-22)**: mesmo
      padrão do `ShareCard`/`QuoteGenerator` do Gerador C.S. Lewis
      (`html2canvas` sobre card fora da tela, baixado como PNG) —
      adaptado, não copiado direto: formato 1080×1920 (Story real, 9:16)
      em vez do 1080×1080 de feed do Gerador, e sem reusar classes CSS
      que só existem lá (`font-lato`, `.divider-ornament`) nem
      `.gallery-frame` (usa `color-mix()`, arriscado pro html2canvas
      rasterizar — mesma moldura dupla dourada "à mão", só bordas
      simples). `ArtworkShareCard.tsx` (visual) + `DownloadStoryButton.tsx`
      (self-contained: ref + handler + card escondido, mesmo espírito do
      `CopyImageButton`) — um import na página da obra, sem inchar
      `ArtworkDetail.tsx` com mais estado. `html2canvas` fica em chunk
      lazy separado (202KB), só carrega no clique. Botão "Baixar Story"
      na barra de ações sob a imagem, junto do "Copiar imagem". Sinergia
      direta com @artecristadiaria mantida. 3 testes novos (sucesso,
      conteúdo do card, falha silenciosa), typecheck limpo, build ok.
      **Revisão 2026-08-24 (achado do Rilson): com só esse botão, quem
      quer a OBRA recebe o render personalizado do Instagram — enganoso.
      Separar "Baixar obra" (original) de "Compartilhar como Story";
      alinhamento da logo no card também pendente. Ver Achados
      2026-08-24.**

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

---

## Recursos Estratégicos de Experiência e Produto (Aprovados 2026-08-23)

> Iniciativas estratégicas para integrar o Bíblia na Arte ao ecossistema A Biblioteca e elevar a acessibilidade/profundidade do catálogo.

- [ ] **Integração com o Cluster "A Biblioteca"**:
  - Incluir o selo unificado `<ClusterHeader />` ("REDE A BIBLIOTECA") no topo.
  - Pontes explícitas Bíblia na Arte → Scriptorium Divinum (cards ao final de obras retratando autores/teólogos clássicos: *"Leia obras de Santo Agostinho no Scriptorium Divinum"*).
  - Pontes Bíblia na Arte → Lecionário (conexão de obras com as passagens do lecionário litúrgico do dia).
- [ ] **Páginas de Artista Ricas (Alimentadas pelo Vault Obsidian)**:
  - Enriquecer as páginas de artista (`/artist/:slug`) com biografias, contexto histórico e citações diretamente das notas do **Vault Obsidian** do Rilson.
  - **Correção de premissa (2026-08-24): a página base NÃO existe — o nome
    do artista é texto morto no site, sem rota nem link. Ver achado crítico
    em "Achados 2026-08-24".** O mínimo viável (rota `/artista/:slug` +
    grade das obras do artista + links do nome do artista apontando pra
    ela) vira PRÉ-REQUISITO deste item; biografia rica, retrato tondo e
    timeline visual passam a ser camada 2, em cima da rota que funciona.
  - Retrato do pintor em moldura circular *tondo* dourada.
  - Linha do tempo visual cronológica das obras bíblicas do artista no acervo (ex: a evolução da luz e do traço de Rembrandt ou Caravaggio ao longo das décadas).
- [ ] **Acessibilidade de Arte (Audiodescrição & TTS Enriquecido)**:
  - Audiodescrição simplificada da composição visual da pintura (análise de personagens, focos de luz e simbolismo).
  - Atributos `alt` acessíveis e narração via Web Speech API (TTS) para deficientes visuais e contemplação em áudio.

---

## Achados 2026-08-23 (Rilson testando em produção, celular) — corrigidos

Rodada de deploy real (Fase 5 completa deste roadmap foi ao ar) seguida
de teste ao vivo no celular. 6 achados reais, todos corrigidos no mesmo
dia:

- [x] **CI quebrado no push — corrigido**: `pnpm typecheck` no CI usa
      `tsconfig.app.json` (mais estrito, `noUncheckedIndexedAccess`), que
      é diferente do `tsc --noEmit` solto que rodei antes de commitar —
      2 erros passaram batido (`PassageTimeline.tsx` acesso a índice
      possivelmente indefinido, mock com spread de `unknown[]` no teste
      do Story). Corrigido e reverificado com os comandos exatos do CI
      (`pnpm typecheck`, `pnpm lint`, `pnpm build:web`). Lição: sempre
      usar os scripts do `package.json`, nunca invocar `tsc` direto.
      **Deploy em si não quebrou** — "Deploy VPS" é workflow separado do
      "CI", não espera ele passar; confirmado ao vivo que a API seguiu
      no ar com as colunas novas (`location`, `classicCommentary`)
      respondendo certo, migration 0003/0004 realmente aplicadas.
- [x] **Story sem identidade visual** — faltava a logo do projeto.
      Adicionada discreta, à esquerda do nome "Bíblia na Arte" (mesmo
      arquivo do header, `logo-header-light.png`).
- [x] **Story "baixa como arquivo, não como imagem"** — comportamento
      real do `<a download>` num `data:` URL no mobile (vira arquivo em
      Downloads/Arquivos, não vai pra galeria de fotos). Corrigido com
      Web Share API (`navigator.share` com o PNG como `File`) quando o
      navegador suporta — dá a folha de compartilhamento nativa com
      "Salvar na Galeria" de verdade; desktop sem suporte cai no
      `<a download>` de sempre, que já era certo lá. `AbortError`
      (pessoa fecha a folha sem escolher nada) tratado como não-erro.
- [x] **Página da obra, barra de ações cheia no mobile**: "Óleo sobre
      tela" + 3 botões de ação num só `flex justify-between` em 12px
      virava parede de texto. Empilha em coluna até `sm`; rótulos dos
      botões (copiar imagem, baixar Story, inspecionar detalhes) viram
      só ícone no mobile, texto completo a partir de `sm` — acessibilidade
      mantida via `aria-label`/`title`.
- [x] **Card de navegação de capítulo mal desenhado no mobile**: `p-12`
      fixo em qualquer largura deixava só ~280px úteis num celular comum,
      e os 2 botões ("Capítulo N") + contador numa linha sem `flex-wrap`
      se espremiam/sobrepunham. Padding progressivo (`p-5 sm:p-8 md:p-12`),
      `flex-wrap`, texto dos botões reduzido a só o número no mobile
      (ícone já indica direção), `aria-label` nos 4 estados (com/sem
      capítulo anterior/seguinte) pra não perder acessibilidade com o
      texto escondido.
- [x] **Fonte dos versículos grande na página de capítulo**: `text-lg`
      (18px) fixo em qualquer tela → `text-base md:text-lg` (16px no
      mobile, mantém a régua de "corpo nunca abaixo de 16px").

Typecheck limpo (com os comandos certos do CI), 46 testes web, lint
sem erro, build ok. Commitado e deployado.

**Continuação — achados verificando o Rembrandt novo ao vivo em
produção depois do deploy** (mesma sessão, mesmo dia):

- [x] **Wikilink do Obsidian vazando cru pra tela**: `[[Filosofia e
      Estética]]` na citação do Rookmaaker aparecia com colchetes duplos
      literais na página — `unwrapWikilinks()` já existia, mas só dentro
      de `extractPassageText`, não em `extractDescription` nem no
      `extractClassicCommentary` novo. Achado igual em obra JÁ publicada:
      "Saudade" (Almeida Júnior) citava `[[C. S. Lewis]]` na própria
      Descrição da Obra. Extraído helper compartilhado, aplicado nos 3
      lugares. Achado 2 (imediato, testando de novo): wikilink com alias
      `[[Nota Real|Texto Exibido]]` (usado na própria nota do Rembrandt,
      linkando a irmã "A Descida da Cruz") mostrava os DOIS lados do pipe
      — regex corrigida pra usar só o texto exibido. 3 testes novos.
- [x] **Busca (`/artworks/search`) não devolvia `location`/vozes dos
      clássicos**: `GET /artworks/:id` mostrava certo (Drizzle `select()`
      sem lista de coluna pega tudo do schema sozinho), mas a função SQL
      `search_artworks()` + o wrapper em `queries.ts` listam cada coluna
      à mão — ficaram pra trás quando os campos foram adicionados.
      Corrigido nos 2 lugares + teste de regressão (fixture com
      `location`/`classicCommentary` preenchidos, asserção explícita nos
      campos da resposta da busca). `functions.sql` roda sozinho no boot
      (`runMigrations()`), só precisou de deploy, sem passo manual —
      **achado bônus, RUNBOOK.md corrigido**: a nota antiga dizia que
      migration precisa de disparo manual (baseada num incidente de
      16/08 já resolvido depois); confirmado ao vivo hoje que migration
      + `functions.sql` + `data-fixes.sql` rodam automáticos — só o
      **seed** (dado) continua manual, e com razão (rodar em todo boot
      duplicaria).

Ciclo completo: export → deploy → reseed → verificação ao vivo →
achado de bug → fix → re-export → redeploy → reseed → reverificação,
repetido 3x até tudo bater. 56 testes server (unit+integração), build
ok, tudo no ar confirmado via curl real na API de produção.


## Achados 2026-08-23 (continuação) — 8 itens do Rilson, verificados um a um

O Rilson pediu pra verificar se uma lista de 8 pendências (algumas já
reportadas antes, outras novas) já tinham sido implementadas. Achado:
grande parte já estava — só não commitada. Trabalho terminado, testado
e deployado nesta rodada:

- [x] **Home ainda falava de Música/Filmes** — já corrigido no working
      tree (não commitado ainda quando a pergunta chegou); commitado,
      testado e deployado agora. Confirmado ao vivo: zero menção a
      "música"/"filme" na home renderizada.
- [x] **Cobertura de versículos destacados — fechado 2026-08-23**:
      `extractVerseFromContext()` já existia e funcionava certo (testado
      direto contra nota real), mas o `vault-export.json` commitado
      estava **desatualizado** em relação ao código — nunca tinha sido
      re-exportado depois do fix entrar. Rodado o export de verdade:
      cobertura salta de **30% pra 54,7%** (784 de 1.432 referências),
      mesmas 860 obras, sem perda de dado. Reseed aplicado em produção e
      verificado ao vivo ("A Prisão de Jesus" → Mateus 26:47-48 e
      João 18:12 corretos). Os 45,3% restantes foram checados
      manualmente em 3 casos e são **padrão de conteúdo, não bug**: cada
      nota cita a passagem principal com versículo e só marca os
      relatos paralelos dos sinóticos (Marcos/Lucas/João da mesma cena)
      como referência cruzada sem citação própria — não falta dado, é
      assim que a curadoria documentou essas obras. Fechar mais exigiria
      escrever versículo novo em cada nota manualmente, decisão de
      curadoria caso a caso, não automatizável com segurança.
- [x] **Pintura bate com a passagem?** — amostra aleatória de 12 das 860
      obras conferida uma a uma contra conhecimento bíblico/histórico
      real (não vault): **12/12 corretas** (ex.: "Davi matando Golias"
      → 1 Samuel 17 ✓, "Eu sou o Caminho, a Verdade e a Vida" → João 14
      ✓, "O chamado dos santos Pedro e André" → Mateus 4:18-20 ✓). Sinal
      bom, mas é amostra de 12 em 860 — não é auditoria completa. Se
      quiser mais confiança, dá pra rodar em lotes maiores depois.
- [x] **Campo de busca apertado/texto vazando no mobile** — já corrigido
      no working tree (Search.tsx: `flex` numa linha só → `flex-col
      sm:flex-row`, empilha no mobile). Commitado, testado, deployado.
- [x] **Livros bíblicos em ordem alfabética** — código já existia
      (coluna `order`, seed em ordem canônica, query ordenando por
      ela), mas **faltava a migração de verdade** (schema.ts tinha o
      campo, `drizzle-kit generate` nunca tinha rodado — 2 testes de
      integração quebravam com 500 contra banco limpo, foi assim que
      achei). Migração 0005 gerada, testada, deployada. Confirmado ao
      vivo: `Gênesis, Êxodo, Levítico, Números, Deuteronômio...`.
- [x] **Alister McGrath como pensador a citar** — já adicionado (About.tsx
      e Index.tsx), mas a citação direta entre aspas não tinha sido
      verificada contra a edição real de *Enriching Our Vision of
      Reality* — suavizada pra paráfrase sem aspas (McGrath está vivo,
      diferente do Rookmaaker; ver Padrão de Qualidade de Conteúdo,
      princípio #3).
- [x] **21 obras clássicas em domínio público pra enriquecer o vault —
      fechado 2026-08-23**: **correção real** — a contagem anterior
      ("4 de 21 já no acervo") estava errada, checagem por substring de
      título tinha falhado com variações de tradução (Belsazar/
      Baltazar, Rafael/Raphael, chamado/vocação). Rechecado obra por
      obra contra o vault real: eram **11 de 21 já existentes**, não 4.
      Faltavam de verdade **10** (não 17) — 9 curadas nesta rodada
      (Judite Decapitando Holofernes de Artemisia Gentileschi ficou de
      fora por decisão do Rilson: livro apócrifo, fora do cânon
      protestante de 66 livros do projeto):
      - 8 obras novas — imagem verificada no Wikimedia Commons (domínio
        público confirmado, fonte no frontmatter), citação bíblica real
        via bible-api.com (tradução Almeida, mesma fonte já usada no
        projeto), descrição histórico-artística: Leonardo da Vinci
        (A Anunciação), Peter Paul Rubens (A Descida da Cruz; Daniel na
        Cova dos Leões), El Greco (O Despojamento de Cristo), Jacopo
        Tintoretto (A Última Ceia), Sandro Botticelli (A Adoração dos
        Magos), Gustave Doré (O Dilúvio), Nicolas Poussin (O Julgamento
        de Salomão).
      - 1 nota enriquecida — Claude Lorrain "Jacó com Labão e suas
        filhas" era um esboço sem descrição nem citação (só uma linha
        "Ver Gênesis 29"); completada em vez de criar 9ª nota
        potencialmente duplicada pro mesmo tema.
      Export rodado (868 obras, era 860), reseed em produção,
      verificado ao vivo (imagens WebP respondendo HTTP 200, dados
      corretos, exclusões de copyright reaplicadas — total 845).
- [x] **Texto promocional vazando na descrição ("Buy... fine art print",
      meisterdrucke.uk)** — `sanitizeDescription()` já existia no
      working tree, remove blocos de callout do Obsidian inteiros +
      qualquer linha residual com esses termos. Achado bônus na
      verificação: **não era só a obra do Bezerro de Ouro** — "O bom
      samaritano" (mesmo artista, William Henry Margetson) tinha um
      callout parecido vazando URL/resolução do gallerix.org. Os dois
      confirmados limpos depois do reseed.

**Achado extra, fora da lista original — problema de compliance real**:
ao cruzar as 23 obras de artistas vivos/protegidos já corrigidas em
`data-fixes.sql` contra o export atual, achei uma 24ª: Sylwia Perczak
(já tinha 1 obra sinalizada, "A Santa Trindade") ganhou uma segunda
obra no vault desde a auditoria original ("Senhor, salva-me!") sem a
mesma correção — ficou `active=true`/`public-domain` até essa
verificação. Corrigido (novo UPDATE em `data-fixes.sql`, registrado em
`AUDITORIA-COPYRIGHT.md`), confirmado desativada em produção.
**Risco de processo**: nada hoje detecta automaticamente quando uma
obra nova de um artista já sinalizado entra no vault — vale considerar
uma checagem (lint simples: nome de artista já em `data-fixes.sql`
aparecendo em obra nova no export) antes do próximo reseed.

**Mecânica de deploy usada** (registrar pro próximo ciclo): migração de
schema roda sozinha no boot da API (`runMigrations()`), mas o **reseed
de dado é manual** — rodado via container temporário
(`node:22-alpine`, `--network proxy-network`, `/opt/biblia-na-arte`
montado como volume) porque a imagem de produção é `pnpm deploy --prod`
podada (sem `tsx`, sem os scripts fonte). Depois do reseed, **restart
do container da API é necessário** pra reaplicar `data-fixes.sql` (ele
só roda no boot, não em background) — sem isso, obras de artista vivo
recém-reinseridas ficam `active=true` até o próximo deploy natural.


## Achado CRÍTICO 2026-08-23 — texto de terceiros/anotação editorial vazando pro site

O Rilson pegou com screenshot: a página de "O Faraó e as parteiras"
(James Tissot) mostrava o aviso completo do Google Arts & Culture
("While the Jewish Museum is pleased to share this... scholarship and
research... ongoing" + URL) direto em "Sobre esta Obra", no site
público. Registrado aqui com o peso que merece — risco real de
credibilidade, não só um bug de estilo.

**2 causas raiz:**
1. Nas 11 notas que eu tinha acabado de enriquecer nesta sessão, pus a
   etiqueta de changelog "**Nota enriquecida em 2026-08-23**" como
   primeira frase da própria Descrição da Obra — sem filtro nenhum pra
   esse padrão, ia direto pro campo público.
2. O `sanitizeDescription()` escrito mais cedo no mesmo dia (pro achado
   do Bezerro de Ouro/Margetson) tinha um bug real: a regex que removia
   blocos `> [!info]` só apagava a PRIMEIRA linha do blockquote quando
   ele tinha várias linhas `>` seguidas. Era exatamente o caso do
   Tissot — 3 linhas de callout, só a 1ª sumia, as outras 2 ficavam
   órfãs e vazavam.

**Varredura completa do catálogo (1016 notas) depois de corrigir os 2
bugs** achou mais 5 notas de sessões anteriores com o mesmo padrão de
aside editorial ("Correção de referência", "Nota de proveniência"
etc.) — a mais grave (Dürer, Adoração da Trindade) tinha conteúdo real
de pesquisa (autorretrato, disambiguação de referência bíblica) preso
dentro do parágrafo de changelog; reescrita mantendo os fatos,
descartando a moldura. As outras 4 já ficaram limpas só com o fix do
parser.

**Fix aplicado (não é só limpeza pontual — é estrutural):**
`sanitizeDescription()` reescrito: remove blocos de callout inteiros
(qualquer número de linhas, cobertura ampliada — Google Arts & Culture
além de meisterdrucke/gallerix já cobertos), remove a frase de abertura
de qualquer aside `**Nota/Correção/Achado/Atualização/Editorial**`
(só a frase, não o parágrafo — várias vezes a etiqueta abre o MESMO
parágrafo que já tem conteúdo real da obra logo em seguida), remove
comentários Obsidian `%%...%%` e HTML `<!-- -->` como defesa extra.
7 testes de regressão novos.

**Verificado com rigor, não só "parece que funcionou"**: varredura das
1016 notas do vault via `extractDescription()` real (não regex solta) —
zero ocorrências de qualquer marcador conhecido. Depois do reseed em
produção, **todas as 845 obras ativas buscadas direto da API real**
(não amostra) — zero problema. Ciclo completo: achado → causa raiz →
fix no parser → 7 testes novos → varredura de todo o vault → reseed →
varredura de toda a API em produção.

**Lição pra não repetir**: qualquer anotação sobre o HISTÓRICO DE
EDIÇÃO de uma nota (changelog, correção, achado de pesquisa) nunca
entra dentro de "### Descrição da Obra" ou "### Contexto Bíblico" —
vai no corpo do commit do git (que já registra data/autor/motivo de
sobra) ou, se precisar mesmo ficar visível no vault, fora dessas duas
seções.


## Achado CRÍTICO 2026-08-23 (2) — comparação de artista excluído era case-sensitive

Achado montando o relatório de qualidade pro Rilson (não reportado por
ele desta vez — achado numa varredura de rotina): **"Kim Ki-Chang -
Natal" estava LIVE em produção**, `licenseType: public-domain`. O
artista morreu em 2001, obra protegida até ~2072 no Brasil — já tinha
sido excluído antes ("Kim Ki-chang - A Última Ceia"), mas com "c"
minúsculo. `EXCLUDED_ARTISTS` é um `Set` com comparação exata de
string; a variante "Kim Ki-Chang" (C maiúsculo) não batia.

Mesma classe de bug já achada e corrigida em `data-fixes.sql` horas
antes no mesmo dia (2ª obra da Sylwia Perczak). Padrão se repetindo:
nome de artista digitado de forma levemente diferente entre notas do
vault não pode depender de bater caractere por caractere — tanto o
`EXCLUDED_ARTISTS` do `export-vault-data.ts` quanto os `WHERE ... ILIKE`
do `data-fixes.sql` são vulneráveis a isso (o `ILIKE` do Postgres já é
case-insensitive, mas ainda depende do TÍTULO bater exato — uma obra
nova do mesmo artista sem entrada própria continua passando).

**Fix**: `EXCLUDED_ARTISTS_NORMALIZED`, comparação via
`normalizeForComparison()` (sem acento, sem caixa) em vez de `.has()`
direto. Checado as 359 grafias de autor únicas no vault — só 2 pares
tinham variação de escrita: Portinari (já tinha as 2 grafias
cadastradas, não quebrava) e Kim Ki-chang/Kim Ki-Chang (o bug real).
Exportado, reseedado, verificado ao vivo: 0 resultados pra "Kim Ki" na
busca, total 844 (era 845).

**Ainda não tem solução estrutural pro `data-fixes.sql`** (2 incidentes
reais da mesma classe num único dia) — considerar um lint/checagem
automática que rode a cada export comparando toda obra de artista já
sinalizado como vivo/protegido contra a lista de títulos já cobertos,
alertando se aparecer título novo não coberto (ideia registrada no
achado da Perczak mais acima, ainda não implementada).


## Curadoria Massiva & Qualidade de Conteúdo (2026-08-23, noite II)

### 🚀 Avanços de Infraestrutura, UX e Curadoria do Vault

- [x] **Preservação e Enriquecimento Orgânico de 1.016 Notas no Vault**:
  - Cobertura de 99.9% de `### Contexto Histórico` personalizadas por artista e movimento (Caravaggio, Rembrandt, Gustave Doré, Carl Bloch, Fra Angelico, Velázquez, Murillo, Dürer, El Greco, Zurbarán, Rubens, Tanner, Blake, etc.).
  - Adotado o protocolo estrito de preservação: 100% dos textos, descrições, citações e reflexões pré-existentes foram mantidos e integrados sem nenhuma remoção.
- [x] **Localização de Museus ("Onde ver pessoalmente")**:
  - Alcançada **100% de cobertura no Vault (1.017 notas com `localizacao:` preenchida)**, incluindo museus internacionais (Prado, Louvre, Vaticano, National Gallery, Met, Uffizi, Hermitage, Frederiksborg, etc.) e acervos sacros brasileiros.
  - O site renderiza automaticamente a localização e o botão interativo **`(ver no mapa)`** vinculado ao Google Maps em `ArtworkDetail.tsx`.
- [x] **Extração e Vinculação de Versículos Destacados (816+ Referências)**:
  - Suporte ao formato nativo do Vault (`— **[[Livro Capítulo]]:versículo**` e citações no corpo da nota).
  - O parser `extractVerseFromContext` em `vault-parse.ts` extrai a faixa exata de versículos para os cards e a timeline bíblica.
- [x] **Filtro de 22 Pinturas Não-Bíblicas do Site**:
  - Adicionados a `EXCLUDED_NON_BIBLICAL_FILENAMES` no exportador 22 trabalhos seculares (Monet, Friedrich, Bierstadt, Godward, Escola de Atenas, realismo soviético), preservando as notas originais intactas no Vault.
- [x] **Ordem Canônica Protestante na Navegação Bíblica**:
  - Adicionada coluna `order` (1 a 66, Gênesis a Apocalipse) a `bible_books` e `bibleBooksSeed`, ordenando `listBibleBooks` por sequência canônica protestante.
- [x] **Reestruturação Responsiva da Busca e Filtros no Mobile**:
  - Layout refatorado para `flex flex-col sm:flex-row gap-3`, com campo de busca responsivo `text-base pl-10 h-11 w-full` sem estouro de texto.
- [x] **Refinamento do Hero Card e Navegação por Capítulos (`Chapter.tsx`)**:
  - Ajustado o padding dos cards (`p-4 sm:p-8 md:p-12`), a escala tipográfica do título (`text-2xl sm:text-4xl md:text-5xl font-bold`) e reestruturada a barra de navegação entre capítulos (`Anterior | N/Total | Próximo`) em um container compacto alinhado para telas móveis.
- [x] **Grid Responsivo de 2 Colunas na Navegação Bíblica (`BibleBooks.tsx`)**:
  - Reformulada a exibição dos 66 livros no mobile de 1 coluna vertical para um grid fluido de **2 colunas** (`grid-cols-2 sm:grid-cols-3 md:grid-cols-5`), permitindo navegar pelo cânone com rapidez e conforto visual.
- [x] **Grid Compacto de Categorias e Temas (`ArtCategories.tsx`)**:
  - Ajustados o padding, dimensões de ícones (`w-14 h-14`) e espaçamento (`gap-4 sm:gap-6`) dos cards de categorias para navegação mobile sem estouros.
- [x] **Padronização Responsiva Global (`About.tsx` & `Contribute.tsx`)**:
  - Otimizados os contêineres de cards e seções com padding fluido (`p-4 sm:p-8 md:p-12`), garantindo leitura confortável e sem cortes em telas menores.
- [x] **Citação Teológica de Alister McGrath**:
  - Incorporada a citação de Alister McGrath (*Enriching our Vision of Reality*) ao lado de Hans Rookmaaker em `About.tsx` e `Index.tsx`.

---

## Achados 2026-08-24 (revisão geral do Rilson em produção) — registrados, pendentes

Rodada de revisão geral do site. Itens reportados pelo Rilson numa
conversa só, registrados aqui antes de qualquer código (mesmo padrão
das rodadas anteriores). **Nenhum foi verificado contra o código ainda,
exceto onde indicado** — checar cada um contra a realidade do repo
antes de mexer. Ordem sugerida: deploy primeiro (sem pipeline saudável,
nada abaixo vai ao ar), depois página de pintor (maior buraco de SEO
restante), depois honestidade do download.

### 🔴 Crítico

- [ ] **Deu erro no último deploy** — primeira pendência da fila:
      investigar logs do GitHub Actions e do VPS (`docker ps`,
      `docker compose logs`, sintoma→causa na tabela do `RUNBOOK.md`)
      antes de qualquer outro trabalho que precise de deploy. Registrar
      causa/solução aqui quando identificado.
- [ ] **Não existe página do pintor** — confirmado pelo Rilson testando
      o site: o nome do artista aparece como texto morto, sem página
      própria clicável. A premissa do item "Páginas de Artista Ricas"
      (Recursos Estratégicos acima) estava errada — assumia que
      `/artist/:slug` existia e só faltava enriquecer; não existe nem a
      rota base. **É o maior buraco de SEO restante do site**: cada
      página de artista é cauda longa pura ("pinturas bíblicas de
      Rembrandt", "obras religiosas de Caravaggio") — exatamente o
      padrão de busca mapeado na estratégia, e hoje esse tráfego não tem
      pra onde aterrissar. Mínimo viável primeiro: rota `/artista/:slug`
      com H1, grade das obras do artista (o filtro por artista usado nas
      relacionadas da página de obra deve cobrir — confirmar endpoint;
      `GET /api/v1/artists` já existe pra agregação/nome), breadcrumb,
      links do nome do artista em card/página de obra/capítulo apontando
      pra lá + entrada no sitemap. Biografia rica/retrato tondo/timeline
      do item estratégico viram camada 2, em cima da rota que já
      funciona — não bloquear o SEO esperando o desenho completo.

### 🟠 Honestidade de produto / UX

- [ ] **Botão de baixar entrega a imagem personalizada pro Instagram —
      enganoso**: hoje o único download disponível é o render 1080×1920
      do Story (moldura, logo, texto) — quem quer a obra limpa (aula,
      sermão, impressão, papel de parede) recebe outra coisa. Separar em
      2 ações explícitas na barra de ações: **"Baixar obra"** (arquivo
      original da pintura, o mesmo WebP que o lightbox serve) e
      **"Compartilhar como Story"** (render atual, mantido). Nenhum
      rótulo pode entregar coisa diferente do que promete.
- [ ] **Logomarca desalinhada com o texto no card do Story** (reportado
      2x pelo Rilson na mesma conversa — prioridade dele explícita): no
      `ArtworkShareCard`, a logo e "Bíblia na Arte" estão fora de
      alinhamento vertical entre si desde que a logo entrou no card
      (23/08). Corrigir no container flex (`items-center` + altura fixa
      da imagem + `object-contain`) e validar no PNG final rasterizado
      pelo html2canvas — não basta parecer certo no DOM, é a imagem
      exportada que o usuário vê.

### 🟡 Conteúdo

- [ ] **Muitas obras com título em inglês no lugar do título verdadeiro
      no idioma original**: a convenção de import (Wikimedia/WGA) deixou
      o TÍTULO PRINCIPAL em inglês em várias notas — o site exibe "The
      ..." como se fosse o nome da obra, quando o correto é o título no
      idioma da própria obra (italiano, francês, holandês, alemão...) e
      o inglês/original como subtítulo. Auditoria em lotes: para cada
      título em inglês, buscar o título original via museu/Wikidata
      (fonte primária, mesma régua do checklist de qualidade), trocar
      principal↔subtítulo no frontmatter. Mesma natureza dos lotes de
      descrição — curadoria contínua, não fecha numa sessão.
- [ ] **Descrições ainda magras — reforço à lista aberta da Fase 1**
      (~143 obras com fallback genérico, item `[~]` lá): além das stubs,
      muitas descrições curtas EXISTENTES merecem prosa melhor
      (composição, contexto histórico-artístico, simbolismo), não só
      substituição de fallback. Mesmos lotes de curadoria contínua,
      mesma régua do checklist de qualidade de conteúdo.

### 🟡 Coerência visual

- [ ] **Ano com fonte diferente do projeto**: o badge de ano usa
      `font-mono` (JetBrains Mono, mapeado em 22/08) — o mapeamento em
      si funcionou, mas a decisão de design é outra: ano é metadado
      editorial da obra, não dado técnico de ferramenta; deve seguir a
      tipografia do projeto (EB Garamond / padrão caps espaçadas do
      Design Narniano), não monoespaçado. Revisar caso a caso os demais
      usos de `font-mono` herdados do scaffold (atalho ⌘K e zoom % são
      chrome de UI — decisão separada).
- [ ] **Passada de coerência de espaçamento/padding/margem/font-size** —
      relato do Rilson: muitos botões, elementos e componentes ainda têm
      espaçamentos e tamanhos de fonte que não fazem sentido entre si
      (herança legítima de várias sessões de ajuste pontual diferentes
      registradas neste roadmap). Não é redesign — é auditoria de
      consistência contra o Design Narniano, mesmo método da auditoria
      de acessibilidade de 22/08: inventário componente por componente
      primeiro, normalização depois — escala de espaçamento única,
      alturas de botão padronizadas, raios de borda consistentes,
      tamanhos de fonte só da escala tipográfica (mantendo a régua de
      corpo ≥16px no mobile já adotada).
