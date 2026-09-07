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
- [x] **Incidente registrado e recuperado (2026-08-24): `export:vault`
      derrubou o catálogo de 837 para 482 obras (-355), já commitado e
      pushado** — achado indiretamente checando a pergunta do Rilson
      sobre contagem de pinturas (a nota do vault estava saudável, +12
      líquido; o problema era no repo de código). Commit
      `d50c58f3` ("update catalog export with latest Obsidian vault
      revisions") regenerou `vault-export.json` incompleto e deixou 194
      imagens LFS órfãs no disco local (rastreadas no git, ausentes no
      working tree) — produção não foi afetada (seguiu com 814 obras no
      ar, reseed nunca rodou com o export quebrado). Causa raiz: fix de
      `extractFrontmatter()` (`vault-parse.ts`) pra normalizar `\r\n`
      antes de casar o bloco `---` estava escrito mas **não commitado**
      quando o export anterior rodou — notas com final de linha CRLF
      (provável origem Windows/editor externo) falhavam o parse do
      frontmatter e caíam fora do export como se não tivessem dado
      válido. Re-rodado `export:vault` com o fix já em vigor: **841
      obras, 841 imagens, número bate** com o teto histórico (837 antes
      da quebra, ~857 no pico documentado em 22/08). Lição prática:
      commit do fix de parsing e commit do dado gerado por ele não podem
      ficar dessincronizados — rodar `export:vault` só depois de
      confirmar `git status` limpo em `src/lib/vault-parse.ts` (ou
      qualquer arquivo que o pipeline de parse dependa).

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


### Artistas cristãos independentes no acervo (2026-09-03)

> Ideia do Rilson: contatar artistas cristãos independentes para que a
> obra deles entre no site, com um formato de apresentação parecido com o
> das obras clássicas já curadas.

**Pergunta aberta que fundamenta a ideia:** o acervo hoje é 100% arte de
domínio público (curadoria clássica, ver `AUDITORIA-COPYRIGHT.md` — artista
moderno é bloqueado por copyright, ex. Lê Phổ, Kim Ki-chang #21). Trazer
artistas **vivos/independentes** muda essa premissa: o copyright é deles,
logo a inclusão depende de **autorização/cessão por parte do artista**, não
só de curadoria interna. Isso não impede a ideia — só exige um caminho de
consentimento formal de cara, em vez de decidir depois.

**Modelo de apresentação proposto (espelha a ficha das obras clássicas):**
cada obra independente entra com os mesmos campos do vault — título,
artista, ano, técnica, referência bíblica confirmada, descrição com
*significado explicado* — **mais**:
- [ ] **Formulário** de submissão/contato pra qualquer artista trazer a
      obra (canônico hoje: contato via Pix/sobre; ver seção "Fale Com o
      Contato", ~2026-08-22)
- [ ] **Obras selecionadas** (curadoria editorial: nem tudo que chegar
      entra — mesmo critério de comentário da Fase 1)
- [ ] **Significado explicado** (descrição curada de um autor do projeto,
      não texto do artista, mantendo o padrão de voz e citação)
- [ ] **Link para o perfil do artista** (site/Instagram), com divulgação
      recíproca — o artista indica a obra, o site dá o crédito e o link

**Primeiros artistas indicados pelo Rilson (2026-09-03):**
- [ ] **Alveart** — perfil: `https://www.instagram.com/alveart_`
- [ ] **Cecília Rosa**

**Pesos/decidir junto:**
- Obras independentes entram como um "galeria de artistas cristãos" à
  parte, ou se misturam à grade principal? (decisão de identidade do
  site — o restante é clássico/de domínio público)
- Modelo de licença/autorização a usar no formulário (cessão simples via
  termos no envio, tipo "autorizo a exibição" + atribuição)
- Quem faz a curadoria editorial (mesmo padrão das demais notas: começa
  manual no vault, antes de virar feature)
- **Não construir feature antes de validar com 1-2 artistas reais** —
  mesmo princípio do "onde ver pessoalmente": primeiro o lote mínimo, a
  infra depois.


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

- [x] **Integração com o Cluster "A Biblioteca" — atendida por outros
      meios, decisão do Rilson (2026-09-05)**: os itens literais abaixo
      (`<ClusterHeader />` no topo, cards contextuais pra Scriptorium
      Divinum) não foram construídos como descritos, mas o Rilson
      considera a integração real satisfeita por dois caminhos que já
      existem: a barra "Conheça também" no footer (`Footer.tsx`,
      linkando Narniano/Scriptorium Divinum/Lecionário/Gerador C.S.
      Lewis) e a sincronização de verdade da Pintura do Dia com o
      Lecionário (seção "Afinidade litúrgica" acima). Fechado por
      julgamento de produto, não por entrega literal da lista — se
      quiser as pontes contextuais específicas (tipo o card "Leia
      Santo Agostinho no Scriptorium Divinum") no futuro, é item novo,
      não reabertura deste.
  - ~~Incluir o selo unificado `<ClusterHeader />` ("REDE A BIBLIOTECA") no topo.~~
  - ~~Pontes explícitas Bíblia na Arte → Scriptorium Divinum (cards ao final de obras retratando autores/teólogos clássicos: *"Leia obras de Santo Agostinho no Scriptorium Divinum"*).~~
  - ~~Pontes Bíblia na Arte → Lecionário (conexão de obras com as passagens do lecionário litúrgico do dia).~~
- [~] **Páginas de Artista Ricas (Alimentadas pelo Vault Obsidian)**:
  - Enriquecer as páginas de artista (`/artist/:slug`) com biografias, contexto histórico e citações diretamente das notas do **Vault Obsidian** do Rilson.
  - **Correção de premissa (2026-08-24): a página base NÃO existe — o nome
    do artista é texto morto no site, sem rota nem link. Ver achado crítico
    em "Achados 2026-08-24".** O mínimo viável (rota `/artista/:slug` +
    grade das obras do artista + links do nome do artista apontando pra
    ela) vira PRÉ-REQUISITO deste item; biografia rica, retrato tondo e
    timeline visual passam a ser camada 2, em cima da rota que funciona.
  - **[x] Mínimo viável ENTREGUE (2026-09-01)**: tabela `artists` (nome, slug, bio) alimentada
    no export a partir das notas `Autores/*.md` do vault (317 artistas, 222 com biografia
    curada); rota `GET /api/v1/artists/:slug` com testes unitários + integração (Postgres real);
    página `/artista/:slug` (`ArtistPage.tsx`) com hero, biografia em markdown quando existe
    (fallback em itálico quando não existe), grade de obras reaproveitando `ArtworkCard`, SEO
    com schema.org `Person`; nome do artista virou link clicável no card (`ArtworkCard.tsx`,
    sem aninhar `<a>` dentro do `<Link>` do card — clique com `stopPropagation` + navegação
    manual, testado) e na página da obra (`ArtworkDetail.tsx`). 3 bugs pegos no caminho:
    colisão de slug entre variantes do mesmo nome com vírgula diferente (ex.: "Jan Bruegel o
    Velho" vs "Jan Bruegel, o Velho" — corrigido agrupando por `slugify()` do nome, não por
    `normalizeForComparison()`, que não pega vírgula), path de pasta vazando dentro de wikilink
    de autor em 4 notas do Fritz von Uhde (`extractWikilink` agora corta prefixo de caminho), e
    `frontmatter.fonte` vs `frontmatter.fonte_localizacao` (nome de campo errado herdado de
    código antigo). Retrato tondo e timeline visual (camada 2) permanecem não implementados.
  - Retrato do pintor em moldura circular *tondo* dourada.
  - Linha do tempo visual cronológica das obras bíblicas do artista no acervo (ex: a evolução da luz e do traço de Rembrandt ou Caravaggio ao longo das décadas).
  - **Preparação de conteúdo em andamento (2026-08-30/31)**: biografias das notas `Autores/*.md` do
    vault estão sendo reescritas com pesquisa real (não mais parágrafo raso de ~40-90 palavras) —
    26 pintores cobertos até agora, priorizados por tamanho da galeria no vault (Doré, Tissot,
    Rembrandt, Ticiano, Margetson, Rubens, Zurbarán, Caravaggio, Blake, Dürer, etc.). Isso é a
    camada de conteúdo que este item vai consumir quando a rota `/artista/:slug` existir — export
    script ainda precisa ganhar o passo de ler `Autores/*.md` (hoje só lê `Pinturas/*.md`). Ver
    `ENRIQUECIMENTO-PINTURAS-PROGRESSO.md` na raiz do vault pro histórico completo.
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

- [x] **Deu erro no último deploy — desatualizado, verificado em
      2026-09-05**: registrado em 24/08 sem causa identificada na hora.
      Conferido o histórico de `Deploy VPS` agora — toda execução desde
      então (inclusive as 4 mais recentes, de 04/09, publicação
      Instagram/Facebook/Threads) terminou com sucesso. Ou foi um
      problema pontual já resolvido por outro commit, ou era ruído — sem
      como saber qual à distância, mas não é mais pendência ativa.
- [x] **Não existe página do pintor — RESOLVIDO (2026-09-01), item
      ficou órfão sem cross-referência**: o mínimo viável descrito
      abaixo foi entregue no mesmo dia em que outro item deste mesmo
      arquivo ("Páginas de Artista Ricas", em "Recursos Estratégicos")
      já registrava a entrega — só faltou apontar de volta pra cá.
      Confirmado de novo em 2026-09-05 (Rilson: "página do autor já
      temos, isso está desatualizado"): rota `/artista/:slug` existe
      (`web/src/pages/ArtistPage.tsx`, commit `3925faf`), com hero,
      biografia em markdown, grade de obras, SEO com schema.org
      `Person`, e o nome do artista virou link clicável no card e na
      página da obra. Ver detalhe completo em "Páginas de Artista
      Ricas" acima. Camada 2 (retrato tondo, timeline visual) segue não
      implementada, mas não é mais bloqueio de SEO — vira item
      separado, de polish, não de gap crítico.

### 🟠 Honestidade de produto / UX

- [x] **Botão de baixar entrega a imagem personalizada pro Instagram —
      enganoso — concluído (2026-08-24)**: separado em 2 ações explícitas
      na barra de ações da obra. `DownloadArtworkButton.tsx` (novo) baixa
      o arquivo ORIGINAL (mesmo WebP que o lightbox serve, via blob —
      `<a download>` puro não funciona cross-origin) com rótulo "Baixar
      obra"; `DownloadStoryButton.tsx` teve o rótulo padrão trocado de
      "Baixar Story" pra **"Compartilhar como Story"** (ícone `Share2` no
      lugar de `Download`) — deixa explícito que entrega o render com
      moldura/logo/texto, não a pintura limpa. Nenhum rótulo entrega mais
      coisa diferente do que promete. 3 testes novos
      (`DownloadArtworkButton.test.tsx`), testes existentes do
      `DownloadStoryButton` atualizados pro novo rótulo. Verificado rodando
      a stack local completa (Postgres de teste + server + web) antes do
      deploy — botão aparece e baixa o arquivo certo.
- [x] **Logomarca desalinhada com o texto no card do Story — concluído
      (2026-08-24)**: causa raiz era o `html2canvas` calculando a caixa
      do texto pelo `line-height` do navegador, não pela altura visual da
      fonte — o texto "flutuava" alguns pixels do centro real da logo
      mesmo com `items-center` no flex pai. Corrigido em
      `ArtworkShareCard.tsx`: altura fixa e igual nos dois filhos (`h-8`),
      `object-contain` na imagem, `leading-none` + `flex items-center`
      no `<p>` (centra o texto dentro da própria caixa de altura fixa).
      Validado tornando o card temporariamente visível (fora do
      `left-[-9999px]`) e rasterizando via Chrome headless — logo e texto
      alinhados no resultado renderizado, não só no DOM.

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

- [x] **Ano com fonte diferente do projeto — resolvido 2026-09-01**: badge
      de ano trocado de `font-mono` (JetBrains Mono) pra `.numeral-classico`
      (nova classe: serifa do corpo `--font-serif` + `font-variant-numeric:
      oldstyle-nums`, algarismos históricos em vez de tabulares de código),
      aplicado em ArtworkDetail, ArtworkCard e PassageTimeline. `font-mono`
      mantido só onde é chrome de UI de verdade (atalho ⌘K, zoom %, erro
      404) — não mexido, decisão à parte confirmada.
- [~] **Passada de coerência de espaçamento/padding/margem/font-size** —
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
      **Progresso parcial 2026-09-01** (ver seção "Achados 2026-09-01"
      abaixo pra lista completa): auditoria real de h1/h2 feita (achou e
      corrigiu 2 inconsistências de escala real); CopyButton e o link
      "Ler capítulo completo →" corrigidos (hover ilegível, dourado sobre
      dourado); "Obras Relacionadas" empilha no mobile. **Ainda não
      cobre**: inventário sistemático de padding/altura/raio de borda
      componente por componente — isso continua pendente de verdade, o
      que rolou até aqui foram achados pontuais reportados ao vivo, não
      a auditoria completa descrita no item original.

## Achados 2026-09-01 (Rilson revisando o site ao vivo) — todos corrigidos e no ar

Sessão longa de QA visual/funcional direto em produção. Todos os itens
abaixo foram corrigidos, validados (typecheck+lint+test+build nos dois
pacotes, integração completa quando mexeu em schema/query) e deployados —
exceto o único marcado como aberto no final.

**Curadoria/dados:**
- [x] **Bug real: exclusão de não-bíblicas quebrada silenciosamente pelo
      rename do vault** — `EXCLUDED_NON_BIBLICAL_FILENAMES` comparava nome
      de arquivo EXATO; o processo de renomeação do vault (acrescenta
      `titulo_original` como subtítulo) já tinha quebrado 14 das 22
      entradas sem ninguém perceber — essas pinturas não-bíblicas
      voltaram a aparecer no site. Corrigido pra comparar por chave
      estável (autor+título antes do primeiro parêntese). +3 novas
      exclusões achadas no processo (A Colheita/Van Gogh, Lune de
      Miel/Leyendecker, Fogos de artifício/Yamashita).
- [x] **"Caravaggio - A Incredulidade de São Tomé" sem imagem** — nota
      tinha todo o conteúdo mas nunca teve `![[...]]` embutido; imagem já
      existia em `0 - Anexos`, só não estava referenciada. Corrigido no
      vault.
- [x] **Linha "*Fonte: [Título](url)*" vazando pro meio da descrição** —
      achado do Rilson: "o problema não é o link ser da Wikipédia, é ter
      um link solto no meio de uma descrição". A linha de citação que toda
      nota tem no fim de "Descrição da Obra" ia direto pro campo
      `description` do site, sem nenhum destaque visual — informação
      redundante com `sourceUrl`, que já tem tratamento próprio. Corrigido
      em `vault-parse.ts` (`sanitizeDescription`): qualquer linha que
      comece com "Fonte:" é removida da descrição exportada. 2 rounds de
      regex (1º só pegava o formato de 1 link só sem texto depois; 14
      obras com múltiplos links ou URL com parênteses internos —
      `_(Rembrandt)`, `_(Titian)` — ainda vazavam); resolvido no 2º round
      com um critério mais simples (prefixo da linha, não a estrutura
      inteira). 0/904 obras com vazamento, confirmado.
- [x] **James Tissot - A Moeda da Viúva com imagem errada** — corrigido
      pelo próprio Rilson direto no vault; entrou neste mesmo re-export.

**Produto/UX — fonte oficial:**
- [x] **Decisão formalizada**: o link de fonte oficial (museu/Wikidata)
      só aparece quando existe (`sourceUrl` é opcional de propósito — nem
      toda obra tem uma confirmada) e agora mora **ao lado de "Onde ver"**
      na ficha da obra, não mais como botão solto no fim da página — é a
      referência que sustenta aquela informação de localização, faz
      sentido andarem juntas. Fallback: se por algum motivo existir
      `sourceUrl` sem `location` (raro), vira uma linha própria em vez de
      desaparecer.

**Tipografia/visual:**
- [x] Ano/datação: `font-mono` → `.numeral-classico` (ver item marcado
      acima nesta mesma seção do roadmap).
- [x] Auditoria de tamanho de heading: h1 do ArtworkDetail pulava o
      degrau `sm:` que as páginas irmãs têm; h2 de About/Contribute ficava
      travado em 24px em qualquer tela.
- [x] **Hover ilegível em 2 botões** (CopyButton + "Ler capítulo completo
      →"): no tema escuro, `--accent` (fundo de hover do `variant="ghost"`)
      e `--primary` (nossa cor de texto customizada) são quase idênticos —
      dourado sobre dourado. Corrigido nos dois com `hover:bg-primary/10`
      explícito em vez de deixar o `hover:bg-accent` padrão do ghost
      competir com o texto. **Varredura feita**: são os 2 únicos lugares
      do código com essa combinação exata (`variant="ghost"` + custom
      `hover:text-primary`); nenhum outro botão do site tem o mesmo risco.
- [x] Botão "Copiar descrição": única ocorrência no site, tinha
      `variant="outline"` competindo visualmente com o heading "Sobre esta
      Obra" ao lado — trocado por estilo discreto (ghost + texto pequeno
      muted), mesmo registro do link "Ler capítulo completo →".
- [x] Ícone de favoritos: a troca coração→fita marcadora (sessão anterior)
      só tinha alcançado o botão por-obra — faltava a navbar (desktop +
      mobile) e a página `/favoritos` inteira (texto "clique no coração",
      estado vazio). Tudo consistente agora; coração mantido só onde é
      decoração de "carinho pelo projeto" sem relação com favoritar
      (Sobre, Contribuir, página do livro).
- [x] Header "Obras Relacionadas": título+legenda espremidos contra o
      botão no mobile — empilha em telas estreitas agora.
- [x] ArtworkShareCard (imagem de Story): logo e wordmark insistiam em
      sair desalinhados no html2canvas mesmo depois de 2 tentativas de fix
      anteriores documentadas no código (`line-height` calculado diferente
      do navegador real pela lib). Solução definitiva sugerida pelo
      próprio Rilson: parar de tentar alinhar os dois na mesma linha —
      logo isolada no canto superior esquerdo (posição absoluta), wordmark
      centralizada por conta própria. Cor do título trocada do vinho
      (roxo-vinho da marca) pra um dourado escuro — "amarelo com detalhes
      marrons", como pedido.

**Features novas:**
- [x] `GET /api/v1/bible-books` (lista e detalhe) agora inclui
      `artworkCount` por livro — card de livro na Galeria mostra "N caps.
      · N obras" em vez de só capítulos.
- [x] Página de capítulo: seção de Obras de Arte movida pra ANTES do
      texto bíblico ("o foco do site é arte" — Rilson). Texto do capítulo
      agora destaca (fundo sutil + ícone de paleta) os versículos que têm
      pelo menos 1 obra associada.

**Bug de produção causado por um dos itens acima, corrigido no mesmo dia:**
- [x] **HTTP 500 real em `/bible-books/:slug`** (ex: `/bible-books/titus`)
      — ao tornar `artworkCount` obrigatório no schema de resposta,
      esqueci de atualizar `getBibleBookBySlug` (usada pela rota de
      DETALHE) pra também calculá-lo — só `listBibleBooks` (rota de
      LISTA) tinha sido atualizada. Fastify rejeitava toda resposta da
      rota de detalhe com 500 (schema exige o campo, dado não tinha).
      **Lacuna de teste real que deixou passar**: só a rota de lista tinha
      teste de integração contra Postgres real; a de detalhe nunca foi
      exercitada. Adicionados os 2 testes que faltavam — suite de
      integração foi de 24 pra 26 testes.

**Bug de longa data achado ao responder a pergunta do Rilson** ("os links
de fonte oficial estão aparecendo pros usuários finais?"):
- [x] **`sourceUrl` nunca era populado pra 99% do acervo** —
      `export-vault-data.ts` lia `frontmatter.fonte`, mas o campo real
      usado em toda nota do vault sempre foi `fonte_localizacao`. Só as
      10 notas (de 904!) que por acaso usavam o nome errado é que já
      tinham o link de fonte oficial exposto. O comentário original da
      interface `RawFrontmatter` já registrava a suspeita ("nunca era
      populado pelo pipeline") sem nunca fechar o loop de descobrir por
      quê. Corrigido: **869 de 904 obras (96%)** passaram a exportar
      `sourceUrl` de verdade. Combinado com o item de produto acima (fonte
      oficial ao lado de "Onde ver"), isso é uma mudança grande de
      visibilidade pro visitante — a maior parte do acervo nunca tinha
      exposto isso antes.

**Verificação extra pedida pelo Rilson**: "esses testes têm chance de
quebrar quando o número de pinturas aumentar?" — não. A suite de
integração usa uma fixture isolada (2 obras fake, truncate+insert a cada
execução via Docker), nunca o catálogo real — confirmado rodando a suite
completa contra Postgres de verdade antes e depois de cada mudança de
schema/query desta sessão.

### Achados seguintes (mesmo dia, screenshot completo + painel do AdSense)

- [x] **Causa real do "espaço grande" — era Google Auto ads (achado
      inicial 2026-08-31)**: com o screenshot da página inteira sem
      corte, ficou claro que o gap gigante não é entre imagem e legenda
      (essas duas continuam coladas, `space-y-3`) — é ENTRE elementos da
      própria coluna, com "Óleo sobre tela" e "Inspecionar detalhes"
      aparecendo isolados, centenas de pixels um do outro. Não existe
      nada no JSX que explique isso — teoria confirmada pelo próprio
      Rilson checando o painel: **Auto ads estava ATIVADO pra
      `narniano.com`** (visível em Anúncios → Por site), e como
      `biblianaarte.narniano.com` compartilha a mesma conta/client-id do
      AdSense sem estar listado como site separado, o algoritmo do
      Google inseria anúncios automáticos ali também — reservando espaço
      grande independente do JSX, exatamente o tipo de coisa invisível
      numa leitura de código. Tentativa 1 (2026-08-31): Rilson adicionou
      exclusão de página em Auto ads → Exclusões de páginas, URL
      `biblianaarte.narniano.com/`, modo "Todas as páginas desta seção".
      **RECORRÊNCIA (2026-09-01)**: mesmo gap voltou a aparecer — exclusão
      via painel do AdSense é assíncrona (a própria documentação do
      Google fala em até ~24h pra propagar) e, na prática, não é
      confiável o bastante sozinha. Fix definitivo, direto no código:
      `web/index.html` agora tem um segundo `<script>` logo após o loader
      do `adsbygoogle.js`, fazendo
      `push({ google_ad_client: "...", enable_page_level_ads: false })`
      — o opt-out oficial de Auto ads via código, avaliado no cliente
      assim que o script carrega, sem depender do estado do painel.
      Confirmado que não interfere nos slots manuais (`<AdUnit>`, que
      fazem `push({})` próprio com `data-ad-slot`) — page-level ads e
      slot manual são mecanismos independentes dentro do
      `adsbygoogle.js`.
- [x] **CORREÇÃO — a causa nunca foi Auto ads (2026-09-01, gap voltou
      mesmo depois do fix de page-level ads acima)**: Rilson confirmou
      com ctrl+shift+r que o gap gigante continuava — sinal de que a
      teoria do Auto ads estava errada desde o início (coincidência:
      as duas coisas foram investigadas no mesmo dia). Reproduzido ao
      vivo com Playwright (`--channel chrome`, viewport mobile) contra
      `biblianaarte.narniano.com/obra/...` e inspecionado via
      `getBoundingClientRect`/`innerHTML` do próprio DOM renderizado:
      o `<div>` da barra de ações rápidas (`flex flex-col ...`) media
      **2004px de altura** só por causa de um filho escondido — o
      template offscreen do `ArtworkShareCard.tsx` (1080×1920, usado
      pelo `html2canvas` no botão "Compartilhar como Story"). Esse
      template tinha `className="fixed left-[-9999px] top-0 ... relative"`
      — **`fixed` E `relative` na mesma classe** desde o fix de
      alinhamento do logo (2026-09-01, mais cedo nesta mesma sessão):
      como as duas são utilities de `position` com a mesma
      especificidade CSS, quem vem depois na folha de estilo compilada
      do Tailwind (`relative`) vence sobre `fixed`, e o elemento parou
      de sair do fluxo do documento — passou a ocupar 1920px reais
      dentro da página de verdade, empurrando tudo abaixo. Exatamente o
      tipo de conflito de especificidade que o guia de design deste
      projeto avisa pra vigiar (classes baseadas em elemento/utility que
      se cancelam). Fix: removido o `relative` — `fixed` sozinho já
      define contexto de posicionamento pro logo `absolute` filho, não
      precisava dos dois. Testes unitários (jsdom) não pegam esse tipo
      de bug — não rodam cascata CSS real —, por isso só apareceu
      navegando de verdade; validado com screenshot Playwright antes e
      depois do fix contra o build local E confirmado ao vivo em
      produção depois do deploy.
- [x] **Slot de anúncio errado**: o único `<AdUnit>` do código
      (ArtworkDetail) usava `slot="4884773751"`, que não batia com
      NENHUMA das 3 unidades manuais reais cadastradas no AdSense
      (SD-Ficha 5170899723 / SD-Catálogo 7957729643 / SD-Home 2896974659)
      — provavelmente sobra de uma unidade já apagada. Corrigido pro slot
      real de "SD-Ficha" (nome que já bate com o vocabulário do próprio
      código — "ficha da obra"). **SD-Catálogo e SD-Home existem no
      AdSense mas não têm nenhum `<AdUnit>` no código ainda** — ficam
      disponíveis pra Search/ArtCategories e Index se fizer sentido no
      futuro (não implementado agora, ninguém pediu).
- [x] **"(fonte oficial)" reformulado**: era texto entre parênteses
      colado na prosa da localização — Rilson achou que podia ficar
      melhor. Virou badge clicável pequeno ("Saiba mais" + ícone de link
      externo), mesmo padrão visual dos badges "Pintura"/"Domínio
      Público" já usados na página.
- [x] **Título original dentro do `<h1>`** — causa raiz real, não só
      questão de onde exibir: `parseTitleParts()` (extrai título vs.
      subtítulo do nome do arquivo) não lidava com parêntese aninhado —
      "Jó (Job on the Dunghill (Job in His Misery))" tem o subtítulo em
      inglês com parêntese DENTRO dele, a regex antiga (`[^()]*`, sem
      aninhamento) falhava e a string inteira virava `title`, sem separar
      nada. Corrigida a regex pra aceitar 1 nível de aninhamento — Rilson
      confirmou manter o padrão existente (subtítulo em itálico abaixo do
      título), só precisava separar os dois de verdade.

---

## Achados 2026-09-01 (2) — feedback de amigos vendo o site pela 1ª vez

> Rilson compartilhou o link com amigos e foi recebendo feedback aos poucos.
> Pedido explícito: implementar item por item **sem fazer deploy** até ele
> pedir, e manter este roadmap atualizado a cada pedido novo pra não perder
> o controle da fila. Todos os itens abaixo estão implementados e validados
> localmente (typecheck + lint + build + testes unitários, e verificação
> visual real com Playwright headless contra um build apontando pra API de
> produção) — **nada deployado ainda**.

- [x] **Cardzinho de `/biblia` — padding, fonte, contraste (implementado,
      aguardando deploy)**: 3 pedidos juntos no mesmo screenshot mobile —
      (1) diminuir um pouco o padding do card, (2) aumentar a fonte do
      nome do livro (já estava em negrito, só faltava tamanho — `text-xs
      sm:text-sm` → `text-sm sm:text-base`), (3) contraste do card contra
      o fundo — causa real: `.gradient-card` no tema claro vai de
      `hsl(35 20% 99%)` a `hsl(40 30% 95%)` sobre um `--background` de
      `hsl(35 20% 97%)`, ou seja, o gradiente do card literalmente
      atravessa a luminosidade do fundo da página — com `border-0`, não
      sobra nenhuma borda pra segurar a definição visual. Não mexi no
      token `--gradient-card` global (usado em ~14 arquivos, risco alto
      de efeito colateral em outras páginas) — em vez disso, dei ao card
      o mesmo tratamento de borda que `ArtworkCard.tsx` já usa
      (`border border-border/60 hover:border-accent/40`), abordagem já
      comprovada no projeto.
- [x] **Numeral romano nos livros com prefixo numérico (implementado,
      aguardando deploy)**: "1 Pedro", "2 Samuel" etc. têm contraste
      visual ruim entre o algarismo arábico e a maiúscula colada nele —
      "1" ao lado de "P" quase lê como "l Pedro". Vira "I Pedro",
      "II Samuel" só na exibição, via `toRomanBookName()` novo em
      `web/src/lib/utils.ts` — **não mexe no nome canônico** armazenado
      em `bible_books.name`/usado por `resolveBibleBook()`
      (server/src/db/seed-data/bible-books.ts) pra casar referências
      extraídas do vault, então zero risco de quebrar o matching. Aplicado
      por enquanto só nos cards de `/biblia` (onde o problema foi
      reportado) — breadcrumbs/títulos de `/biblia/:slug` e
      `/biblia/:slug/:cap` continuam em arábico; falar com o Rilson se
      ele quiser consistência total antes de generalizar (mudança
      trivial de replicar, só não quis presumir escopo maior do que o
      pedido).
- [x] **Filtro por nome em `/biblia` (implementado, aguardando deploy)**:
      Rilson perguntou se cabia ordem alfabética ou filtro por nome,
      pedindo "o mais profissional e acessível possível pra usuários com
      dificuldade". Optei por filtro por nome (não reordenação
      alfabética) — a ordem canônica atual ajuda quem já sabe a sequência
      bíblica de cor, reordenar A-Z quebraria essa referência sem
      necessidade; um filtro serve os dois públicos (quem lembra o nome
      exato e quem lembra só um pedaço) sem exigir acento certo
      (`normalizeForSearch()`, mesma receita de normalização do
      `resolveBibleBook()` do backend, reimplementada no frontend).
      Acessibilidade: `<label>` visível associado por `htmlFor` (não só
      placeholder, que some ao digitar e não substitui rótulo pra leitor
      de tela), região `role="status" aria-live="polite"` anunciando
      quantos livros bateram a cada tecla, botão de limpar alcançável por
      teclado com `aria-label`, e um estado vazio explícito (card com
      "Nenhum livro encontrado pra '...'" + botão "Limpar filtro") pra
      quando a busca não bate em nada — antes disso a página ficaria em
      branco sem explicar por quê. Verificado ao vivo com Playwright
      (`--disable-web-security` pra contornar CORS local): "pedro" →
      2 resultados ("I Pedro", "II Pedro"), termo sem match → estado
      vazio correto, botão de limpar nativo do `type="search"` duplicava
      com o customizado (2 ícones de X) — trocado pra `type="text"` puro,
      mesmo padrão do input de busca em `Search.tsx`.

---

## Filtros Avançados — multiselect de artista + filtro de tema (plano aprovado 2026-09-02)

> Rilson pediu multiselect de artista e um select de tema em "Filtros
> Avançados" (`/busca`). Investiguei antes de propor: **não existe dado de
> tema em lugar nenhum do pipeline hoje** (nem export, nem banco, nem API)
> — só existe no vault, como tag `arte-e-literatura/pintura/tema/...`
> (366 temas distintos, ~1.100 aplicações). Multiselect de artista é bem
> mais contido (só precisa de UI nova + backend aceitar array). Plano
> aprovado por ele, nesta ordem: (1) multiselect de artista sozinho,
> (2) pipeline de tema (vault → export → migração → API), (3) multiselect
> de tema reaproveitando o componente do passo 1. Semântica confirmada:
> "ou" dentro do mesmo filtro (qualquer um dos artistas/temas
> selecionados), "e" entre filtros diferentes (categoria E testamento E
> artista-do-grupo E tema-do-grupo).

- [x] **Passo 1 — multiselect de artista em `/busca` (implementado,
      aguardando deploy)**:
  - **Backend**: `listArtworksQuerySchema.artists` novo (string separada
    por vírgula na querystring, ex. `?artists=Rembrandt,Caravaggio`,
    transformada em `string[]` pelo Zod) substituindo o antigo `artist`
    (só 1 valor, só 1 call site usava). `listArtworks()` filtra com
    `inArray(artworks.artistOrDirector, filters.artists)` — match EXATO,
    não `ilike`/substring, porque os valores vêm sempre de nomes
    canônicos do endpoint `/artists` (não texto livre digitado). 3 testes
    de integração novos (1 artista, 2 artistas com "ou", artista
    inexistente → vazio), todos rodando contra Postgres real via Docker.
  - **Frontend**: componente novo `components/ui/multi-select.tsx` —
    Popover + Command (cmdk) + caixinha de check só visual (NÃO usa
    `<Checkbox>` real dentro do `<CommandItem>`: um checkbox de verdade
    ali dispara dois toggles no mesmo clique, um do checkbox e um do
    `onSelect` do item — achado durante a implementação, resolvido antes
    de virar bug em produção). Busca embutida, sem dependência nova (usa
    as mesmas primitivas do `CommandPalette`). `apiClient.request()`
    ganhou suporte a parâmetro `string[]` (serializa como 1 string
    separada por vírgula). Badges removíveis por artista (clicar o X tira
    só aquele, sem reabrir o combobox).
  - **Achado de teste**: cmdk chama `scrollIntoView` ao destacar item,
    que o jsdom não implementa — quebrava qualquer teste que
    selecionasse um item de `<Command>` com "e.scrollIntoView is not a
    function", sem bug nenhum no componente. Mock adicionado em
    `src/test/setup.ts` (mesma receita do mock de `ResizeObserver` que já
    existia lá), beneficia qualquer componente futuro baseado em cmdk.
  - **Verificação real, não só testes automatizados**: subi Postgres de
    teste + servidor local com o código novo (não a API de produção, que
    ainda não tem o deploy) e semeei com o `vault-export.json` de
    verdade (904 obras, 317 artistas) — Playwright headless confirmou:
    Rembrandt sozinho → 44 obras, Rembrandt+Caravaggio → 65 (44+21, bate
    com "ou" entre os dois), remover 1 badge → volta pra 21 (só
    Caravaggio). Confirma que o filtro é 100% server-side (contagem e
    paginação corretas), não um recorte no cliente.
- [x] **Passo 2 — pipeline de tema (implementado, aguardando deploy)**:
  - Plano original mudou de ideia própria antes de virar código: coluna
    `text[]` em `artworks` foi trocada por catálogo relacional de verdade
    (`themes` + junção `artwork_themes`), porque a tag do Obsidian já vem
    sem acento ("ressurreicao") — precisava de um lugar pra guardar o
    `name` bonito ("Ressurreição"), e um `text[]` sozinho não resolvia
    isso. Mirrors o padrão de `artists`: contagem sempre calculada ao
    vivo via JOIN, nunca guardada.
  - `extractThemes()` novo em `vault-parse.ts` (extrai o segmento depois
    de `tema/` das tags, sem duplicata). `theme-labels.ts` novo: 119
    temas (de 366 distintos no vault, os com 3+ usos — cobrem a grande
    maioria do uso real) curados à mão com acento certo; o resto cai num
    fallback de deslugificação genérica (sem acento, mas legível).
    Migração `0007_worried_toad.sql` gerada via `drizzle-kit generate`.
  - `GET /themes` (mesmo padrão de `/artists`) + `?themes=a,b` em
    `GET /artworks` (mesma semântica "ou" do artista, mesmo padrão de
    subquery-depois-inArray que o filtro de `bookSlug` já usava). 4
    testes de integração novos contra Postgres real.
  - Export re-rodado com o código novo: **295 temas distintos** exportados
    (de 366 no vault — o resto pertence só a obras já excluídas da
    auditoria de direitos autorais), **597 de 901 obras têm pelo menos 1
    tema**, 0 slug duplicado, 0 nome vazio (conferido com script direto
    no `vault-export.json`, mesma disciplina de sempre).
- [x] **Passo 3 — multiselect de tema (implementado, aguardando deploy)**:
  reaproveita `components/ui/multi-select.tsx` do Passo 1 tal e qual,
  alimentado pelo `/themes` do Passo 2 — sem componente novo. Some ao
  lado de Categoria/Testamento/Período/Artista em "Filtros Avançados"
  (pedido original do Rilson: "pode ficar junto dos outros"); grid virou
  `xl:grid-cols-5` (era `lg:grid-cols-4`) — em telas médias fica 3
  colunas em vez de espremer 5 caixas estreitas demais numa tela não tão
  larga. Badge removível por tema selecionado, mesmo padrão do artista.
  - **Detalhe de arquitetura que não virou trabalho extra**: o endpoint
    de busca full-text (`/artworks/search`) não devolve os temas de cada
    obra (decisão deliberada — não valia expor tema em toda obra só pra
    cobrir o cruzamento raro "digitou texto E escolheu tema"). Quando os
    dois filtros coexistem, o cliente busca o conjunto de IDs que batem
    no tema via `/artworks?themes=...` (endpoint já existente) e
    intersecta por ID com o resultado da busca de texto — mesmo
    resultado correto, sem mudar o schema de resposta de obra em lugar
    nenhum.
  - Verificado ao vivo do mesmo jeito que o Passo 1: Postgres de teste +
    servidor local + `vault-export.json` de verdade — filtrar por
    "Ressurreição" no combobox devolveu exatamente 37 obras (batendo com
    a contagem do `/themes`), badge removível funcionando, grid do
    "Filtros Avançados" com a caixa de Tema no lugar certo.

---

## Auditoria de pinturas duplicadas no vault (2026-09-02)

> Rilson notou 2 pinturas idênticas lado a lado na Linha do Tempo de uma
> obra ("Cristo/Jesus na Casa de Marta e Maria", Henryk Siemiradzki, os
> dois 1886) e pediu unificação — e revisão manual documentada de
> qualquer outra coisa achada no caminho. Vault é git (`/home/narniano/
> Documentos/Rilson`), então cada exclusão abaixo é 100% reversível via
> `git diff`/`git checkout` até o próximo commit do vault.

**Método**: 1º passo, script python agrupando notas de `10 - Arte e
literatura/Pinturas/*.md` por `(autor, titulo_original)` — achou 10
grupos candidatos. 2º passo (mais confiável, achado DEPOIS): comparar
`(artistOrDirector, title, year)` no `vault-export.json` já exportado —
pegou 1 caso que o 1º método tinha perdido, porque as duas notas tinham
`titulo_original` diferente ("Parable of the Hidden Treasure" vs. "Man
hiding treasure") pro mesmo quadro. **Lição prática**: nem toda dupe tem
o mesmo título em inglês — vale rodar os dois métodos numa auditoria
futura, não só um.

**Achado crítico de método**: a primeira suspeita de "mesmo Wikidata ID
= mesma obra" (usada pra Hofmann e Aivazovsky) se provou **inválida** —
fetch direto em `wikidata.org/wiki/Special:EntityData/<Q>.json` mostrou
que o Q-ID citado nessas duas notas é a página do **artista**, não de
uma obra específica (mistura comum quando a curadoria não acha o Q-ID
exato da obra e usa o do artista como fallback). Evidência confiável de
"mesma obra física" só vale quando o identificador é claramente
per-objeto — Wikidata Q-ID **de uma obra** (confirmado, não assumido),
ou URL de página de coleção de museu com número de inventário
específico (ex.: `collections.louvre.fr/.../ark:.../clNNNNNNNN`,
`mfab.hu/artworks/<id>`).

### Corrigidas (3, alta confiança — identificador per-objeto confirmado)

- [x] **Henryk Siemiradzki — "Cristo/Jesus na Casa de Marta e Maria"**
      (a que o Rilson viu). Mesma localização (Museu Nacional de
      Varsóvia), mesmo ano (1886), mesmo `titulo_original` exato — e
      busca externa (WikiArt, Art Renewal Center, Wikipedia) confirma
      uma só pintura de 1886, nenhuma menção a segunda versão. Mantida
      "Cristo na Casa..." (descrição própria, 5 versículos individuais);
      apagada "Jesus na Casa..." + sua imagem. Tags únicas dela
      (`escola/polonesa`, `periodo/seculo-xix`, `religiosa`) migradas
      pra nota mantida. Removida também a frase "da qual pintou mais de
      uma versão" da bio do autor — não sustentada por nenhuma fonte
      externa encontrada, provavelmente um artefato do próprio vault já
      ter as duas notas quando essa frase foi escrita.
- [x] **Rembrandt — "A Ceia em Emaús"**. Confirmado via fetch direto na
      página do Louvre: a URL citada nas duas notas é o registro de UM
      objeto específico (INV 1739; MR 944 — "Les Pèlerins d'Emmaüs",
      1648, 68×65cm, Sala 844 Richelieu). Mantida a versão "2" (mais
      completa: glossário de termos técnicos, 1 versículo a mais, tag
      `técnica/tenebrismo`); apagada a versão sem sufixo + imagem. Um
      comentário comparativo com Caravaggio que só existia na versão
      apagada **não foi preservado** — fica registrado aqui caso valha
      reincorporar à mão.
- [x] **Rembrandt — "A Parábola do Tesouro Escondido"** (achado só no
      2º método, não no 1º). Duas notas com `titulo_original` totalmente
      diferentes ("Parable of the Hidden Treasure" vs. "Man hiding
      treasure") pro mesmo quadro — confirmado via URL idêntica do
      Museum of Fine Arts de Budapeste (`mfab.hu/artworks/10272`), mesmo
      ano (1630). Uma delas estava arquivada com nome de arquivo "Autor
      Desconhecido..." apesar do campo `autor:` já dizer corretamente
      Rembrandt (nome do arquivo nunca foi atualizado). As duas eram
      boas — uma focava em técnica/teologia (chiaroscuro, tenebrismo),
      a outra em proveniência (debate de autoria com Gerrit Dou, Coleção
      Esterházy, aquisição de 1871 pelo museu). Mantida a nota com nome
      de arquivo correto e mais backlinks (`Autores/Rembrandt van
      Rijn.md`, `Autores/John Everett Millais.md`, `Mateus.md`,
      `Mateus 13.md`); mesclado o parágrafo de proveniência da outra
      antes de apagá-la — o único dos 3 casos que levou fusão de prosa,
      não só escolha de qual manter.
  - Efeito líquido no export: **904 → 901 pinturas** (2 do Siemiradzki/
    Rembrandt-Emaús numa 1ª passada, +1 do Tesouro Escondido numa 2ª).
    Verificado rodando `pnpm export:vault` de novo depois de cada fix e
    conferindo a contagem — nenhuma colisão de slug nova, nenhum link
    quebrado (`grep` de backlink zero antes de cada `rm`).
  - Bônus achado nas próprias listas de pintura dos capítulos bíblicos
    (não é duplicação de NOTA, é item repetido dentro da MESMA lista):
    "Lucas 10.md" tinha Aimé Morot e Maximilien Luce listados 2x cada;
    "Mateus 13.md" tinha John Everett Millais 2x. Corrigido de graça
    enquanto editava essas notas por outro motivo.

### Revisadas e mantidas como estão (não são duplicatas)

- **Alexandre Gabriel Decamps — "O bom samaritano"** (1842, Cleveland vs.
  1853, Met): anos/museus/URLs diferentes — 2 quadros reais.
- **Ticiano — "Cristo e a Mulher Adúltera"**: 2 Wikidata Q-IDs
  diferentes, anos diferentes (1510/1520), museus diferentes (Glasgow/
  Viena) — 2 quadros reais, bem documentados como tal.
- **Andrei Bodko — série "Sempre por perto" / "Всегда рядом"**: o vault
  tem 5+ instalações numeradas dessa série devocional do artista
  (1/"Always Near", 2, 4, 5...) — numeração de série real, não re-
  importação acidental.
- **William Henry Margetson — "O bom samaritano" 2 e 3**: mesma URL de
  fonte (a página do Meisterdrucke lista mais de uma ilustração do
  mesmo livro), MAS cada nota descreve uma cena diferente da parábola
  (uma é o samaritano ajoelhado tratando o ferido; a outra é o ferido
  já montado no jumento sendo levado) — as próprias notas se cross-
  linkam como "outra versão do mesmo tema". Essa foi a que quase virou
  fusão errada se eu não tivesse lido o conteúdo completo antes de agir
  só pela URL batendo.

### Resolvida após revisão manual do Rilson (2026-09-02)

- [x] **Heinrich Hofmann — "Cristo no Getsêmane" / "Jesus no Getsêmani"**:
  Rilson confirmou visualmente que É duplicata (a evidência de
  identificador tinha ficado fraca demais — "mesmo Wikidata Q" era só a
  página do artista — mas o olho humano resolveu). Mantida "Jesus no
  Getsêmani" (mais completa: Mateus 26 E Lucas 22, 2 versículos citados,
  vs. só Mateus 26 e 1 versículo na outra); apagada "Cristo no
  Getsêmane" + imagem. Tags já eram idênticas entre as duas, sem merge
  necessário. Backlinks corrigidos: `Autores/Heinrich Hofmann.md`
  (frontmatter + galeria) e as 3 notas de capítulo que já listavam as
  duas versões lado a lado (Mateus 26, Marcos 14, Lucas 22) — só
  precisou remover a linha da apagada, a sobrevivente já estava
  listada em todas. Export reconfirma: 903 → 902 obras, Hofmann agora
  com exatamente 4 obras distintas (Tentação de Jesus, Jesus e o jovem
  rico, Jesus no Getsêmani, Jesus no Templo).

### Sinalizadas — Rilson confirmou que são obras diferentes (não mexer)

- **Ivan Aivazovsky — "Andando Sobre as Águas" / "Jesus Caminha Sobre as
  Águas"**: mesmo problema de Wikidata-do-artista, E a bio do próprio
  Aivazovsky no vault afirma que ele pintou essa cena **duas vezes**
  ("1888 e 1890") — real chance de serem 2 quadros genuinamente
  diferentes. Uma das notas usa uma imagem com nome de arquivo suspeito
  (`Snapinst.app_...jpg`, ferramenta de download do Instagram) que vale
  investigar a origem/qualidade separadamente do problema de duplicata.
- **Kirk Richards — "O bom pastor"** (2020 vs. 2022, URLs de fonte
  diferentes): artista contemporâneo vivo, plausível ter pintado o tema
  2x — baixa prioridade, só sinalizando.
- **"Autor desconhecido — A natividade" / "A natividade 2"**: sem
  Wikidata/museu pra comparar, nenhum sinal forte em nenhuma direção —
  só uma checagem visual manual resolve.

---

## 2 pinturas novas adicionadas ao vault (2026-09-02, sugestão do Rilson)

- [x] **Artemisia Gentileschi — "Jael e Sísera" (1620)**: sugestão vinda
      por e-mail. Pesquisado e verificado (Wikipedia PT, Wikimedia
      Commons, busca cruzada) antes de escrever — Szépművészeti Múzeum
      de Budapeste, assinada "Artemisia Lomi" (sobrenome do marido,
      período florentino), mesmo `fonte_localizacao` (`mfab.hu/artworks/
      9542`) que já valida como identificador confiável nesta vault (ver
      auditoria de duplicatas acima). Nota de autor nova também
      (`Autores/Artemisia Gentileschi.md`, não existia). Imagem baixada
      do Wikimedia Commons em resolução boa (1516×1100). Referências
      Juízes 4:21 + Juízes 5:24 (Cântico de Débora) — corretas, ao
      contrário da nota já existente de Amigoni pro mesmo tema (achado
      lateral: aquela nota cita Hebreus 11:31 como sendo sobre Jael, mas
      esse versículo é sobre **Rahab** — sinalizado ao Rilson, não
      corrigido ainda por não ter sido pedido).
- [x] **Moritz Retzsch — "Xeque-mate" / "Die Schachspieler" (1831)**:
      Rilson mandou 2 posts de blog com a lenda de Paul Morphy. Pesquisa
      cruzada (os 2 blogs + WebSearch + Wikidata + metadados do
      Wikimedia Commons) achou discrepância real: **nenhuma das fontes
      menciona Sotheby's** (afirmação do próprio Rilson, aparentemente
      de memória) — a venda documentada foi na Christie's, 1999, e a
      obra está hoje em coleção particular não identificada (não no
      Louvre, como alguns textos de divulgação afirmam sem fonte).
      Achado de método: o Wikidata Q27058602 desta obra É um identificador
      específico de artwork de verdade (confirmado via fetch), diferente
      dos Q-IDs de Hofmann/Aivazovsky que eram só página do artista — nem
      todo Q-ID citado numa nota do vault é confiável, tem que checar
      caso a caso.
      **Decisão de categorização** (perguntei, Rilson escolheu): a obra
      retrata uma cena de *Fausto*, não um evento bíblico literal — sem
      um capítulo óbvio pra `livros:`/`capítulos:`. Optou por vincular a
      versículo temático (Romanos 8:37 "mais que vencedores" + 1 Pedro
      5:8 "o diabo, vosso adversário"), não por deixar fora do pipeline.
      Registrado explicitamente na própria nota (callout no topo +
      frase de fechamento na seção de Contexto Bíblico) que é leitura
      alegórica, não descrição literal — pra não confundir revisão
      manual futura.
      **Achado de parsing durante a verificação**: o cabeçalho
      `### Contexto Bíblico (leitura temática)` que eu tinha escrito
      quebrou a extração de citação (`extractPassageQuotes()`/
      `extractVerseFromContext()` em `vault-parse.ts` exigem o
      cabeçalho exato "### Contexto Bíblico", sem texto extra depois) —
      os versículos ainda apareciam como referência (vêm do
      frontmatter), só sem o texto do versículo junto. Corrigido
      removendo o parêntese do cabeçalho (a ressalva já está no callout
      e na frase de fechamento, não precisava repetir no título);
      confirmado que `passageText` populou certo depois do reexport.
  - Ambas as notas + as duas de Autores novas verificadas ponta a ponta
    no `vault-export.json` local: 903 obras, 319 artistas, 295 temas, 0
    colisão de slug, nenhum nome de artista com `/`. Cross-linkado nas
    notas de capítulo relevantes (Juízes 4, Juízes 5, Romanos 8,
    1 Pedro 5).
- [x] **Bônus corrigido — Hebreus 11:31 nunca foi sobre Jael**: a nota já
      existente do Amigoni ("Jael e Sisera") citava Hebreus 11:31 como
      sendo sobre Jael — esse versículo é sobre **Rahab**, Jael não
      aparece em Hebreus 11 em lugar nenhum (citação provavelmente
      fabricada num enriquecimento anterior). Removida a citação, o
      `livros:`/`capítulos:` (`Hebreus`/`Hebreus 11` trocado por
      `Juízes 5`, que é onde Jael é de fato celebrada — Cântico de
      Débora), e 2 backlinks igualmente errados que eu só achei
      procurando: `Hebreus 11.md` e `Habacuque 3.md` (este último sem
      nenhuma relação temática nenhuma com Jael/Sísera) também listavam
      essa pintura na própria `⚜️ Pinturas:` — removidos.
  - **Lição de processo (acionada pelo próprio Rilson)**: minhas duas
    primeiras tentativas de corrigir isso deixaram "resquício" na nota —
    frases explicando o que eu tinha corrigido e por quê (ex.: "não em
    Hebreus 11... mas sem menção a Jael" na nota do Amigoni;
    "Não há registro de conexão da obra com a Sotheby's... mas não
    encontrei fonte primária" e "ao contrário do que alguns textos de
    divulgação afirmam..." na nota nova do Retzsch, sobre o palpite do
    Rilson de uma suposta origem Sotheby's que não se confirmou em
    nenhuma fonte). Isso é errado: nota de obra é conteúdo pro site,
    não um changelog da minha edição — quem lê não precisa saber que eu
    corrigi algo, só precisa do fato certo. Removidas todas as 3
    ocorrências, texto ficou só com o fato verificado, sem menção ao
    processo de correção. Varredura feita em todas as notas tocadas hoje
    (`grep` por frases desse tipo) pra confirmar que não sobrou mais
    nenhuma — só apareceram 2 ocorrências de "não há registro" em notas
    de Autores que já existiam antes desta sessão (Bosch, C.S. Lewis),
    ali é uso legítimo e direto do fato histórico, não resquício de
    correção — não mexidas.

---

## Ideias novas do Rilson (2026-09-02, registradas antes de qualquer implementação)

> Lote de ideias soltas depois de ver o cardzinho de `/biblia` — nenhuma
> implementada ainda, é só registro pra não perder antes de continuar.

- [x] **Grafo obras ↔ referências bíblicas → decidido como "mapa estático
      navegável" (2026-09-02)**: a ideia original era visualização tipo
      grafo/rede (force-directed, D3). Amigo/Mentorar avaliou junto com o
      Rilson e a decisão foi **NÃO fazer o grafo interativo animado** —
      pesado, ruim no público mobile (maior parte do tráfego), não
      indexável por SEO (SPA canvas). Em vez disso: **mapa estático
      navegável** (`/explorar/:bookSlug/:chapter`) que expressa o mesmo
      grafo como navegação clicável — as obras DA passagem + "outras
      passagens deste livro com arte" + "temas presentes aqui", cada um
      linkando pra outro nó do mapa. O dado de conectividade já existe
      inteiro no Postgres (artworks, bible_references, themes,
      artwork_themes) — é só 1 endpoint novo + 1 página nova, sem mudança
      de schema. As URLs novas são cauda longa de SEO ("pintura Bíblia
      Gênesis 1") no mesmo espírito da estratégia. Implementação
      registrada na seção dedicada abaixo.
- [ ] **"Capa" translúcida no cardzinho de livro (e talvez capítulo)**:
      usar uma das obras daquele livro como imagem de fundo do card,
      bem clara/transparente — "meio que ser a capa daquele livro"
      (palavras do próprio Rilson). Pensar em contraste de texto por
      cima da imagem de fundo (o card já tem texto centralizado); a
      pergunta de acessibilidade de contraste WCAG que já apareceu antes
      nesta sessão (BibleBook/ArtworkDetail) vai voltar aqui.
- [ ] **Filtro/ordenação por "livro com mais obras"**: já existe a
      contagem por livro no cardzinho (`{caps} · {artworkCount} obras`,
      achado 2026-09-01), mas não um jeito de **ordenar** a grade por
      essa contagem (hoje é sempre ordem canônica bíblica). Rilson: "faz
      sentido" — ainda sem prioridade definida.
- [ ] **Destaque maior pra sugestão de imagem por visitantes**: já existe
      `/contribuir` (`Contribute.tsx`), mas o próprio Rilson reconhece que
      "está meio escondida" — ele vai avaliar se cabe dar mais destaque
      (ex.: link mais visível no header/footer, CTA na página da obra).
      Ação dele, não pedido de implementação ainda.
- [ ] **Gustave Doré — cobertura muito abaixo do potencial real —
      ADIADO por decisão do Rilson (2026-09-05: "tá de boas por
      enquanto, se eu quiser obras novas eu te passo")**: Doré tem ~600
      ilustrações bíblicas historicamente conhecidas; o acervo atual do
      site tem só uma fração disso. Não é pendência ativa — fica
      registrado o potencial (cobre capítulos sem nenhuma obra hoje) e o
      pedido específico de manter a curadoria "internacional" (não se
      prender a uma edição/gravura de um só país) **pra quando** o
      Rilson decidir retomar, não como próximo passo a puxar sozinho.

---

## "Capa" translúcida no cardzinho de livro (2026-09-02, implementado, aguardando deploy)

- [x] **Backend**: `listBibleBooks()`/`getBibleBookBySlug()` ganharam
      `coverImageUrl` via subquery correlacionada (a obra ativa mais
      antiga com imagem daquele livro — política simples de propósito,
      documentada no código pra trocar fácil depois se não ficar boa
      visualmente). `bibleBookResponseSchema` atualizado. 2 testes de
      integração novos (com imagem e sem nenhuma) + mock de unitário
      atualizado.
- [x] **Frontend**: `BibleBooks.tsx` — imagem posicionada `absolute
      inset-0` atrás do conteúdo do card (`opacity-[0.14]` claro,
      `opacity-[0.10]` escuro), decorativa (`aria-hidden`, `alt=""`),
      `loading="lazy"`. Verificado visualmente em claro E escuro com
      Postgres de teste + dado real (screenshot Playwright) — textura
      sutil, texto continua 100% legível nos dois temas, boa variedade
      visual entre os cards.
- [ ] **Não estendido pros capítulos** (o "talvez" do pedido original):
      investigado — a grade de capítulos em `BibleBook.tsx` são badges
      pequenos (~40px, só o número), sem espaço físico pra uma imagem de
      fundo funcionar. Se ainda fizer sentido pro Rilson, o candidato
      certo seria o cabeçalho da própria página de capítulo
      (`Chapter.tsx`), não a grade de badges — precisa de conversa
      antes de virar plano.

---

## "Músicas"/"Filmes" no dropdown de Categoria sem indicar que estão vazias (2026-09-02)

> Rilson viu o dropdown de Categoria em Filtros Avançados listando
> "Músicas" e "Filmes" ao lado de "Pinturas" sem nenhum indício de que
> estão vazias — "isso não devia ficar como promessa?". Confirmado antes
> de mexer: `?category=music` e `?category=film` retornam 0 obras na
> API de produção (só `painting` tem as 902).

- [x] **Implementado, aguardando deploy**: distinção clara entre as duas
      telas que usam `CATEGORIES` (`categories.ts`):
  - **`/arte` (hub de categorias) já era honesto** — mostra as 3 com
    contagem real e "✦ Em breve" pras vazias (`ArtCategories.tsx`,
    código preexistente, não mexido).
  - **O dropdown de Categoria em `/busca` não tinha esse contexto** — é
    aqui que a promessa vazia realmente acontecia. Adicionado
    `hasContent: boolean` em `CategoryMeta` (fonte única de verdade,
    `painting: true`, `music`/`film: false`); o dropdown agora filtra
    `CATEGORIES.filter((c) => c.hasContent)`, só "Pinturas" aparece
    como opção selecionável. Vira `true` no dia em que a 1ª obra de
    música/filme entrar no catálogo — 1 linha pra reverter.
  - Teste novo trava o comportamento esperado
    (`categories.test.ts`: "só pintura tem conteúdo real por
    enquanto"). Efeito colateral conhecido e aceito: quem chega em
    `/arte/music` via o card "Em breve" do hub ainda vê o dropdown de
    Categoria em branco (valor não está mais entre as opções) — baixa
    prioridade, o título/descrição da página já deixam "Em breve"
    claro antes disso.

---

## "Mapa de obras ↔ referências bíblicas" (/explorar) — implementado 2026-09-02

> Origem: ideia do grafo (ver "Ideias novas do Rilson" acima), decidida
> como **mapa estático navegável** em vez de grafo interativo force-
> directed — ver a decisão registrada ali. O dado de conectividade já
> existia inteiro no Postgres; o trabalho foi 1 endpoint novo + 1 página
> nova + rota, sem mudança de schema. Rota nova `/explorar/...`, não
> toca em nenhuma das 2.115 URLs indexadas.

- [x] **Backend — `GET /api/v1/explore/:bookSlug/:chapter`**: dado de
      conectividade da passagem como hub:
      - `book` (name, slug, testament) + `chapter`
      - `artworks` — obras ativas daquele capítulo, com `attachReferences`
        (mesmo padrão do resto da API) e os `themes` de cada obra
        (consulta à `artwork_themes` junction)
      - `relatedChapters` — outros capítulos do MESMO livro que têm pelo
        menos 1 obra (com contagem e uma obra-exemplo com imagem pra
        miniatura), pra navegar "pra onde mais posso ir neste livro"
      - `themes` — temas presentes no grupo de obras desta passagem, com
        contagem (reusa a mesma contagem ao vivo via JOIN, nunca
        guardada — mesmo princípio de `artists`/`themes`)
      - Ro 404 se livro/capítulo sem obra (e 404 de livro inexistente).
  - Query nova `getExploreByChapter()` em `queries.ts` seguindo o padrão
    de subquery/`inArray` já usado em `listArtworks`; parte do `artworks`
    filtrada por `bookSlug`+`chapter` em `bible_references`, com
    `active=true` de sempre (auditoria de direitos autorais respeitada).
  - Schema Zod novo `exploreResponseSchema` em `response.schema.ts` +
    params com `slugParamSchema`/`chapterParamSchema` (chapter numérico
    positivo, igual ao 400 do outro endpoint). Registrado no `app.ts`
    com prefixo `/api/v1`. Detalhe: tema DENTRO de cada obra usa um
    schema próprio (`exploreArtworkThemeResponseSchema`, só slug+name) —
    a contagem `artworkCount` é exclusiva da agregação `themes` do hub,
    não dos temas de cada obra (evitou um 500 silencioso de validação de
    resposta no teste unitário, achado 2026-09-02).
  - **Cobertura de teste**: 4 testes de integração real contra Postgres
    (fixture do `api.integration.test.ts`) — hub de Lucas 10 (com o
    Samaritano + related Lucas 15 + tema bom-samaritano), 404 de livro
    inexistente, 404 de capítulo fora do intervalo, 400 de capítulo
    inválido — lição do achado 2026-09-01 (rota de detalhe sem teste de
    integração = HTTP 500 silencioso em produção). Mocks da query nova
    adicionados no teste de rota unitário (`explore.test.ts`, novo) e em
    `artists.test.ts`/`bible-books.test.ts`/`themes.test.ts` onde o
    `vi.mock('../db/queries.js')` lista as queries.
- [x] **Frontend — página `/explorar/:bookSlug/:chapter`**:
  - Tipos `ExploreData` (e `ExploreChapter`/`ExploreTheme`) em
    `web/src/types/index.ts`; função `getExplore()` em
    `lib/api-data.ts`; hook `useExplore()` em `hooks/use-artworks.ts`
    (mesmo padrão staleTime de passagem — conteúdo muda só com
    curadoria/re-export).
  - `Explore.tsx` nova — aquela passagem como hub do grafo: breadcrumb,
    hero com livro+capítulo+contagem, grade de obras (reusa
    `ArtworkCard`), seção "Outras passagens deste livro" (mini-cards
    com miniatura → `/explorar/:bookSlug/:chapter`) e seção "Temas
    desta passagem" (chips → `/busca?themes=...`). Estados de
    loading/erro/vazio no mesmo padrão de `ArtistPage.tsx`.
  - Rota registrada em `App.tsx`. SEO com schema.org + meta da passagem.
- [x] **Links de descoberta (2026-09-02)**:
  - `Chapter.tsx`: botão "Explorar conexões desta passagem" (com ícone de
    rede) no cabeçalho da seção de obras → `/explorar/:bookSlug/:chapter`.
  - `ArtworkDetail.tsx`: botão "Explorar conexões" em cada card de
    "Passagens Bíblicas Relacionadas", ao lado de "Ler capítulo completo".
  - Rótulo decidido 2026-09-02: **"Explorar conexões"** em vez de "Mapa" —
    evita confusão com mapa geográfico; a página é o hub de conexões da
    passagem (obras, temas, outros capítulos).
- [x] **Sitemap (2026-09-02)**:
  - `generate-sitemap.ts` gera 1 URL `/explorar/:bookSlug/:chapter` por
    capítulo (espelha `/biblia` 1:1, prioridade 0.5, monthly — o hub
    existe pra qualquer capítulo e é cauda longa de SEO). `sitemap.xml`
    regenerado: 3.526 URLs, validado, **0 URLs antigas perdidas**.
  - Achado importante: o gerador antigo trocava (SUBSTITUÍA) o sitemap
    pela geração a partir do `vault-export.json` e, se o export ficasse
    parcial, **derrubava URLs indexadas** (detectado: 46 `/obra/...`
    sumiam). Feito **union-based**: preserva qualquer URL já presente que
    a geração não reproduza, respeitando a regra de nunca derrubar as
    2.115+ URLs indexadas. Idempotente (re-rodar não muda o arquivo).

---

## Filtro de Período tinha lista de séculos hardcoded (2026-09-02, implementado, aguardando deploy)

> Rilson, vendo o site ao vivo: "É impressão minha ou nem todos os
> períodos retratados nas pinturas estão aparecendo no site?". Não era
> impressão: `Search.tsx` tinha um array `CENTURY_RANGES` fixo no código
> com só 5 séculos (incluindo "século IX", que não tem nenhuma obra real
> — opção morta) enquanto o acervo de verdade cobre 11 séculos distintos,
> **faltando o século XIX inteiro** — quase metade de todo o acervo
> ficava invisível pro filtro de Período.

- [x] **Backend**: `listPeriods()` novo em `queries.ts` (mesmo padrão de
      `/artists`/`/themes`) — agrega `artworks.year` por século via SQL
      (`(substring(year FROM '\d{3,4}')::int / 100) + 1`), só obras
      ativas com ano reconhecível. Fórmula validada direto contra o
      Postgres de teste antes de virar código (`800`→9, `1866`→19,
      `1900`→20, `2000`→21 — inclusive os casos limítrofes de século
      exato). `GET /periods` novo (`routes/periods.ts`), cache
      `public, max-age=3600`. Teste de integração com fixture real.
- [x] **Frontend**: `usePeriods()` novo; `Search.tsx` deriva a lista de
      séculos ao vivo de `/periods` em vez do array hardcoded —
      `centuryToRange()` calcula o intervalo de anos a partir do século
      (mesma fórmula popular/intuitiva já documentada no comentário
      antigo de `CENTURY_RANGES`, não a convenção estrita de
      historiador). Rótulos em algarismo romano via `toRomanNumeral()`
      novo em `utils.ts`.
- [x] Verificado: `pnpm typecheck`/`lint`/`test`/`test:integration`
      verdes, `curl /api/v1/periods` local batendo com o dado real de
      dev.

## Filtro de Testamento substituído por filtro de Livro (2026-09-02, implementado, aguardando deploy)

> No mesmo review ao vivo, Rilson perguntou: "E não faz mais sentido ter
> filtro por livro bíblico que por testamento?". Perguntei de volta antes
> de trocar (é decisão de arquitetura de UI, não bug) — Rilson confirmou:
> substituir Testamento por Livro.

- [x] `SearchFilters.testament` (Antigo/Novo) removido, `SearchFilters.books`
      (array de slugs, semântica "ou" entre os escolhidos — mesmo padrão
      de artista/tema) no lugar. Reaproveita 100% a infraestrutura já
      existente de `useBibleBooks()` — nenhum endpoint novo precisou ser
      criado pra este filtro.
  - Mesmo princípio de honestidade já aplicado em Categoria/Tema: só
    livros com `artworkCount > 0` aparecem como opção (62 dos 66 livros
    têm pelo menos 1 obra hoje).
  - Chips removíveis por livro na barra de filtros ativos, mesmo padrão
    visual de Artista/Tema.
- [x] Verificado: `pnpm typecheck`/`lint`/`test`/`test:integration` verdes,
      `pnpm build:web` limpo.

## Header: dropdowns viraram links estáticos + contraste do CommandPalette (2026-09-02, implementado, aguardando deploy)

> 3 achados na mesma leva de screenshots do Rilson revisando o site ao
> vivo.

- [x] **"Navegar pela Bíblia"/"Galeria de Arte" — de split trigger pra
      link estático puro**: o split trigger (link + chevron separado
      abrindo submenu) era o compromisso decidido em 2026-08-22 (ver
      "Sessão de polish 2026-08-22"); Rilson já tinha pedido antes pra ir
      direto ao ponto sem dropdown nenhum, pedido reforçado agora — "eu
      já tinha te pedido para fazer com que os botões... deixassem de ser
      dropdown e virassem estáticos antes. Então prefiro que se faça de
      uma vez isso." Motivo imediato: a visibilidade do submenu ("Todos
      os 66 Livros") estava ruim (amarelo sobre amarelo). Em vez de só
      corrigir o contraste do submenu, removido o submenu inteiro dos
      dois itens — viram `<Link>` simples, mesmo estilo de "Sobre o
      Projeto". O conteúdo que vivia no submenu (Antigo/Novo Testamento,
      "Todos os 66 Livros") continua acessível, só que na própria página
      de destino (`/biblia`), não mais num popover do header.
- [x] **Ícone de livro ilegível ao selecionar no `CommandPalette` —
      mesma família de bug "dourado sobre dourado"** já corrigida antes
      em CopyButton/"Ler capítulo completo" (`--primary`/`--accent`
      compartilham o mesmo matiz dourado no tema escuro). Corrigido na
      raiz, não só no ícone reportado: `group` adicionado ao
      `CommandItem` compartilhado (`ui/command.tsx`) e
      `group-data-[selected=true]:text-accent-foreground` aplicado a
      todo ícone colorido do `CommandPalette` (livro, Galeria Completa,
      Antigo/Novo Testamento, Sobre o Projeto) — não só o ícone que
      apareceu no screenshot.
- [x] **Contador de capítulos do `CommandPalette` com `font-mono`** — miss
      da varredura de 2026-09-01 (ver "Ano com fonte diferente do
      projeto"), que cobriu ArtworkCard/ArtworkDetail/PassageTimeline mas
      não este componente. Trocado pro mesmo `.numeral-classico`. Grep
      no `web/src` inteiro confirmou que não sobrou nenhum outro caso: os
      usos restantes de `font-mono` são os já documentados como corretos
      (⌘K, zoom % do lightbox, "Erro 404") ou código morto/dev-only
      (badge de debug, `ui/chart.tsx` nunca importado).
- [x] Verificado: `pnpm typecheck`/`lint`/`test`/`test:integration`/
      `build:web`/`build:server` verdes (85 testes server, 84 web).

## CI quebrou na "Auditoria de dependências" (2026-09-02, corrigido)

> Push do lote acima passou no deploy (workflow separado, não depende da
> CI) mas a CI falhou em `pnpm audit --audit-level=high`: 8 CVEs "high"
> em `fast-uri` (confusão de host / SSRF via normalização malformada),
> puxado por dois caminhos transitivos — `fastify>fast-json-stringify` e
> `@fastify/swagger>json-schema-resolver`. Não era regressão desta
> sessão: `pnpm-lock.yaml` não tinha mudado no commit, as CVEs foram
> publicadas depois do último CI verde.

- [x] `fastify` `^5.1.0` → `^5.12.1` (`pnpm update`) resolveu metade
      (o caminho via `fast-json-stringify`).
- [x] `@fastify/swagger` já estava na última versão publicada (9.8.1) e
      seu `json-schema-resolver` não tem versão que puxe `fast-uri`
      corrigido sozinho — override `pnpm.overrides` no `package.json` raiz
      (`"fast-uri": ">=4.1.3"`) força a versão patched em toda a árvore.
      `fast-uri` só resolve URI/`$ref` de JSON Schema, sem API pública
      usada em código nosso — risco de quebra baixo, confirmado pela
      suíte inteira verde depois.
- [x] `pnpm audit --audit-level=high` → 0 vulnerabilidades "high" (sobrou
      1 "moderate", `esbuild` via `drizzle-kit` — só afeta o dev server
      local dessa ferramenta de migração, não entra no build de produção,
      abaixo do threshold que a CI checa).
- [x] Verificado: `pnpm typecheck`/`lint`/`test`/`test:integration`/
      `build:web`/`build:server` verdes depois do bump de dependência.

## Pintura do Dia ligada à leitura litúrgica (2026-09-02)

> Lado recíproco de `lecionario/ROADMAP.md`, seção "Pintura do Dia
> sumindo em alguns dias + sincronizar com Bíblia na Arte". Achado do
> Rilson usando o Lecionário: a imagem sumia em alguns dias mesmo com
> título/artista aparecendo — investigado a fundo (830 referências
> únicas testadas contra a API, zero `imageUrl` nulo, zero arquivo
> 404) e a causa real era resiliência de cliente (sem `onError`, uma
> falha transitória de carregamento da imagem ficava permanente),
> corrigido do lado do Lecionário. No caminho, decidiu-se reverter a
> decisão de 2026-08-23 documentada abaixo: as duas pontas agora
> mostram a MESMA obra no mesmo dia.

- [x] `getDailyArtwork(dateStr)` (`server/src/db/queries.ts`) agora
      tenta primeiro achar obra ligada à leitura litúrgica do dia antes
      de cair pro sorteio aleatório de sempre — reverte a decisão
      anterior ("sorteio independente... resultado diferente por
      design"). Nova tabela `server/src/data/daily-readings-refs.json`
      (`{date: refs[]}`, copiada do Lecionário via
      `lecionario-web/scripts/export-daily-refs.ts` — a conta de
      calendário litúrgico/Páscoa móvel roda lá, que já tem essa lógica
      testada, não foi reimplementada aqui) + `src/lib/lectionary-refs.ts`
      (parser livro→slug, mesmos slugs de `bible_books.slug`,
      confirmado igual antes de copiar — não cobre deuterocanônicos, o
      catálogo é cânon protestante de 66 livros, não teriam pool de
      qualquer forma).
- [x] Pool por referência (`getArtworkPoolForReference`) filtra
      `imageUrl IS NOT NULL` — nunca escolhe uma obra sem imagem pra
      mostrar como "obra do dia".
- [x] Cobertura da tabela copiada: domingos/festas até 2030-11-24, dias
      de semana até 2028-11-29. Fora disso (ou se nenhuma leitura do
      dia tiver obra catalogada), cai pro sorteio de sempre — nunca
      quebra. Resync é manual (rodar o script do Lecionário de novo +
      copiar o JSON), documentado lá — calendário litúrgico é fixo, não
      justifica pipeline automático entre os dois repos.
- [x] Doc do endpoint (`GET /artworks/daily`, `routes/artworks.ts`)
      atualizada — não fala mais em "sorteio independente".
- [x] Testes novos: `lectionary-refs.test.ts` (parser + lookup de data)
      e integration test end-to-end (`2025-07-13` → Lucas 10:25-37 →
      "O bom samaritano", prova que o caminho por referência está de
      fato escolhendo contra o Postgres real, não só em unit test
      isolado). `pnpm typecheck`/`lint`/`test`/`test:integration`
      verdes depois (92 unit + 43 integration).
- [x] Lecionário (web + mobile) simplificado do outro lado: chama só
      este endpoint agora, removeu `reference-parser.ts`/
      `bible-books.ts` dos dois apps — ver ROADMAP dele.

## Afinidade litúrgica da Pintura do Dia (2026-09-03)

> Pergunta do Rilson depois do item acima: "como você garante que
> realmente estamos seguindo o calendário litúrgico?". Verificado com
> fonte externa antes de responder (não só reafirmado): algoritmo de
> Páscoa bate 100% com datas publicadas (2024-2028), ciclo A/B/C bate
> com Vanderbilt/ECS Publishing pra Advento 2023→B e 2024→C, e o
> conteúdo da leitura de 01/12/2024 bate palavra por palavra com o RCL
> publicado. Isso confirmou que a MECÂNICA está certa — mas expôs um
> problema diferente, testado contra o catálogo real: casamento por
> **capítulo inteiro** mistura pericopes sem relação (João 1 no Natal
> trazia "Cenas da Paixão de Cristo" e "O martírio de André" junto com
> "A Sagrada Família", porque o capítulo também cobre o batismo e a
> vocação dos discípulos).

- [x] **Interseção com tema da estação, quando existir** —
      `SEASON_THEME_SLUGS` em `lectionary-refs.ts` mapeia
      `christmas→[natal,natividade]`, `epiphany→[epifania]`,
      `easter→[ressurreicao,pascoa]`, `pentecost→[pentecoste]`, usando
      tags que **já existiam** no catálogo (custo de curadoria zero).
      `filterPoolByThemes` em `queries.ts` interssecciona o pool da
      referência com esses temas, mas nunca esvazia o pool se a
      interseção não achar nada — refinamento é estritamente aditivo.
      Verificado contra a API de produção antes de implementar: João 1
      inteiro = 14 obras misturadas; João 1 + tema Natividade = 1 obra
      ("A Sagrada Família", exatamente a certa). João 20 + Ressurreição
      = 13 obras, todas coerentes.
- [x] **Alargamento pra estação inteira quando o pool do dia for
      pequeno** (`MIN_POOL_BEFORE_BROADENING = 3`) — `getUnionPoolForReferences`
      junta (2 queries, `OR` de pares livro+capítulo, não 1 por
      referência) todas as obras já ligadas a QUALQUER leitura da MESMA
      estação (`getReferencesForSeason`), não só a leitura exata de
      hoje. Resolve o caso do Advento, que tem pool de 1 obra só por
      referência exata (ver seção anterior) sem trocar de estação.
- [x] **Advento e Quaresma ficam sem tema mapeado, de propósito** — não
      existe tag "Advento" cadastrada ainda, e "Quaresma" não é
      sinônimo de "Paixão" (isso é só a Semana Santa, o resto da
      Quaresma é arrependimento/deserto) — forçar um tema errado seria
      pior que não refinar. Débito de curadoria registrado, não de
      código: se um dia existir tag "Advento"/"Parúsia" cobrindo
      Profeta/João Batista/vigilância, é só adicionar a entrada em
      `SEASON_THEME_SLUGS`.
- [x] Testes: `getLectionaryEntry` (agora devolve `{season, refs}`, não
      só `refs`) + `getReferencesForSeason` cobertos em
      `lectionary-refs.test.ts` (10 testes). `filterPoolByThemes`/
      `getUnionPoolForReferences` não têm teste de integração dedicado
      — o fixture de teste (2 obras, sem tag de estação real) não dá
      pra exercitar o caminho de tema sem distorcer dados de outros
      testes; validado manualmente contra produção como descrito acima.
      Suíte inteira (95 unit + 43 integration) verde depois da mudança,
      confirmando que nada quebrou (o próprio teste de integração já
      existente do "Bom Samaritano" exercita sem querer o caminho de
      alargamento por estação, porque o pool exato daquela data é só 1).
- [ ] Dado curatorial pendente, não bloqueante: tag "Advento" nas obras
      que já se encaixam (Profeta, João Batista, vigilância/segunda
      vinda).

## Publicação automática — Arte Cristã Diária (Instagram + Facebook + Threads)

> Pedido do Rilson (2026-09-03): reativar a página
> [@artecristadiaria](https://www.instagram.com/artecristadiaria/) e
> publicar automaticamente a mesma Pintura do Dia que Bíblia na Arte e
> Lecionário mostram — motivo real por trás de querer a afinidade
> litúrgica bem feita (seção acima). **Implementado nas três
> plataformas gratuitas** (Instagram, Facebook e Threads) —
> `.github/workflows/post-daily-social.yml` +
> `scripts/post-daily-social.mjs`, rodando 1x/dia às 08:13 (São Paulo).
> Pinterest e X (Twitter) foram pesquisados e descartados por ora — ver
> "Pendente" no final desta seção.

**Onde isso roda**: a publicação em si continua inteiramente no GitHub
Actions (runner hospedado pelo próprio GitHub) — decisão deliberada
desde o início (menos superfície de manutenção, sem log crescendo em
disco em lugar nenhum). **O gatilho de horário, porém, saiu do
`schedule:` do Actions em 2026-09-07** (ver "Achado real — agendador do
Actions não confiável" logo abaixo) — agora é um cron na VPS que só
chama a API do GitHub (`workflow_dispatch`), sem rodar nada do post em
si por lá.

### Achado real — agendador `schedule:` do Actions não confiável (2026-09-07)

> O Rilson percebeu (post saindo cada vez mais tarde, 3 dias seguidos)
> e pediu pra investigar: "achei que era 8h, mas ontem saiu depois de
> 10h, e hoje já é mais de 11h e não postou".

Histórico real de execuções (`gh run list --workflow=post-daily-social.yml`),
horário previsto 08:13 em São Paulo:

| Dia | Rodou de verdade (SP) | Atraso |
|---|---|---|
| 04/09 | não rodou nenhuma vez agendada | — |
| 05/09 | 10:51 | +2h38 |
| 06/09 | 11:08 | +2h55 |
| 07/09 | ainda não tinha rodado às 11:16 quando investigamos | +3h+ |

Já tinha sido mudado uma vez antes (de `0 11 * * *` pra `13 11 * * *`,
ver histórico do `.yml`) depois do dia 04/09 não rodar — não resolveu:
o atraso voltou, crescendo dia a dia. É um limite documentado da
própria GitHub (`schedule:` é best-effort, sem SLA, mais sujeito a
atraso em repositórios de baixo tráfego como este) — não tem fix do
lado do cron em si.

**Fix**: `schedule:` removido do workflow (só `workflow_dispatch`
ficou). `scripts/trigger-daily-post.sh` roda como cron na VPS
(`08:13 America/Sao_Paulo`) e dispara o workflow via API do GitHub —
`workflow_dispatch` executa quase na hora, sem fila de agendamento.
Token: fine-grained PAT escopado só a este repo, permissão `Actions:
Read and write`, fica em `/opt/biblia-na-arte/.github-dispatch-token`
(gitignored, `chmod 600`, nunca commitado). Log do script sobrescreve
(`>`, não `>>`) — só o resultado da última tentativa importa pra
debugar, o histórico de verdade de cada dia já vive no run history do
próprio Actions.

**O plano original (abaixo, riscado) previa Facebook Login + Página do
Facebook desde o início, pro Instagram. Na configuração real, a Meta
ofereceu um fluxo mais novo e mais simples pro Instagram — sem
Página — e foi esse que usamos lá. Facebook e Threads entraram depois,
cada um com sua própria configuração (narrativas abaixo).**

~~Exige conta Instagram Business/Creator linkada a uma Página do
Facebook~~ — **não usamos esse fluxo.** O que a Meta chama de
"Instagram API with Instagram Login" (produto "Instagram API" no
painel do app, não "Facebook Login") não pede Página do Facebook
nenhuma: a conta profissional do Instagram é suficiente, mesmo sem
vínculo com uma Página. Escopos usados:
`instagram_business_basic` + `instagram_business_content_publish`
(nomes novos — os antigos `business_basic`/`instagram_content_publish`
foram descontinuados em 27/01/2025). "Standard Access" é automático na
criação do app pra qualquer conta com papel explícito nele
(desenvolvedor/testador/admin) — sem App Review, sem Verificação de
Empresa, porque ninguém além do Rilson vai usar essa conta pelo app.

**Passo a passo real de configuração do Instagram (2026-09-03), pra
repetir se precisar recriar):**

1. Criar app em developers.facebook.com, tipo "Business" (ou similar),
   sem conectar a um Portfólio Empresarial — "Ainda não quero me
   conectar a um portfólio empresarial" é suficiente pra uso próprio
   (um Portfólio Empresarial "impedido de anunciar" só bloqueia se for
   o MESMO portfólio tentando reivindicar o app — não precisa ser).
2. Adicionar o produto "Instagram API" (não "Instagram Graph API" nem
   "Facebook Login") ao app.
3. Dentro do produto, usar o assistente "Personalizar caso de uso" —
   ele tem passos próprios numerados que substituem o fluxo manual do
   "Explorador da Graph API": (1) permissões — `instagram_business_basic`
   + `instagram_business_content_publish`; (2) "Gerar tokens de
   acesso" — esse passo pede pra registrar a conta como "Instagram
   Tester" (aceitar o convite dentro do próprio Instagram, em
   Configurações → Apps e sites → Convites de testador) e, na
   sequência, já gera um token de usuário longo diretamente utilizável
   — **mostrado uma única vez na tela**, copiar na hora; (3) webhooks —
   pulado, não precisamos; (4) "Configurar login da empresa" — pulado;
   (5) "Concluir a análise do app" — pulado (não precisa pra uso
   próprio).
4. **Achado real**: o ID de conta mostrado na tela de "Token gerado" do
   assistente (`17841463956330521`) **não bateu** com o `id` que uma
   chamada real à API (`GET /{id}?fields=username`, usando o token
   recém-gerado) devolveu (`28673697788910100`) — para o mesmo
   `username`. Guardamos o segundo (confirmado contra a própria API),
   não o número exibido na tela do wizard. Se for reconfigurar do
   zero, **sempre confirme o ID fazendo uma chamada de verdade**, não
   confie só no que a tela mostra.
5. Secrets no GitHub (`gh secret set`, nunca commitado):
   `INSTAGRAM_ACCESS_TOKEN` (o token de longa duração, ~60 dias) e
   `INSTAGRAM_ACCOUNT_ID` (o ID confirmado no passo 4).

**Passo a passo real de configuração do Facebook — Página "Arte Cristã
Diária" (2026-09-04), no MESMO app do Instagram:**

Bem mais acidentado que o Instagram — quatro obstáculos reais, cada um
com causa raiz diferente, na ordem em que apareceram:

1. **Pré-requisito**: uma Página do Facebook de verdade (não a conta
   pessoal) — já existia.
2. No **Explorador da Graph API** (developers.facebook.com/tools/explorer),
   o painel inteiro (botão de gerar token, abas de permissões e
   configurações) aparece **travado até você escolher algo no dropdown
   "Usuário ou Página"** (que começa no placeholder "Obter token") —
   não é bug, é ordem de operação da própria ferramenta.
3. Ao tentar adicionar as permissões `pages_show_list` e
   `pages_manage_posts`/`manage_pages`, a Meta devolveu **"Invalid
   Scopes"** — causa real: o app só tinha o produto "Instagram API"
   adicionado, faltava o produto **"Facebook Login"**. Depois de
   adicionar, `pages_show_list` passou a funcionar, mas
   `pages_manage_posts` e `pages_read_engagement` continuaram
   **ausentes da lista** (mesmo digitando o nome exato no filtro de
   busca do seletor).
4. Hipótese testada (e que ajudou, mas não sozinha): conectar o app a
   um **Portfólio Empresarial**. O Rilson já tinha um
   ("Narniano Existencialista") com a Página listada como ativo, mas o
   **app em si nunca tinha sido conectado a ele** — o campo pra isso
   não fica em developers.facebook.com (não existe "Portfólio
   Empresarial" nas Configurações Básicas do app), fica do lado de
   **business.facebook.com → Configurações do Portfólio de Negócios →
   Contas → Apps → Adicionar → "Reivindicar um ID de aplicativo"**,
   colando o App ID (aprovação automática, por já ser admin). Mesmo
   depois disso, as duas permissões continuaram fora do seletor do
   Explorador.
5. **Causa raiz real**: igual ao Instagram, essas permissões só
   aparecem depois de passar pelo assistente dedicado — em
   **"Casos de uso" → "Personalizar caso de uso"** do produto Facebook
   Login, clicando **"+ Adicionar"** ao lado de cada permissão na
   lista (`pages_manage_posts`, `pages_read_engagement`). Só depois
   disso elas passaram a aparecer (e já vinham marcadas) no seletor do
   Explorador da Graph API.
6. Com as permissões certas, gerado o **Token de Usuário** no
   Explorador (dropdown "Usuário ou Página" → "Token de Usuário" →
   "Generate Access Token" → autorizar a Página "Arte Cristã Diária"
   quando pedido).
7. Trocado por token de longa duração:
   `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token=...`
8. Com o token de longa duração, `GET /me/accounts` devolve a lista de
   Páginas administradas, cada uma com seu **próprio token de
   Página** — diferente do Instagram, esse token **não expira em 60
   dias** (segue valendo enquanto o token de usuário que o gerou for
   válido e o app não for revogado).
9. Secrets: `FACEBOOK_PAGE_ACCESS_TOKEN` e `FACEBOOK_PAGE_ID`.

**Passo a passo real de configuração do Threads (2026-09-04), no MESMO
app — bem mais simples que o Facebook:**

1. O app **já tinha** um App ID e Secret específicos do Threads
   provisionados automaticamente (visíveis nas Configurações Básicas,
   sem nenhuma ação prévia) — o produto Threads já vem meio pronto
   junto com o Instagram API nesse tipo de app.
2. Em **"Casos de uso" → "Acessar a API do Threads" → Personalizar →
   Permissões e recursos**: `threads_basic` já vinha "Pronto para
   teste"; `threads_content_publish` precisou do mesmo
   **"+ Adicionar"** que o Facebook.
3. O gerador de token pro Threads **não fica na aba de permissões**,
   fica em **"Configurações" → "Gerador de token do usuário"** — gera
   um token de longa duração direto, contanto que a conta esteja
   registrada como testadora do Threads pro app (mesmo padrão do
   "Instagram Tester" — Funções do app → Funções, se a lista de nomes
   vier vazia).
4. **Aplicada a lição do Instagram**: antes de guardar o ID, confirmado
   contra a própria API (`GET /me?fields=id,username` em
   `graph.threads.net/v1.0`) que o `username` batia com
   `artecristadiaria` — dessa vez bateu, sem divergência.
5. Secrets: `THREADS_ACCESS_TOKEN` e `THREADS_USER_ID`.

**Nota de segurança — cinco incidentes reais ao longo de toda essa
configuração (Instagram + Facebook + Threads), mesma resposta toda
vez:** um Token de Aplicativo completo; depois o App Secret em texto
puro com um token curto e uma resposta HTTP completa; depois, na
configuração do Facebook, o App Secret de novo (reset outra vez) e,
por fim, um token de usuário de longa duração **junto com os tokens de
DUAS Páginas** (Arte Cristã Diária e outra Página do Rilson, Narniano)
colados de uma vez na resposta de `/me/accounts`. Nos quatro primeiros
casos o App Secret foi resetado no painel da Meta logo em seguida. No
quinto, o Rilson optou explicitamente por **não revogar** ("Deixa isso
pra lá, cara") — decisão dele, registrada aqui como decisão consciente
de risco aceito, não como algo ignorado. Prática mantida do início ao
fim: nenhum comando com segredo real preenchido, nem resposta HTTP
completa, é colado na conversa — só "deu certo"/"deu erro" ou a
mensagem de erro. Verificação de secret é sempre via workflow do
GitHub Actions usando `secrets.*` (mascarado automaticamente em log),
nunca `curl` local com saída colada de volta.

**Bug de produto real, sem relação com a Meta**: ao colar blocos de
código bash (com `$(comando)` e `$VARIAVEL`) copiados desta conversa
pro terminal, os cifrões (`$`) somem no processo de copiar/colar,
quebrando a sintaxe (`zsh: parse error near '|'`) — suspeita é
renderização de markdown interpretando `$...$` como delimitador de
LaTeX. Um caso relacionado também produziu `dquote>` (aspa não
fechada), provavelmente por uma quebra de linha visual do bloco de
código virando quebra de linha real no meio de uma string entre aspas
ao colar. Contornado escrevendo os comandos sem variáveis (valores
literais direto na URL, editados um por um em `nano` antes de rodar,
conferindo visualmente que cada comando ficou numa linha só). Reportado
como feedback de produto; se voltar a acontecer, o mesmo contorno
resolve.

**Legenda — dado real, não suposição:** antes de desenhar o formato,
medimos os campos de verdade contra a API de produção (1000 obras):
`classicCommentary` está preenchido em **apenas 1 obra (0,1%)** —
inviável como diferencial. `passageText` (a citação bíblica) cobre
98,5% das obras, mediana de 189 caracteres. A `description` (o texto
que já existe no site, com a "Descrição da Obra" e o "Contexto
Histórico" em markdown) cobre 99,9%, com a parte introdutória (antes
do cabeçalho de contexto histórico) tendo mediana de ~880 caracteres.
A legenda do Instagram/Facebook (`buildCaption`, idêntica pras duas —
Facebook aceita texto bem mais longo, mas não tem motivo pra mudar de
voz entre as duas) usa: título + artista + ano, um recorte da
descrição real da obra (até a última frase completa dentro de ~700
caracteres, sem sintaxe markdown), a citação bíblica (até ~250
caracteres), localização (quando existe) e o link pra obra completa no
site. Testado contra as 1000 obras reais: mediana de 1051 caracteres,
máximo de 1307 — **0% ultrapassa o limite de 2200 caracteres** do
Instagram.

**Threads tem legenda própria, bem mais enxuta** (`buildThreadsCaption`):
o limite lá é **500 caracteres**, não 2200 — e, diferente do Instagram/
Facebook, o Threads **não encurta URL automaticamente**, então o link
inteiro conta pro limite. Pedido do Rilson (2026-09-04) depois de saber
do limite: ir só no essencial — título/ano/autor, a citação da
referência (livro/capítulo/verso, **sem** o texto do versículo) e o
link. Testado contra a obra real do dia: 134 caracteres, bem longe do
limite mesmo em títulos maiores.

**Viabilidade técnica confirmada:**

- Instagram: `POST /{ig-user-id}/media` (cria container passando a URL
  pública da imagem — `biblianaarte.narniano.com/images/...` já serve
  isso, a Meta busca a URL do lado dela, não precisa upload binário) →
  `POST /{ig-user-id}/media_publish`.
- Facebook: uma chamada só, `POST /{page-id}/photos` (`url` + `caption`).
- Threads: mesmo padrão container→publish do Instagram, só que em
  `graph.threads.net/v1.0`: `POST /{threads-user-id}/threads`
  (`media_type=IMAGE`, `image_url`, `text`) → `POST
  /{threads-user-id}/threads_publish`.
- Sem endpoint de agendamento nativo em nenhuma das três (não tem
  `scheduled_publish_time`) — não é problema aqui, porque quem "agenda"
  é o nosso próprio `schedule: cron` do GitHub Actions, publicando na
  hora certa.
- Limite de 25 posts/24h por conta no Instagram — irrelevante pra 1
  post/dia. Facebook e Threads não têm limite prático nesse volume.
- As três publicam de forma **independente** dentro do script (falha
  numa não impede as outras) via `Promise.allSettled`, mas o script sai
  com erro se qualquer uma selecionada falhar — nunca mascara falha
  real. A variável `PLATFORMS` (não-secret, `instagram,facebook,threads`
  por padrão) permite rodar só um subconjunto — usado na prática pra
  testar o Threads sozinho sem duplicar o post do dia nas outras duas.

**Bug real — cron no topo da hora, execução descartada sem rastro (2026-09-04):**

O workflow `post-daily-social.yml` (na época ainda `post-daily-instagram.yml`)
tinha `cron: '0 11 * * *'`. Na primeira manhã depois de configurado,
não publicou nada — sem erro, sem execução nenhuma no histórico do
Actions, como se o agendamento nem existisse. Confirmado que é
comportamento **documentado pelo próprio GitHub**: topo da hora (`:00`)
é o horário de maior fila no agendador deles, e em pico de carga uma
execução agendada ali pode ser **descartada por inteiro**, sem log
nenhum — não é atraso, é sumiço completo.
[Fonte](https://github.com/orgs/community/discussions/201738),
[fonte](https://runhooks.app/blog/github-actions-scheduled-workflows-unreliable/).
Corrigido trocando pra um minuto fora do topo (`13 11 * * *`). Lição
geral: **nunca agendar `cron` do GitHub Actions em `:00` ou `:30`** —
vale pra qualquer workflow futuro, não só esse.

**Pendente (não travando nada, só em aberto):**

- [ ] Renovação do token de 60 dias — decisão de produto ainda não
      tomada: 2º workflow automatizado (troca o token ~15 dias antes de
      expirar, via endpoint próprio de refresh) vs. lembrete manual a
      cada ~50 dias. Enquanto não decidir, marcar um lembrete manual é
      o mínimo pra não descobrir o token morto só quando o post falhar.
      **Token atual gerado em 2026-09-03, expira ~2026-11-02 — renovar
      por volta de 2026-10-18** (`gh secret set INSTAGRAM_ACCESS_TOKEN
      --repo rilsonjoas/biblia-na-arte`).
- [x] Cross-post pro Facebook (Página) — feito em 2026-09-04, narrativa
      completa acima.
- [x] Threads — feito em 2026-09-04, narrativa completa acima.
- [x] `.github/workflows/test-instagram-token.yml` (workflow temporário
      só de verificação) — removido, substituído pelo workflow real.
- [ ] **Pinterest** — pesquisado em 2026-09-03, decisão consciente de
      adiar (Rilson: "vou só dos gratuitos"). Não é gratuito de fato:
      acesso "Trial" (automático, sem review) só cria pins **privados**
      (visíveis só pro criador, tipo sandbox) — pra aparecer
      publicamente precisa de "Standard access", que exige review com
      **vídeo gravado** do fluxo OAuth funcionando, mesmo sendo o único
      usuário. Não é caro nem impossível, só não é imediato como as
      três que já fizemos.
- [ ] **X (Twitter)** — pesquisado em 2026-09-03, mesma decisão de
      adiar. Não tem mais tier gratuito pra developer novo desde
      fevereiro/2026 — é pay-per-use, $0,015/post, ou **$0,20 se o post
      tiver link** (o nosso sempre tem). Pra 1 post/dia isso dá uns
      $6/mês — barato em termos absolutos, mas é a única das cinco
      plataformas avaliadas que custa dinheiro de verdade, e pode
      exigir compra mínima de crédito adiantado (a confirmar se/quando
      formos configurar).

## Botões "Explorar pela Bíblia" / "Descobrir Arte" com tamanho diferente (2026-09-03)

Achado do Rilson batendo o olho na home: os dois botões do hero pareciam
ter tamanhos ligeiramente diferentes. Confirmado no código, não só na
tela — ambos usam `size="lg"` e as mesmas classes extras
(`px-8 py-6`), mas a variante `hero` (usada só em "Descobrir Arte") tem
`border border-white/20` e a variante `default` (usada em "Explorar
pela Bíblia") não tem nenhuma borda — 1px de borda real soma ~2px de
largura/altura ao botão, sem nada compensando do outro lado.

- [x] `default` ganhou `border border-transparent` em
      `web/src/components/ui/button.tsx` — box model igual ao de
      `hero`/`outline` (que já tinham borda real), invisível em
      qualquer tema porque é transparente. Corrigido na variante, não
      só nesse par de botões — qualquer `default` futuro ao lado de
      `hero`/`outline` já nasce do tamanho certo.
- [x] Verificado: `lint`/`typecheck`/`test` (84 testes web, nenhum
      snapshot de dimensão de botão) /`build:web` verdes depois.

## Pintura do Dia mostrando obras sem relação nenhuma entre os dois projetos (2026-09-03)

> Achado do Rilson em produção, algumas horas depois da "Afinidade
> litúrgica" acima: Bíblia na Arte mostrava "A Quinta Praga: a Peste do
> Gado" enquanto o Lecionário mostrava "Jonas Sendo Engolido Pelo
> Grande Peixe" — nada a ver um com o outro, apesar de tudo supostamente
> sincronizado. Investigado na hora, achados **dois bugs reais**, não
> um — a sincronização de código estava certa, mas duas premissas
> silenciosas quebravam ela na prática.

**Bug 1 — fuso horário divergente (o principal, explica a maior parte do dia):**

- A rota `/artworks/daily` calculava "hoje" (quando `?date=` não vem)
  com `new Date().toISOString().slice(0, 10)` — **UTC**. O hook
  `useDailyArtwork` no web fazia o mesmo pra chave de cache. O
  Lecionário usa a hora LOCAL do dispositivo pra decidir "hoje" (padrão
  são-paulense pro público-alvo).
- São Paulo é UTC-3. Isso significa que, **toda noite entre ~21h e
  meia-noite (horário de Brasília)**, o Bíblia na Arte já considerava
  "amanhã" (UTC virou o dia) enquanto o Lecionário ainda mostrava
  "hoje" — os dois pediam leituras de DATAS DIFERENTES ao servidor,
  logo obras completamente sem relação. Confirmado ao vivo: `date -u`
  batia 03/09 02:53 enquanto `date` local batia 02/09 23:53 — a mesma
  janela exata do achado do Rilson.
- [x] `todaySaoPaulo()` (novo, `Intl.DateTimeFormat('en-CA', {timeZone:
      'America/Sao_Paulo'})`, sem precisar de date-fns-tz) substitui o
      `toISOString()` UTC em **três lugares**: rota `/artworks/daily`
      (`server/src/lib/lectionary-refs.ts`), hook `useDailyArtwork`
      (`web/src/lib/api-data.ts`, mesma função duplicada — sem pacote
      compartilhado entre server e web também). Duplicar aqui é
      deliberado: são só 2 linhas, e um pacote compartilhado só pra
      isso seria mais complexidade que a duplicação.

**Bug 2 — alargamento pra estação inteira, testado e revertido no MESMO dia:**

- A seção "Afinidade litúrgica" (acima) introduziu alargar o pool pra
  "qualquer obra da estação inteira" quando o pool exato do dia era
  pequeno (<3). Motivação real (Advento, pool de 1). Só que pra
  `ordinary` (Tempo Comum — **metade do ano**, sem coerência temática
  nenhuma), "alargar" na prática vira "quase aleatório de novo".
- Confirmado com o caso real de hoje: leitura de 03/09/2026 é Êxodo
  9:1-7 (5ª praga do Egito) — pool exato = **2 obras corretas** ("A
  Quinta Praga: a Peste do Gado", "A Sétima Praga do Egito"). 2 < 3
  disparava o alargamento, que juntava TODAS as leituras já usadas em
  QUALQUER dia `ordinary` da tabela inteira (centenas) — nessa união
  entrava, por coincidência, João 20 (Domingo de Tomé, cataloga-se como
  `ordinary` numa leitura de segunda-feira pós-Pentecostes) com 21
  obras, um pool grande o bastante pra "vencer" e ser escolhido pelo
  seed — devolvendo uma obra de Páscoa numa leitura sobre pragas do
  Egito.
- [x] **Alargamento por estação REMOVIDO** (`getUnionPoolForReferences`,
      `getReferencesForSeason`, `MIN_POOL_BEFORE_BROADENING` deletados
      de `queries.ts`/`lectionary-refs.ts`) — pool pequeno mas CERTO é
      preferível a pool grande e aleatório. Se a leitura exata do dia
      só tiver 1-2 obras, mostra essas mesmo, sem mais variedade que
      isso. Interseção por tema (Natividade/Ressurreição/etc.)
      continua — esse refinamento nunca teve esse problema, porque só
      refina DENTRO do pool exato do dia, nunca troca de estação.
      Possível retomar no futuro só pra estações curtas e coerentes
      (Advento/Natal/Páscoa/Pentecostes, nunca `ordinary`), com mais
      validação — não faz parte deste fix.
- [x] Verificado: com o fix, `getDailyArtwork('2026-09-03')` volta a
      escolher entre as 2 obras corretas de Êxodo 9 (confirmado contra
      a API de produção antes de implementar — mesmas 2 obras que
      apareciam antes de qualquer sincronização, valida que o
      comportamento "correto" é justamente esse).
- [x] Testes: `todaySaoPaulo` (server e web) com teste dedicado
      (formato + nunca fica "à frente" da data UTC). `PinturaDoDia.test.tsx`
      (web) precisou mockar `todaySaoPaulo` também — achado ao rodar a
      suíte depois da mudança, não deixado passar batido. 95 unit + 43
      integration (server), 86 unit (web) verdes.

## ID de obra muda a cada reseed — quebra link e desestabiliza a Pintura do Dia (2026-09-03)

> Pergunta do Rilson pensando na curadoria contínua: "com eu adicionando
> novas obras, há chance de algum id mudar e alguma obra se repetir por
> causa disso?" — resposta curta: não é chance, é garantido. Investigado
> e corrigido na hora.

- **Causa raiz**: `artworks.id` é `uuid('id').defaultRandom()` — sem
  nenhum ID vindo do export. `import-seed-data.ts` faz TRUNCATE +
  reimport do zero a cada `db:seed` (comportamento correto pra um
  catálogo curado — a fonte da verdade é o vault, não o banco), mas
  sem um ID estável isso significa que **todas as obras** — não só as
  novas — recebem um UUID novo sorteado a cada reseed.
- **Duas consequências reais**: (1) link `/obra/:id` — inclusive o que
  vai em cada post do Instagram planejado ("Ver obra completa ↗") —
  quebra a cada curadoria+reseed; (2) `getDailyArtwork` ordena o pool
  por `artworks.id` pra ter posição estável entre chamadas, mas como o
  ID reembaralha, a MESMA obra pode sair diferente pro MESMO pool antes
  e depois de um reseed, mesmo sem a leitura do dia mudar.
- **Achado no caminho**: `bible_books`/`artists`/`themes` já têm coluna
  `slug` estável; `artworks` não tem NENHUM identificador estável — o
  `slug` que `export-vault-data.ts` já calcula (e usa nos nomes de
  arquivo de imagem, com dedupe de colisão) nunca chegava a ser salvo
  nem usado pra nada na tabela `artworks`.
- [x] **Fix**: `server/src/lib/deterministic-uuid.ts` — UUID v5 (RFC
      4122) implementado à mão (SHA-1 + bits de versão/variante, sem
      adicionar o pacote `uuid` só pra isso), verificado contra o vetor
      de teste oficial do RFC antes de usar em produção. `artworkIdFromSlug(slug)`
      deriva o ID da obra a partir do `slug` do export — mesmo slug
      sempre gera o mesmo UUID, mesmo depois de truncar e reimportar.
      Só muda se o PRÓPRIO slug mudar (renomear artista/título na
      curadoria) — aceitável, mesmo trade-off de qualquer sistema
      baseado em slug.
- [x] `import-seed-data.ts` passa a especificar `id:
      artworkIdFromSlug(item.slug)` no insert, em vez de deixar o
      Postgres sortear. Slugs já são garantidamente únicos no export
      (dedupe com sufixo de ano/número, `export-vault-data.ts`), então
      não há risco de colisão na constraint de PK.
- [x] Escopo: só `artworks` precisava do fix — `artists`/`themes` já
      são referenciados por `slug` nas rotas (`/artista/:slug`), nunca
      pelo UUID interno, então a instabilidade do ID deles não vaza
      pra fora.
- [x] Testes: `deterministic-uuid.test.ts` (mesmo slug → mesmo UUID;
      slugs diferentes → UUIDs diferentes; formato v5 válido; bate com
      o vetor de teste do RFC 4122). 99 unit + 43 integration verdes,
      typecheck/lint/build:server ok.
- [ ] **Importante — não retroativo sozinho**: o fix só entra em vigor
      no PRÓXIMO `db:seed` que rodar (passo manual, ver RUNBOOK). Os
      IDs já em produção agora (deste reseed) ainda vão trocar mais
      UMA vez quando isso acontecer — depois disso, estabilizam de vez
      (mesmo slug, mesmo ID, pra sempre). Vale saber antes de compartilhar
      qualquer link `/obra/:id` publicamente (Instagram incluso) até
      depois do próximo reseed.

### Débito de arquitetura relacionado — IMPLEMENTADO (2026-09-03, mesma madrugada)

Pergunta do Rilson pensando em 10-20 anos de projeto: `TRUNCATE ...
CASCADE` em `artworks` a cada `db:seed` é a escolha certa pras tabelas
de junção (`bible_references`/`artwork_themes` não têm identidade
própria, recriar do zero é simples e correto) — mas é a escolha ERRADA
especificamente pra `artworks`, por dois motivos concretos, não
hipotéticos:

- **`createdAt` reseta pra "agora" em TODAS as 1028 obras a cada
  reseed** (`defaultNow()`, nenhum valor vem do export). `listArtworks`
  e outras 2 queries em `queries.ts` usam `orderBy(desc(artworks.createdAt))`
  como ordenação padrão — hoje isso não é "mais recente primeiro", é
  "ordem de inserção do loop do export", porque todo mundo tem o mesmo
  timestamp de "agora do último reseed". Não há feature de "novidades"
  na UI hoje (dano zero, verificado), mas a coluna está mentindo sobre
  o que promete.
- **`TRUNCATE CASCADE` não é seletivo** — não é "apaga e recria a MESMA
  linha", é "esvazia a tabela inteira, e qualquer tabela futura com FK
  pra `artworks.id` (favoritos, contador de visualização, anotação de
  usuário — nada disso existe hoje) esvazia JUNTO, mesmo a obra
  voltando com o mesmo ID um instante depois". Isso é o tipo de decisão
  que é barata de ignorar agora (nenhuma tabela dependente existe) e
  cara de descobrir depois (só quando alguém perder dado de verdade,
  sem entender por quê).

**Decidido implementar na mesma madrugada** (o Rilson voltou depois da
reflexão sobre "praga" e pediu pra seguir), com calma e validado contra
Postgres real antes de confiar, não no calor do achado original:

- [x] `createdAt` real vem do `birthtime` do arquivo da nota
      (`statSync(fullPath).birthtime`), exportado por
      `export-vault-data.ts` — sobrevive a edição de conteúdo/metadado
      (chmod testado, `birthtime` não muda; `ctime` muda), só muda se o
      arquivo for apagado e recriado do zero. Confirmado que este
      filesystem reporta `birthtime` de verdade (não cai pra `ctime`
      como fallback) antes de confiar na abordagem.
- [x] `import-seed-data.ts` reescrito: `bible_books`/`artists` seguem
      truncados (sem identidade externa); `themes` trunca com CASCADE
      (esvazia `artwork_themes` também — tabela de junção, sem
      identidade própria, recriar por obra é seguro); `artworks` agora
      é **upsert** (`INSERT ... ON CONFLICT (id) DO UPDATE`) + `DELETE
      FROM artworks WHERE id NOT IN (validIds)` explícito só pra quem
      saiu do vault — cascade cuida de limpar `bible_references`
      daquelas especificamente. `bible_references` dos sobreviventes é
      limpo em bloco (`DELETE ... WHERE artwork_id = ANY(validIds)`)
      antes do loop reinserir fresco — sem identidade própria, mesma
      simplicidade de sempre, só que escopada.
- [x] **Validado contra Postgres real (não só teoria)**: fixture de 2
      obras, 1ª rodada gera IDs X/Y; 2ª rodada com obra X editada, obra
      Y removida, obra Z nova — confirmado obra X manteve o MESMO ID e
      `createdAt`, só campos editados mudaram; obra Y sumiu de
      `artworks` E de `bible_references` (cascade, sem órfão); obra Z
      entrou com ID/createdAt próprios. Depois, catálogo completo
      (1028 obras) rodado 2x seguidas contra o banco de teste local —
      IDs idênticos entre as rodadas (idempotência confirmada), ~5-9s
      cada rodada (performance irrelevante nessa escala).
- [x] Verificado: `typecheck`/`lint`/`test` (99 unit)/`test:integration`
      (43)/`build:server` verdes depois. `vault-export.json` re-exportado
      com o campo `createdAt` novo (diff limpo, só o campo adicionado,
      nenhuma obra/tema/artista mudou de contagem).

## Incidente do reseed — 4 problemas em cadeia, todos reais (2026-09-03)

> Tentar rodar o reseed em produção pra validar as correções de
> curadoria de hoje expôs uma cadeia de 4 problemas reais, cada um
> escondendo o próximo — só apareceram um de cada vez porque cada fix
> destravava o próximo passo. Registrado com detalhe pra não repetir
> nenhum deles, nem aqui nem em outro projeto.

**1. `pnpm.overrides` no lugar errado.** O fix de CVE de mais cedo hoje
(`fast-uri`) foi colocado em `package.json` → `pnpm.overrides` — exatamente
o campo que um comentário JÁ EXISTENTE em `pnpm-workspace.yaml`, de
16/08, avisava estar obsoleto ("pnpm 10+ não lê mais... movido pra
cá"). Funcionou local (pnpm 10.30.1 aqui ainda lia por algum motivo),
mas o comando de reseed no VPS não fixava versão nenhuma de pnpm —
corepack baixou o "latest" do momento (pnpm 11.25.0, lançado bem
recentemente), que de fato IGNORA esse campo, dando
`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. **Lição: antes de adicionar
config nova, `grep` por convenção já existente no próprio repo — o
aviso já estava escrito, só não foi consultado.**

**2. Sem versão de pnpm fixada em lugar nenhum.** Causa raiz do
problema 1: nada no projeto fixava QUAL pnpm rodar num comando ad-hoc
(o Dockerfile fixa pnpm@10 pra build de produção, mas o comando manual
de reseed não usa o Dockerfile). Corrigido com
`"packageManager": "pnpm@10.30.1"` em `package.json` — corepack passa a
resolver essa versão exata em qualquer lugar que rode `corepack
enable` sem pin próprio.

**3. `pnpm/action-setup@v4` do CI não aceita duas fontes de versão.**
O CI já tinha `version: 10` explícito na config da action — com o
`packageManager` novo, a action passou a recusar rodar ("Multiple
versions of pnpm specified"). Removido o `version: 10` duplicado —
`packageManager` sozinho já é suficiente e é a mesma fonte que
Dockerfile/reseed usam.

**4. O comando de reseed escreve DIRETO no checkout do VPS.** A
primeira tentativa falhada (`ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`)
deixou `pnpm-workspace.yaml` modificado localmente em
`/opt/biblia-na-arte` — porque `-v $(pwd):/app` monta o diretório de
verdade, não uma cópia efêmera; qualquer escrita de um `pnpm install`
que falha no meio persiste ali. Isso bloqueou `git pull --ff-only` nos
2 deploys seguintes — e **"Deploy VPS" reportou sucesso nos dois
mesmo assim**, porque o script SSH não tinha `set -e`: o `git pull`
falhou silenciosamente, e os comandos seguintes (`make deploy`,
`docker prune`) rodaram e terminaram bem por conta própria, sem
propagar o erro. VPS ficou 3 commits atrasado sem nenhum sinal visível
de que algo estava errado. Corrigido: `set -euo pipefail` adicionado
no início do script de deploy (`.github/workflows/deploy.yml`) — de
propósito só documentado aqui, não num checklist de padrão ainda (ver
próxima seção).

**5. Ainda depois de tudo isso, mais um conflito**: com a versão
fixada em 10.30.1, a flag `--config.dangerously-allow-all-builds=true`
(que resolvia um problema específico do pnpm 11.x em 23/08) passou a
CONFLITAR com `onlyBuiltDependencies` já existente em
`pnpm-workspace.yaml` (`ERR_PNPM_CONFIG_CONFLICT_BUILT_DEPENDENCIES`).
Removida do comando — `onlyBuiltDependencies` sozinho já basta com a
versão fixada. RUNBOOK atualizado com o comando corrigido e o porquê,
pra ninguém copiar a versão antiga de algum lugar e reintroduzir o
mesmo problema.

- [x] Reseed final confirmado: **1025 obras, 319 artistas, 295 temas**
      — batendo exato com o export. Verificado direto contra a API de
      produção (Zurbarán → Museo de Cádiz, Rubens → Staatsgalerie
      Neuburg, "chamado de Mateus" do Doré ausente, só sobrou o do
      Caravaggio) antes de considerar concluído.
- [x] `set -euo pipefail` no `deploy.yml` — hardening que não existia
      antes, achado só porque este incidente expôs a lacuna. Ver
      também `hetzner-infra/PADRAO-DE-ENGENHARIA.md` (novo item de
      checklist, mesma seção dos achados de fuso horário/identidade
      estável de hoje).

---

## Submissão de artistas + painel administrativo (implementado e em produção, 2026-09-05)

> **Contexto de negócio**: o Bíblia na Arte cresceu além do esperado e
> chamou atenção do **Efeito Prisma**, organização paraeclesiástica
> brasileira (fé + vida cotidiana + arte, ~75 mil seguidores), que
> propôs uma parceria — trazer o site pro ecossistema deles (marca,
> audiência, possível equipe de curadoria), em troca de visibilidade.
> Proposta ainda em fase de "tenho interesse, me manda uma proposta
> concreta" — nada fechado (controle editorial, monetização, marca e
> reversibilidade ainda em aberto do lado deles). Esta seção documenta
> o que decidimos construir **independente do resultado da parceria**,
> porque o problema é real de qualquer forma: já chegam propostas de
> artistas brasileiros por e-mail/WhatsApp querendo entrar no acervo,
> sem nenhum método formal de submissão hoje.

### O problema de arquitetura que precisou ser resolvido primeiro

O Postgres hoje é só um espelho do vault: todo reseed faz
`TRUNCATE`/remove e reconstrói a partir do `vault-export.json` (ver
`import-seed-data.ts`, etapa "Removendo obras que saíram do vault...").
Se uma submissão de artista fosse inserida direto na tabela
`artworks`, o **próximo reseed do vault apagaria ela**, porque ela
nunca existiu como nota no Obsidian.

Duas soluções possíveis foram consideradas:

- **(A) Submissão vira nota do vault** — mantém uma única fonte da
  verdade, mas exige que toda submissão aprovada seja convertida numa
  nota `.md` de verdade. Problema real dessa opção: quem faz essa
  conversão precisa ter acesso ao filesystem do vault, que **só existe
  no computador do Rilson** (o próprio RUNBOOK já documenta isso — "o
  vault não existe no servidor nem no repo"). Isso inviabiliza dar
  acesso de revisão/aprovação pra qualquer outra pessoa (equipe do
  Prisma, por exemplo) sem o Rilson mediar cada aprovação manualmente.
- **(B) Postgres vira fonte de verdade também pra submissões, convivendo
  com o vault** — escolhida. Não é uma virada completa de arquitetura:
  o `import-seed-data.ts` já faz *upsert* por slug (atualiza o que já
  existe, insere o que é novo) — o único ponto realmente destrutivo é
  a etapa de remoção. A correção é cirúrgica, não uma reescrita.

### Desenho escolhido

1. **Coluna `origem`** na tabela `artworks` (`'vault'` por padrão,
   `'submissao'` pra quem vier do painel). A etapa de "remover o que
   saiu do vault" no reseed passa a filtrar só `origem = 'vault'` —
   nunca toca em obras de submissão, porque elas nunca existiram no
   vault pra "sair" dele.
2. **Tabela `submissions`** (nova, separada de `artworks` — nunca
   servida publicamente até aprovada): dados do submissor
   (nome/e-mail/contato), campos da obra espelhando o schema de
   `artworks` (título, subtítulo/título original, artista, ano,
   categoria, descrição, localização, fonte, referência bíblica
   sugerida com livro/capítulo/versos/texto), **todos opcionais menos
   o mínimo pra ser útil** — os campos existem pra serem preenchidos
   com a mesma qualidade do resto do acervo, mas não bloqueiam a
   submissão se vierem incompletos (mesma lógica de uma nota nova do
   vault: pode nascer rasa, ser enriquecida na revisão). Inclui
   confirmação de direito de imagem (checkbox + timestamp — proteção
   legal, não opcional) e status (`pendente`/`aprovado`/`rejeitado`).
3. **Tabela `users`** (nova, mínima: e-mail, hash de senha, papel) —
   login do painel. Começa só com o Rilson; convite futuro é uma linha
   nova, sem reengenharia.
4. **Dois papéis desde o início**, mesmo com um usuário só por
   enquanto: `revisor` (prepara/edita/sinaliza como pronta) e `admin`
   (só ele publica de fato). Existe porque resolve de saída a pergunta
   "quem tem a palavra final na curadoria" que precisa ser combinada
   com qualquer parceiro — a resposta fica garantida pela arquitetura,
   não só combinada verbalmente.

**Fluxo**: formulário público → `POST /submissions` (limitado por
`@fastify/rate-limit`, já instalado) → cai em `submissions` como
pendente → revisão/edição no painel → aprovação → vira linha real em
`artworks` com `origem = 'submissao'` → aparece no site no próximo
build (sem reseed do vault envolvido).

### Stack — só o que falta, reaproveitando o que já existe

Confirmado antes de sugerir qualquer coisa nova: servidor já é
Fastify + Drizzle ORM + Postgres + Zod; site é React + Vite. Nada de
autenticação ainda. `sharp` já existe mas só como devDependency (usado
no export) — precisa virar dependência de produção pra processar
upload ao vivo.

- **`@fastify/multipart`** — plugin oficial do Fastify pra upload de
  imagem, mesmo ecossistema já em uso.
- **`@fastify/secure-session`** — sessão via cookie assinado, sem
  precisar de tabela de sessão. Mais simples que JWT pro tamanho atual.
- **`crypto.scrypt`** (nativo do Node) pra hash de senha — zero
  dependência nova.
- Nada de framework de admin pronto (Retool/Forest/etc.) — volume não
  justifica.

### Fases de execução

- [x] **Fase 1 — Banco (2026-09-05)**: coluna `origem` em `artworks`
      (`artwork_origem`: `'vault'` | `'submissao'`, default `'vault'`
      — cobre as obras existentes automaticamente); tabela `submissions`
      (25 colunas — só `submitter_name`, `submitter_email`, `title`,
      `image_path` obrigatórios, resto opcional de propósito, régua de
      qualidade acontece na revisão); tabela `users` (`admin`/`revisor`).
      `import-seed-data.ts` ajustado — a etapa de remoção agora só
      afeta `origem = 'vault'`. Migração gerada via `drizzle-kit
      generate` (`0008_special_lady_mastermind.sql`), validada rodando
      de ponta a ponta contra o Postgres de teste isolado
      (`docker-compose.test.yml`, nunca tocou produção) — aplicou sem
      erro, schema conferido via `psql`. `typecheck`/`lint`/`test`
      (99 testes) verdes, nenhum warning novo. Nada commitado nem
      deployado ainda — aguardando sinal do Rilson.
- [x] **Fase 2 — API (2026-09-05)**: implementada e testada de ponta a
      ponta (unitário + smoke test real contra Postgres de teste — login,
      submissão multipart com imagem de verdade convertida pra WebP,
      aprovação criando obra + referência bíblica, tudo confirmado via
      `curl`). Duas correções de rota encontradas só ao implementar:

      1. **Auth por token, não cookie**: a API já roda num subdomínio
         diferente do site (CORS de verdade entre eles) — cookie de
         sessão cross-site exigiria `SameSite=None`+`credentials:true`,
         complexidade sem ganho real nesse volume. Usado
         **`@fastify/jwt`** (token no header `Authorization`) em vez do
         `@fastify/secure-session` do desenho original.
      2. **Imagem de submissão não pode ir pra `web/public/images`**:
         `web` é build estático (nginx, Dockerfile copia `web/dist`
         pronto) — não existe volume gravável ali em produção. A própria
         API (processo Node de verdade, disco gravável) passou a servir
         essas imagens direto, por uma rota nova (`GET /uploads/:filename`,
         só da pasta de aprovadas — nunca da de pendentes).

      Migração de dependências: `@fastify/multipart` (upload) +
      `@fastify/jwt` (login); `sharp` promovido de devDependency pra
      dependência real (processa upload ao vivo, não só no export do
      vault). 15 arquivos novos, 12 testes novos (119 no total),
      `typecheck`/`lint` limpos.

      **Correção sobre a "pendência de GRANT" registrada aqui
      originalmente**: o comentário em `config.ts`/`.env.example`
      dizia que a conexão do Postgres da API era só-leitura
      (`"v1 é somente leitura pública, sem admin exposto"`), e por
      isso o plano era rodar `GRANT INSERT, UPDATE` manual em
      produção antes do deploy. Na hora de executar (ver "Deploy em
      produção" abaixo), `SELECT tablename, tableowner FROM pg_tables`
      mostrou que `biblianarte_app` já é **dono** de todas as tabelas
      — porque é essa mesma credencial que roda `runMigrations()` no
      boot do servidor desde sempre (`server.ts`, todo deploy,
      migrações 0000–0007 incluídas). Dono de tabela no Postgres já
      tem todos os privilégios nela, `submissions`/`users` incluídas
      assim que a migração 0008 as criar. O comentário "só-leitura"
      descrevia uma decisão de **não expor rotas de escrita na API**,
      não uma restrição real de permissão no banco — nenhum `GRANT`
      foi necessário.
- [x] **Fase 3 — Frontend (2026-09-05)**: formulário público em
      `/contribuir/enviar-obra` (card "Sugerir Obras" de `/contribuir`
      agora aponta pra lá em vez de `mailto:`) + painel em
      `/admin/login`, `/admin/submissoes` e `/admin/submissoes/:id`,
      como rotas protegidas dentro do próprio `web/` — sem app novo
      separado, como decidido. Achado útil: existia um
      `_archived-supabase-admin/` (painel morto de 2026-08-07, Supabase
      Auth) cujo próprio README já listava os 3 passos exatos pra
      reativar — a Fase 2 resolveu o passo 1 (API de escrita
      autenticada); reaproveitado o **estilo visual** de lá
      (`Login.tsx`, cards, `shadow-card`) reescrevendo a lógica de auth
      contra o JWT novo, não o código Supabase em si.

      Achado técnico ao implementar: imagem de submissão pendente não
      pode ir num `<img src>` direto — exigiria o token no header
      `Authorization`, que tag de imagem não manda, e pôr o token na
      query string vazaria em log de acesso do servidor. Resolvido com
      fetch autenticado + `URL.createObjectURL` (blob), revogada no
      cleanup do componente.

      Testado de verdade num navegador headless (Playwright, já que
      `chromium-cli` não estava disponível aqui) — as duas páginas
      novas renderizam completas, sem tela branca nem erro do React
      (screenshots conferidos). `typecheck`/`lint`/`build` de produção
      limpos. **Achado colateral, não é regressão**: um erro de console
      minificado (`pageerror`, nome de 2 letras tipo "Yl"/"Wl") aparece
      em QUALQUER página do site, inclusive a home — confirmado
      comparando as páginas novas com a home sem nenhuma mudança minha.
      Pré-existente, não investigado a fundo (fora do escopo desta
      tarefa) — registrado aqui pra não ser confundido com bug
      introduzido pela submissão de artistas.
- [ ] **Fase 4 (futuro, só se a parceria com o Prisma avançar)**:
      convites multi-usuário reais (linha nova em `users`), papéis mais
      granulares se necessário.

### Deploy em produção (2026-09-05)

4 commits no `main`, um por fase (`4624e9b` schema, `e32c9e8` API,
`278951e` frontend, `154a2dc` re-export do vault não relacionado à
feature, feito à parte de propósito) + 2 correções encontradas só ao
deployar de verdade (abaixo). CI (lint/typecheck/test/build/audit) e
Deploy VPS verdes em todos os pushes finais.

**Infra preparada antes do primeiro push** (volume Docker pro upload
em `hetzner-infra/biblia-na-arte/docker-compose.yml`, `JWT_SECRET` +
`PUBLIC_API_URL` no `.env` de produção) — ver correção sobre o `GRANT`
acima, na Fase 2.

**Bug real encontrado em produção, ao vivo, pelo próprio Rilson
testando o formulário** (não em teste automatizado): `POST
/submissions` devolvia "Erro interno" — `EACCES: permission denied,
mkdir './uploads/pending-submissions'`. Causa: volume Docker nomeado
novo nasce vazio e **dono de root**; o processo roda como `USER app`
(não-root, Dockerfile). Corrigido em duas camadas:
1. **Imediata em produção**: `chown -R app:app /app/uploads` no
   volume já existente (via `docker exec -u root`), pra destravar na
   hora.
2. **Definitiva no código** (`c093f31`): Dockerfile agora cria
   `uploads/pending-submissions` e `uploads/approved-submissions` com
   dono certo antes do `USER app` — um volume novo (se este for
   apagado e recriado no futuro) já nasce semeado com essa permissão,
   porque é assim que o Docker inicializa volume nomeado vazio: copia
   conteúdo + dono do que já existe no caminho de destino da imagem.
   Validado com build + run local antes de subir de novo.

**Segunda correção, achada pelo CI, não pelo Rilson** (`837afe5`): o
job de testes de integração do GitHub Actions (Postgres real de
serviço) falhava com `JWT_SECRET: Required` — `integration-setup.ts`
nunca setava essa variável, e local só "funcionava" porque o `dotenv`
carregava por baixo dos panos o `.env` de desenvolvimento (que já
tinha `JWT_SECRET` de outro teste manual). No CI não existe esse
arquivo. Corrigido na raiz (`integration-setup.ts` seta um valor de
teste se não vier definido), não só remendado no workflow — resolve
pra qualquer ambiente que rode `test:integration` do zero.

**Usuário admin real criado** em produção (e-mail do Rilson, role
`admin`) via script one-off temporário, copiado pro container rodando
e apagado logo depois — senha entregue uma única vez, fora do
histórico do repositório.

**Smoke test real em produção**, depois dos dois fixes acima, com
limpeza completa dos dados de teste em seguida (nenhum resquício
ficou no banco nem nos diretórios de upload):
- Login admin → token válido.
- `GET /admin/submissions` autenticado → lista vazia (banco/tabelas
  OK).
- `POST /submissions` inválida de propósito (sem imagem) → `400`
  limpo, confirma validação registrada.
- `POST /submissions` válida, com imagem real → `201`, criada de
  verdade.
- Rejeição de submissão (`POST .../reject`) → `200`, status muda,
  nenhuma obra pública criada.
- **Fluxo completo de aprovação**: nova submissão → imagem pendente
  buscada autenticada (confirma o padrão blob URL/fetch com token) →
  `POST .../approve` → obra criada de verdade, `GET /artworks/:id`
  retornando ela, imagem servida publicamente em
  `GET /uploads/:slug.webp` com `Content-Type: image/webp` — o
  pipeline inteiro (mover arquivo de pendente pra aprovada, slug
  bonito via `slugify`, registro na tabela `artworks` com
  `origem = 'submissao'`) validado com dado real, na infra real.
- Limpeza: obra + submissão de teste removidas via `DELETE` direto
  (ordem importa — `submissions` antes de `artworks`, por causa da FK
  `approved_artwork_id`), arquivos órfãos removidos das duas pastas de
  upload. Confirmado `GET /admin/submissions` vazio de novo e
  `GET /artworks/:id` da obra de teste devolvendo `404`.

**Status final**: feature completa, em produção, testada de ponta a
ponta com tráfego real (não só mocks/Postgres isolado) — pronta pra
receber submissões de artistas de verdade. Formulário público em
`/contribuir/enviar-obra`, painel em `/admin/login` (sem link na
navegação, só por URL direta).

### Bugs achados no primeiro uso manual de verdade (2026-09-05, mesmo dia)

O Rilson testou o formulário e o painel pessoalmente, direto no
navegador, ainda no mesmo dia do deploy — e achou 3 problemas reais
que nenhum teste automatizado (nem os smoke tests em produção feitos
antes) tinha pego, todos da mesma classe: **funciona via `curl`/mock,
quebra no navegador de verdade**.

1. **Imagem aprovada não aparecia no site** — `Cross-Origin-Resource-
   Policy: same-origin` (padrão do `@fastify/helmet`) bloqueava o
   `<img>` do `biblianaarte.narniano.com` de carregar imagem servida
   por `api-biblianaarte.narniano.com` (subdomínio diferente). `curl`
   não aplica CORP, por isso passou despercebido em todo teste
   anterior. Corrigido com `Cross-Origin-Resource-Policy: cross-origin`
   explícito na rota `/uploads/:filename` (pública de propósito).
2. **Obra apagada quebrava a página com erro técnico** (bug
   pré-existente do site inteiro, não só desta feature) —
   `getArtworkById`/`getArtistBySlug`/`getBibleBookBySlug`/`getExplore`
   devolviam `undefined` em 404, e o TanStack Query v5 não aceita uma
   queryFn resolvendo com sucesso mas com `undefined` (vira erro
   interno da lib, `isError` fica `true` antes da página chegar no
   branch de "não encontrado" que já existia). Corrigido devolvendo
   `null` nas 4 funções.
3. **Não tinha como desfazer uma aprovação de teste** — o Rilson
   aprovou uma submissão "Teste" (com telefone real dele) só pra
   validar o fluxo, e perguntou "não tem como apagar???". Não tinha.
   Painel só tinha aprovar/rejeitar. Adicionado `DELETE
   /admin/submissions/:id` — revisor apaga pendente/rejeitada, só
   admin apaga uma já aprovada (mesma régua de quem publica), e nesse
   caso a obra publicada some junto. Botão "Apagar" no painel, com
   confirmação. **2 bugs a mais nascidos ao construir essa correção,
   achados antes de qualquer usuário bater neles**:
   - CORS só liberava `GET/POST/PATCH` — `DELETE` seria bloqueado pelo
     preflight do navegador (mesma classe dos 2 achados acima).
   - `promoteSubmissionImage` gerava o nome do arquivo só de
     `slugify(artista-título)`, sem checar duplicata — duas obras com
     o mesmo artista+título (ou ambas "autor desconhecido" + título
     igual) gerariam o mesmo slug, e a segunda aprovação sobrescreveria
     o arquivo da primeira **em silêncio**, sem erro nenhum avisando.
     Corrigido com sufixo do id da submissão (sempre único) no nome.
   - E, ironicamente, a própria correção do "apagar" teve um bug na
     primeira versão: apagava a obra antes da submissão que a
     referencia, violando a FK `approved_artwork_id` (500 em
     produção). Corrigido invertendo a ordem, e dessa vez com teste de
     integração contra Postgres real (não mock) cobrindo esse caminho
     — reproduziu o erro de FK antes da correção, prova de que só um
     banco de verdade pega esse tipo de bug.

Todos os 3 achados originais + as 3 correções derivadas foram testados
em produção de verdade (submissão real → aprovação real → imagem
carregando com o header certo → delete real → obra some), com limpeza
completa depois de cada teste.

### O que esse desenho resolve — e o que NÃO resolve, pra não vender ilusão

**Resolve**: alguém de fora (equipe do Prisma, por exemplo) consegue
revisar/aprovar submissões **novas** sem precisar de acesso ao
computador do Rilson nem ao Obsidian. Reversibilidade também sai de
graça — revogar acesso de alguém é apagar uma linha em `users`; a
infraestrutura inteira (VPS, domínio, código) continua 100% do Rilson
o tempo todo.

**NÃO resolve**: curadoria colaborativa do **acervo já existente**
(os 1000+ que vêm do vault) — essas notas continuam só no Obsidian do
Rilson. Se a parceria implicar em alguém do Prisma querendo editar ou
corrigir obras já catalogadas (não só trazer obra nova), esse desenho
cobre só metade do problema. Registrado aqui pra não ser descoberto
como surpresa depois.

## Ajustes de UI vendo o site no ar (2026-09-05, mesmo dia)

O Rilson revisou o site já com a submissão de artistas no ar e pediu 3
coisas — uma delas descartada por investigação, duas implementadas.

**1. "Fonte do header parece diferente entre os itens" — investigado,
não é bug.** `Navegar pela Bíblia`, `Galeria de Arte` e `Sobre o
Projeto` têm exatamente a mesma classe CSS (`text-display text-sm
font-medium`) — conferido via computed styles no navegador (Playwright):
`14px`, peso `500`, `Cormorant Garamond` idênticos nos três. A
impressão de tamanho diferente é ilusão de ótica da serifada em corpo
pequeno, com letras de proporção diferente entre as palavras — não
alterado.

**2. Página "Como Contribuir" simplificada.** Tinha demais: grade de 4
formas de contribuir, diretrizes, processo em 3 passos e seção de
reconhecimento. Reduzida a 3 elementos: card grande de "Sugerir uma
Obra" (destaque, linka pro formulário), card de e-mail, card de Pix.

**3. Diretório de Pintores, novo, em `/pintores`.** Pedido do Rilson
olhando o rodapé ("Explorar" tinha Livros da Bíblia/Pinturas/Busca
Avançada, mas nenhum jeito de chegar em "quero ver quem pintou" sem
passar por uma obra específica). `/artista/:slug` já existia — faltava
só o índice. Grade compacta + filtro por nome (mesmo padrão de
`BibleBooks.tsx`), ordem alfabética. Depois de ver a página no ar, o
Rilson pediu a mesma "capa" translúcida que os cards de livro bíblico
têm — adicionada usando a 1ª obra de cada pintor encontrada em
`useArtworks()` (sem endpoint dedicado pra isso, e sem necessidade de
criar um só pra decoração).

Testado com dado real de produção antes de cada deploy (307 pintores,
~1000 obras), via mock de rede no Playwright — sem tocar CORS nem
banco local pra isso. `typecheck`/`lint`/`build` limpos em todos os 3
commits, sem warning novo.

## Gestão de usuários do painel + fix de revogação (2026-09-06)

Pergunta direta do Rilson ("onde crio novo usuário?") escancarou que
não tinha resposta — só o script one-off manual usado pra criar o
primeiro admin. Construída a tela de verdade: `GET/POST /admin/users`
e `DELETE /admin/users/:id`, todas `requireAdmin` (mesma régua de quem
publica). Sem edição de papel/senha de propósito — revogar acesso é
apagar e recriar, menos superfície de erro. UI em `/admin/usuarios`,
link só visível pra quem é `admin` na fila de submissões.

**Achado de segurança real, descoberto construindo isso**: `authenticate`
e `requireAdmin` (jwt-auth.ts) só conferiam a **assinatura** do JWT,
nunca se a conta ainda existia no banco. Na prática, a promessa
registrada mais acima ("revogar acesso é apagar uma linha em `users`")
**não era totalmente verdadeira** — um token já emitido (validade de
7 dias) continuava autenticando normalmente depois da conta apagada,
até expirar sozinho. Corrigido: os dois preHandlers agora revalidam
contra o banco a cada requisição (`findUserById`), e o papel usado em
`request.user.role` passa a ser sempre o do banco, nunca o que veio
(potencialmente desatualizado) dentro do token. Custo de um `SELECT` a
mais por requisição — irrelevante pro volume de tráfego do painel
administrativo (não é a API pública de leitura).

Travas adicionadas na criação/remoção:
- Senha de conta nova exige 12+ caracteres (mais rígido que login).
- E-mail duplicado devolve `409`, não sobrescreve.
- Ninguém apaga a própria conta logada (`400`).
- Ninguém apaga o último `admin` restante (`400`) — evita o painel
  ficar sem ninguém que possa aprovar/publicar ou criar admin novo.

Testado em duas camadas: 8 novos testes unitários com mock
(`admin.test.ts`, cobrindo os 400/403/409/201/204 de cada rota) e 2
testes de integração contra Postgres real (`queries.integration.test.ts`)
provando que `findUserById` — a mesma função que os preHandlers chamam —
realmente não encontra mais o usuário depois de `deleteUser`. Validado
também de ponta a ponta num navegador real (Playwright), com servidor
local + banco de teste isolado, nunca produção: login → criar usuário →
botão de apagar a própria conta desabilitado → apagar outro usuário →
some da lista de verdade.
