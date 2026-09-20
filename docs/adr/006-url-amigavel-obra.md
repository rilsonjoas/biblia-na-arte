# 006 — URL amigável de obra, UUID nunca aposentado

**Data:** 2026-09-20

## Contexto
`/obra/:id` sempre aceitou só UUID (`468f4fd5-7944-...`) — nada legível,
nada que alguém compartilhe de bom grado. O sitemap já calculava um slug
determinístico por obra (`slugify(artista-título)`, ADR 004) pro nome do
arquivo de imagem, e o `id` da obra já é derivado desse mesmo slug via
UUID v5 (`artworkIdFromSlug`, achado 2026-09-03). No entanto o slug nunca
chegou a ser persistido em `artworks` nem exposto pela API — a geração do
sitemap (2026-09-19) passou a linkar `/obra/<slug>` mesmo assim, o que
quebrava na hora de clicar: a rota só validava UUID.

## Decisão
Guardar o slug de verdade numa coluna nova (`artworks.slug`, nullable,
UNIQUE) e fazer `/obra/:id` aceitar **os dois formatos no mesmo
parâmetro** (`getArtworkBySlugOrId`, decide qual coluna consultar pelo
formato do valor). Nenhum link antigo com UUID — inclusive os 2.115+ já
indexados no Google antes da mudança de sitemap — deixa de funcionar.
Slug vira o padrão em todo link novo gerado pelo site (`artworkHref()` no
frontend, `share.ts` na preview de link) e no `<link rel="canonical">` da
página, mas sem redirect: a URL antiga responde 200 normalmente, só não é
mais a canônica.

Obra de origem `vault` recebe slug no `import-seed-data.ts` (já vem
pronto do export). Obra aprovada por submissão gera o próprio slug na
hora da aprovação (`generateUniqueArtworkSlug`, mesma receita + dedupe
contra o banco em vez de contra uma lista em memória). Obra que já
existia antes desta migração e não passa por nenhum dos dois caminhos
(submissão antiga) foi coberta por um backfill único
(`scripts/backfill-artwork-slugs.ts`).

## Consequências
- Nenhuma URL indexada quebra — troca de padrão sem custo de SEO nem de
  link morto em nenhum lugar que já compartilhou um link antigo.
- Consolidação de SEO fica só no `canonical` (sinal fraco comparado a um
  redirect 301 de verdade) — aceitável aqui porque o volume principal
  (obras do vault) só existiu publicamente como slug desde o dia 1 do
  sitemap novo; quem tem link UUID salvo é uma minoria pré-2026-09-19.
- `slug` nullable é uma pequena divida técnica proposital: preferir isso
  a uma migração de dados arriscada bloqueando o deploy. Resolvida pelo
  backfill, que é idempotente e pode rodar de novo sem problema.
