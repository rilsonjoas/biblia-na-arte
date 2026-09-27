# Roadmap de Produção — Bíblia na Arte

> **Status atual: site em produção, Fases 0 a 5 concluídas, Fases 6 a 9
> abertas** (2026-09-27)
>
> **Este documento é o plano, e só o plano.** O que ainda falta está nas
> Fases 6 a 9. O que já aconteceu — achados, incidentes, decisões, cerca
> de 3.900 linhas — foi movido para [`docs/registro/2026-08.md`](registro/2026-08.md)
> e [`docs/registro/2026-09.md`](registro/2026-09.md), na data e na ordem
> em que aconteceram, sem reescrita. A separação foi em 2026-09-27: até
> então este arquivo fazia as duas coisas e tinha 4.758 linhas, das quais
> 83% eram diário.
>
> A tabela `## Status` abaixo é a autoridade. Ela não é regerada desde
> agosto — o que foi para o ar depois está anotado logo abaixo dela.
>
> O `README.md` do repo e a nota `Bíblia na Arte.md` no vault Obsidian
> apontam pra cá. Toda fase concluída deve marcar os itens e atualizar o
> `## Status`.
>
> As fases 0/4 abaixo já cobrem, na prática, o mesmo padrão comum
> documentado em `hetzner-infra/PADRAO-DE-ENGENHARIA.md` (CI, testes,
> OpenAPI, Sentry-equivalente, backup) — não precisou reestruturar nada
> aqui, este roadmap já nasceu no formato certo.

## Status

| Fase | Status | Início |
|---|---|---|
| 0 — Engenharia base | ✅ concluída | 2026-08-07 |
| 1 — Conteúdo e navegação | ✅ concluída | 2026-08-08 |
| 2 — UI/UX profissional | ✅ concluída | 2026-08-08 |
| 3 — Performance e SEO | ✅ concluída (7 de 7 itens, nenhum aberto) | 2026-08-22 |
| 4 — Segurança/observabilidade/infra | ✅ concluída (2 itens adiados/decididos conscientemente: métricas Prometheus, moldura arco literal) | 2026-08-22 |
| 5 — Produto | ✅ concluída — o que estava aberto virou as Fases 6 a 9 | 2026-08-22 |
| 6 — Expansão de acervo e curadoria | 🟡 aberta (5 itens) | 2026-09-27 |
| 7 — Comunidade e curadoria colaborativa | 🟡 aberta (7 itens) — bloqueada pela Fase 9 | 2026-09-27 |
| 8 — Acessibilidade ampliada | 🟡 aberta (2 itens) | 2026-09-27 |
| 9 — Jurídico e parcerias | 🟡 aberta (1 item) — destrava a Fase 7 | 2026-09-27 |

> **Por que as Fases 6 a 9 existem.** A Fase 5 cresceu até virar "tudo
> que é produto" — 23 itens entregues e 15 abertos, misturados na mesma
> lista, e o aberto era de natureza muito diferente: curadoria manual no
> vault, Feature de comunidade, acessibilidade e jurídico com advogado.
> Uma fase que não distingue "ajustar um texto" de "depender de um
> advogado" não serve pra priorizar. Os 15 abertos foram movidos para
> fases novas, e cada uma guarda a faixa de dificuldade que herdou da
> fila priorizada (🟡 Nível 2, 🔵 Nível 3, 🟠 Nível 4, 🔴 Nível 5).
>
> **A ordem não é de dificuldade.** Fase 6 é a mais barata (2 dos 5 itens são
> curadoria manual, sem código). Fase 7 é a maior em número de itens e
> está **bloqueada pela Fase 9**, que precisa de advogado. Fase 8 é a
> mais cara (Nível 5). Fase 9 tem 1 item e é o que trava a 7.

> **Histórico desta correção (2026-09-27).** A tabela ficou desatualizada
> de agosto até esta data. As fases 3 e 5 foram regeradas por contagem de
> checkbox no corpo deste documento, não por impressão:
>
> - **Fase 3 tem contagem confiável: 7 de 7, nenhum aberto.** A seção é
>   uma só, sem `##` aninhado, então a contagem de checkbox fecha. Foi
>   executada por completo em agosto — pipeline de imagens em WebP na
>   fonte, correção das colisões de slug que faziam obra aparecer com
>   imagem errada, remoções de duplicatas. Vira ✅.
>
> - **Fase 5 não tem contagem confiável, e por isso a célula não tem
>   número.** A fase está espalhada por várias seções de nível 2 — `## Fase
>   5`, `## 🎯 Fila Priorizada de Execução`, `## Ideias de produto`, `##
>   Integração com o Lecionário`, `## Estratégia` — e não existe fronteira
>   única. Três métodos de contagem legítimos deram três números: contando
>   até o fim do arquivo, até `## Status`, e até o próximo `##`. Medir exige
>   decidir se "Ideias de produto" e "Estratégia" contam como Fase 5, e isso
>   muda o resultado de 5 a 190. **Um número aqui seria falsa precisão**,
>   então a célula registra qualitativamente o que se sabe: houve entrega
>   grande em agosto e setembro (painel administrativo com submissão de
>   artistas, metadados expandidos, coleções, favoritos, PWA), e o que
>   sobrou é escopo novo (música sacra, newsletter, TTS, termo de cessão,
>   `altText`) e parte dele é gestão manual do Rilson no vault, não código.
>   Se o Rilson quiser o número, é uma decisão de escopo antes de ser uma
>   contagem.
>
> O que foi para o ar entre a última vez que a tabela foi escrita e esta
> correção: publicação automática no Instagram e Threads (2026-09-03),
> painel administrativo com submissão de artistas (2026-09-05), ajustes de
> UI verificados no ar (2026-09-05), gestão de usuários e fix de revocação
> (2026-09-06), fim do Facebook na publicação automática (2026-09-11),
> compartilhamento manual (2026-09-26).
>
> - **Duplicatas removidas (2026-09-27).** "Expansão para Música Sacra em
>   Domínio Público (IMSLP)" aparecia 2× e "Newsletter semanal por e-mail"
>   também 2×, cada uma em lista diferente e com detalhe diferente. O Rilson
>   confirmou que não era intencional. Ambas foram unificadas no item
>   canônico de cada lista, guardando o detalhe que existia só na cópia
>   removida (as três fontes de áudio do `EmbedPlayer` e `category:
>   'music'`; o alias `biblianaarte@narniano.com` e o argumento de canal
>   próprio). Nenhum item foi perdido: os dois passaram a ter o texto
>   completo, e não há mais contagem dupla inflando o que falta.
>
> - **Duplicação que sobrou, e é outra coisa.** A Fase 5 tem uma
>   lista-resumo no topo (com o detalhe de implementação em sub-bullets) e
>   depois as listas por Nível (com uma linha por item, e marcação de
>   "Concluído"). "Metadados Expandidos", "Coleções e Playlists Temáticas"
>   e "Favoritos locais" aparecem nas duas. **Não toquei nessas**: aí a
>   repetição parece indexação (resumo detalhado + índice priorizado), não
>   erro. Vale o Rilson decidir se quer as duas listas ou só uma.

---

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

---

## Decisões travadas (2026-08-07)

- **Trecho bíblico:** texto curado no vault/export (extrair do bloco
  "Contexto Bíblico" das notas → coluna `passage_text`), sem API externa.
- **Descrições:** armazenar markdown e renderizar com `react-markdown` no
  cliente (sem `dangerouslySetInnerHTML`).
- **Ordem de execução:** Fase 0 (engenharia) primeiro, depois Fase 1.
- **SEO:** importa — o site deve ser indexado no Google (Fase 3 é prioridade).

---

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

---

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
  - [ ] **Revisão Editorial e Humanização de Conteúdo (Skill/Regra Humanizer)**:
        aplicar diretrizes estritas de linguagem nas descrições do vault, banindo
        clichês de IA (ex: "profundo significado", "jornada emocionante", "obra tocante"),
        priorizando observação visual objetiva, sobriedade hermenêutica e fontes primárias.
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

---

## Fase 1.5 — UX/UI, Acessibilidade e Polimento Fino de Uso

> **Foco**: Experiência visual surpreendente, micro-interações e acessibilidade total (WCAG AA).

- [x] **Micro-interações de Interface**:
  - [x] **Animações suaves e rápidas no alternador de tema** (`ThemeToggle.tsx`): transição de rotação e escala refinada com `duration-200` e curva `--ease-liturgico` (teste unitário em `ThemeToggle.test.tsx`).
  - [x] **Feedback visual e vibração hática** (`copy-button.tsx`): toast rápido e feedback de vibração (`navigator.vibrate(40)`) ao copiar citações ou links (teste unitário em `copy-button.test.tsx`).
- [x] **Polimento Visual "Museu Digital" (Eye Candy Sutil & Baixo Custo)**:
  - [x] **Ambient Glow Dinâmico (`ArtworkDetail.tsx`)**: iluminação difusa sutil (`blur-2xl opacity-30`) atrás da moldura no tema escuro usando a própria imagem WebP em cache (0 KB de dependências extras, carregamento instantâneo).
  - [x] **View Transitions Nativas (`ArtworkCard` → `ArtworkDetail`)**: transição fluida da imagem da obra usando a View Transitions API nativa do React Router / browser (`view-transition-name: artwork-img-${id}`) com curva litúrgica e duração rápida (200-300ms).
  - [x] **Refino de Física e Inércia no Pan/Zoom (`ArtworkLightbox.tsx`)**: resposta 1:1 imediata sem delay durante o arrasto ativo e desaceleração suave (`--ease-liturgico`) ao soltar ou alterar zoom.
- [x] **Desempenho Visual & Loading States**:
  - [x] **Skeleton loaders com efeito *shimmer* litúrgico** (`ArtworkImage.tsx` e `index.css`): gradiente dourado suave (`hsl(var(--accent) / 0.15)`) durante o carregamento de imagens.
  - [x] **Transição com fade-in progressivo** na abertura e fechamento da Lightbox (`ArtworkLightbox.tsx`).
- [x] **Acessibilidade & Rigor de Design (WCAG AA)**:
  - [x] Auditoria de contraste nos badges de categorias e referências bíblicas (taxa >= 4.5:1 em ambos os temas).
  - [x] Suporte completo a navegação por teclado e leitor de tela no `CommandPalette` (`⌘K`).

---

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

---

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

---

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

---

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

---

---

## Fase 5 — Produto

**Objetivo:** features que transformam catálogo em plataforma.

**Status: concluída.** O que ainda estava aberto nesta fase foi movido
para as Fases 6 a 9 em 2026-09-27, quando o roadmap foi separado em
plano e registro. Cada fase nova carrega a faixa de dificuldade que
herdou da fila priorizada.

- [x] **Metadados Expandidos de Arte e Teologia (concluído 2026-09-24)**:
      - Suporte no frontmatter do Vault: `periodo` (ex: Barroco, Renascimento), `tradicao` (ex: Católica, Ortodoxa, Protestante), `tecnica` (ex: Óleo sobre tela, Afresco, Mosaico) e `pais` de origem.
      - Parser `vault-parse.ts` + schema Drizzle Postgres (`artworks` com colunas `period`, `tradition`, `technique`, `country`), rotas Fastify e serialização OpenAPI.
      - UI/Frontend: exibição estruturada e tipada dos metadados na ficha técnica da obra (`ArtworkDetail.tsx`).
- [x] **Coleções e Playlists Temáticas (concluído 2026-09-24)**:
      - Curadoria e agregação de obras em trilhas narrativas ("A Vida de Cristo", "As Parábolas de Jesus", "Gênesis e as Origens").
      - Rotas no backend Fastify (`GET /api/v1/collections`, `GET /api/v1/collections/:slug`), dados enriquecidos e tipados.
      - Páginas `/colecoes` e `/colecoes/:slug` no frontend com contagem de obras, badges e navegação fluida.
- [x] ~~Modo devocional/leitura~~ — **decisão: tirar da lista (2026-08-23)**,
      Rilson descartou ao revisar a Fase 5.
- [x] **Compartilhamento com OG-image dinâmica & Exportação para Stories (concluído 2026-09-24)**:
      - Rota dedicada no backend (`GET /share/obra/:id` em `share.ts`) interceptada por crawler bots (WhatsApp, Telegram, Facebook, Twitter) com metatags `og:image`, `og:title` e `og:description` específicas por obra.
      - Botão "Compartilhar como Story" (`DownloadStoryButton.tsx` + `ArtworkShareCard.tsx`) gerando imagem 9:16 formatada via `html2canvas` com disparo via Web Share API / download PNG.
      - Botão de download da imagem original em alta definição (`DownloadArtworkButton.tsx`).
- [x] **Favoritos locais** — `utils/favorites.ts` + `Favorites.tsx`, `FavoriteButton.tsx`,
      `FavoriteButton` no header (desktop) e na ficha da obra, página `/favoritos`
      dedicada. Verificado no código 2026-09-24 (ROADMAP estava desatualizado).

---

## Fila Priorizada de Execução — registro do que entregou (2026-09-11)

> **Decisão estratégica (2026-09-11):** ordem de avanço estrita,
> priorizando melhorias rápidas de UX/UI e refinamento de
> linguagem/curadoria no vault antes das expansões maiores de produto e
> integrações jurídicas/externas.

> **O que sobrou aberto saiu daqui.** Os itens abertos desta fila foram
> movidos para as Fases 6 a 9. Esta seção virou registro do que a fila
> entregou; as faixas de dificuldade (🟢 a 🔴) foram preservadas porque
> é delas que as fases novas tiram a prioridade.

### 🟢 Nível 1: Muito Fácil (Ajustes de UI e Otimizações de Código) — Concluído (2026-09-11; adições 2026-09-14)
- [x] **Feedback visual ao copiar citação/link**: aviso tipo *toast* com vibração hática no celular (`navigator.vibrate`) ao clicar em "copiar citação", "copiar link", imagem ou chave Pix.
- [x] **Capa translúcida nos cards dos livros bíblicos**: refinada em `BibleBooks.tsx` com imagem de fundo translúcida (`opacity-[0.14]`), mantendo simetria com `/pintores`.
- [x] **Ordenação da estante por "Livro com mais obras"**: seletor de ordenação ("Ordem Canônica" × "Mais Obras") adicionado em `BibleBooks.tsx`.
- [x] **Efeitos visuais de carregamento**: skeleton loaders com efeito *shimmer* customizado em `ArtworkImage.tsx` (`animate-shimmer`) e animação de fade/zoom-in na abertura do `ArtworkLightbox.tsx`.
- [x] **Ordenação alfabética (A–Z) na página de pinturas** (adição 2026-09-14): seletor "Mais Recentes" × "A–Z" adicionado em `Search.tsx` (rotas `/arte/:category` e `/busca`), com o helper `sortByTitleAz()` em `web/src/lib/utils.ts` (ordena por título via `localeCompare` pt-BR, sem mutar o array do React Query, paginação preservada). Complementa os filtros existentes (Período/século, Livro, Tema, Artista, Categoria) — pedido do Rilson: ver pinturas em ordem alfabética com filtros, inclusive por época.
- [x] **Legibilidade dos versículos bíblicos** (adição 2026-09-14): removida a itálica do trecho bíblico na página da obra (`ArtworkDetail.tsx`), mantendo `font-serif` + box `bg-muted/20` e borda — EB Garamond itálica inteira era o que comprometia a leitura. Fica consistente com a página de capítulo (`Chapter.tsx`), que já renderizava passagens sem itálico.

### 🟡 Nível 2: Fácil a Média (Curadoria de Conteúdo e Linguagem) — Parcialmente Concluído (2026-09-11)
- [x] **Sanitização de Clichês de IA (Skill/Regra Humanizer — Passada 1)**: auditadas as 1.238 notas do vault; 14 obras identificadas com clichês de IA ("profundo significado", "jornada de fé", "nos convida a") foram sanitizadas para linguagem sóbria, objetiva e factual.
- [x] **Auditoria e Correção de Cabeçalhos/Stubs (Passada 2)**: corrigido cabeçalho estrutural em nota e confirmado que 100% das 1.238 obras de pintura agora possuem descrições completas e válidas extraíveis pelo parser.

### 🔵 Nível 3: Média (Novas Funcionalidades de Engenharia e Banco de Dados)
- [x] **Favoritos locais (`localStorage` / PWA)**: permitir salvar obras favoritas no próprio navegador/celular, sem necessidade de login. **Concluído** — `web/src/hooks/use-favorites.ts`, `web/src/pages/Favorites.tsx`, `web/src/components/FavoriteButton.tsx` (verificado no código 2026-09-24; item abaixo na lista do Nível 3 sinalizava pendência, ROADMAP desatualizado).
- [x] **Metadados Expandidos (Período/Estilo, Tradição Religiosa, Técnica, País)**: adicionar suporte no frontmatter do Vault → parser `vault-parse.ts` → migração Drizzle Postgres (`artworks`) → badges e filtros na UI. **Concluído (2026-09-24)**.
- [x] **Coleções e Playlists Temáticas**: criar páginas de coleções como *"A Vida de Cristo"*, *"As Parábolas"* e *"Gênesis na Arte"*. **Concluído (2026-09-24)**.
- [x] **Geração de imagens dinâmicas para redes sociais (OG-Image) & Stories**: geração automática do preview visual (quadro + título) via `server/src/routes/share.ts` ao compartilhar links em redes + exportação 9:16 com `DownloadStoryButton.tsx`. **Concluído (2026-09-24)**.

### 🟠 Nível 4: Média a Alta (Processos Jurídicos, Integrações e Parceiros) — movido

> Os dois itens deste nível não foram fechados: viraram as Fases 7
> (Newsletter) e 9 (termo de cessão SOPRARTE). O nível aparece aqui só
> pra registrar que existiu e pra onde foi — os Níveis 4 e 5 tinham só
> itens abertos, então não há entrega a listar.

### 🔴 Nível 5: Alta (Recursos Avançados e Acessibilidade Plena)
- [x] **Acessibilidade plena WCAG AA nos modais e busca (`⌘K`)**: suporte completo a leitores de tela (TalkBack/NVDA) no `CommandPalette`, lightbox e formulários, com contraste auditado. (Concluído na Fase 1.5 e Fase 2).

> Os **Níveis 4 e 5** tinham itens abertos que hoje são Fase 7
> (Comunidade), Fase 8 (Acessibilidade) e Fase 9 (Jurídico).

---

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


---


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

---

## Fase 6 — Expansão de acervo e curadoria

**Objetivo:** crescer o acervo e a qualidade editorial — mais meios, mais

**Herdou da fila priorizada:** 🟡 Nível 2 (fácil a média, curadoria) e

🔵 Nível 3 (média, engenharia). É a mais barata das quatro — dois dos

cinco itens são gestão manual no vault, sem código.

> "Gestão manual do Rilson" é trabalho de curadoria no vault, não de

> código: entra na fila quando tu for fazer, não quando houver sprint.

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


- [ ] **Preenchimento de versículos nas 185 obras com apenas capítulo (Passada 3)**: reservado para gestão manual do Rilson no vault.
- [ ] **Tradução dos títulos em inglês (Passada 4)**: reservado para gestão manual do Rilson no vault.
- [ ] **Expansão do acervo de Gustave Doré**: catalogar mais gravuras bíblicas de Doré para aumentar a cobertura nos livros históricos e proféticos.


- [ ] **Expansão para Música Sacra em Domínio Público (IMSLP)**: catalogar oratórios, missas, cantatas e obras musicais sacras (Bach, Handel, Mozart) associadas a livros/capítulos bíblicos, com `category: 'music'` no banco, e implementar player de áudio dedicado (`EmbedPlayer`, com reprodução via IMSLP, YouTube e Internet Archive).

---

## Fase 7 — Comunidade e curadoria colaborativa

**Objetivo:** trazer artistas vivos e independentes para o acervo, com

consentimento formal, curadoria editorial e um canal de distribuição que

seja do projeto.

**Herdou da fila priorizada:** 🟠 Nível 4 (média a alta, integrações e

parceiros).

> **A premissa muda aqui, e é o ponto que trava a fase.** O acervo todo é

> domínio público; artista vivo tem copyright próprio, então a inclusão

> depende de autorização, não só de curadoria interna. Por isso o termo

> de cessão (Fase 9) é pré-requisito desta, não item paralelo.

- [ ] **Newsletter semanal por e-mail**: integração de captura de e-mails e disparo da *"Pintura da Semana + Versículo + Contexto"* — 1 obra + 1 verso + 3 linhas de reflexão, toda semana (sinergia com a parceria Efeito Prisma). Hoje a distribuição é 100% terra alugada (Instagram/Pinterest); e-mail é canal próprio, combina com o ritmo devocional do produto e independe de algoritmo. Enviar via alias `biblianaarte@narniano.com`.

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

---

## Fase 8 — Acessibilidade ampliada

**Objetivo:** servir quem não vê, e servir bem quem usa tecnologia

assistiva. A Fase 4 entregou WCAG AA nos modais e na busca; isto é o que

ficou além dela.

**Herdou da fila priorizada:** 🔴 Nível 5 (alta) — a mais cara das quatro.

- [ ] **Audiodescrição e TTS Enriquecido de Obras Sacras**: sistema de audiodescrição para pessoas com deficiência visual ouvirem a composição, cores e símbolos da pintura sacra.
- [ ] **`altText` curto por obra — a imagem que descreve a pintura, e não só o título** (achado 2026-09-25, ao auditar o consumidor — o **Lecionário**):
  - **O que está errado hoje:** `alt={artwork.title}` em toda parte — `web/src/components/PinturaDoDia.tsx:61`, `ArtworkDetail`, `Collections`, `BibleBooks`. Para quem não vê, "O bom samaritano" não diz nada sobre a pintura. E no consumidor é **pior**: no `ArtSection` do Lecionário o `alt` é o título *e* o título é o `<h3>` logo abaixo — o leitor de tela ouve a mesma frase duas vezes e nenhuma descrição. 1.1.1 (A).
  - **O que já existe (e não é pouco):** o campo `description` está na API e está preenchido em **1090 de 1090 obras** (mediana 1496 chars), e o texto descreve a cena ("A composição retrata o episódio de Gênesis 41:1-42…"). O problema nunca foi falta de descrição — é que **`description` não serve como `alt`**: 253 a 4000 caracteres, com `**markdown**`, número de inventário do museu. Alt é conciso; parágrafo no `alt` é má técnica.
  - **O que fazer:** campo novo `altText` (≤200 chars, descrevendo **o que se vê na tela** — não o assunto abstrato), preenchido a partir da primeira frase da `description` com o markdown limpo, exposto na API e **usado como `alt` em todas as páginas daqui**. A `description` longa continua sendo texto visível, que é onde ela rende.
  - **Por que aqui e não no consumidor:** o alt nasce com a obra. Corrigir no consumidor dá o mesmo texto para todo mundo e deixa a decisão editorial onde ela pertence. O Lecionário já está consumindo `description` e pode melhorar hoje — mas o texto certo é este campo.
  - **Bug do mesmo tipo no app:** `ArtCard.tsx` (lecionario-mobile) monta a `<Image>` **sem `accessibilityLabel` nenhum** — o leitor de tela anuncia só "imagem".


---

## Fase 9 — Jurídico e parcerias

**Objetivo:** o que precisa de advogado ou de contraparte, e por isso não

avança por sprint de engenharia.

**Herdou da fila priorizada:** 🟠 Nível 4 (média a alta).

- [ ] **Fluxo e termo para coletivos de artistas vivos (Caso SOPRARTE)**: validação de termo de cessão não-exclusivo e mandato com advogado (Lucas Vianna) + armazenamento do termo e categoria no painel `/admin`.

> **Dependência:** esta fase destrava a Fase 7. Enquanto o termo de cessão

> não existir, o formulário de submissão não pode ir ao ar — aceitaria

> obra de artista vivo sem autorização, que é o problema que a Fase 7

> existe pra resolver.

---

## Como executar

```bash
# 1. Postgres de teste (Fase 0). O compose fica em server/, não na raiz.
#    O -v é obrigatório na primeira vez e sempre que a senha falhar: o
#    volume anônimo guarda a senha antiga e o Postgres só aplica
#    POSTGRES_PASSWORD na inicialização, então o container sobe com a
#    senha velha e a autenticação quebra com
#    "password authentication failed for user biblia_test".
docker compose -f server/docker-compose.test.yml down -v
docker compose -f server/docker-compose.test.yml up -d

# 2. Testes. pnpm test na raiz roda server, web E scripts — este último
#    entrou no CI em 2026-09-27, quando a montagem de legenda foi extraída
#    pra scripts/social-caption.mjs. Antes disso, teste de script não
#    rodava no CI e o único caminho que posta em produção não tinha
#    cobertura nenhuma.
pnpm test
pnpm test:scripts        # só o de scripts, mais rápido
pnpm test:integration    # precisa do Postgres do passo 1

# 3. O CI roda exatamente, nesta ordem:
#    pnpm lint → pnpm typecheck → pnpm test → pnpm test:integration
#    → pnpm build:web → pnpm build:server
```

Pipeline de dados (desktop do Rilson, curadoria manual — não faz parte do deploy):

```bash
pnpm --filter server export:vault   # lê o vault → web/public/images + vault-export.json
pnpm --filter server db:seed        # importa o JSON no Postgres (VPS)
```
