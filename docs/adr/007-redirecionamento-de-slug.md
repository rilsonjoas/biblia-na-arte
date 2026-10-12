# 007 — Redirecionamento de slug antigo, sem 404 e sem perder o histórico

**Data:** 2026-10-12

## Contexto
O slug de uma obra sai de `slugify(artista-título)` e o `id` sai do slug
(`artworkIdFromSlug`, ADR 004 e 006). Corrigir uma nota no vault pode mudar o
slug: o título em inglês que estava colado no nome do arquivo, o nome do artista
errado (`Jan Bruegel, o Velho` virou `Pieter Bruegel, o Velho`), a grafia do artista.
Slug novo é **ID novo** e URL nova.

Na comparação de 2026-10-12 entre o `vault-export.json` de produção (export de
25/09) e o vault corrigido, 10 obras que já estão no ar mudavam de slug e 62
"artistas" de produção são, na verdade, o título da nota (o campo `autor:`
autorreferente) e mudam de slug quando corrigidos. O sistema não tem nenhum
mecanismo para isso:

- `getArtworkBySlugOrId` devolve 404 quando não acha. A URL e o UUID antigos
  morrem, inclusive os links nas legendas do Instagram/Threads já postadas.
- O reseed (`import-seed-data.ts`) apaga as obras de origem `vault` que saíram do
  export, e `daily_artwork.artwork_id` tem `ON DELETE CASCADE`: o histórico da
  "Pintura do Dia" (a janela de 30 dias, registro de 2026-09-29 em
  `docs/registro/2026-09.md`) das obras renomeadas vai junto, e a obra volta com ID novo, fora da janela.
- Nada impede um slug de sumir sem ninguém decidir isso. Foi assim que obras de
  artistas excluídos por direitos ficaram no ar sem que a exclusão as pegasse.

O ADR 006 já fixou o princípio: **nenhuma URL indexada quebra**, e a consolidação de
SEO é feita por `<link rel="canonical">`, sem 3xx.

## Decisão
1. **Tabela `artwork_redirects(old_slug PK, old_id UNIQUE, new_slug)`**, sem chave
   estrangeira para `artworks`. Sem FK de propósito: ela precisa sobreviver ao
   `DELETE` do reseed. Referencia o destino por **slug** (texto estável), não por
   UUID. `CHECK (old_slug <> new_slug)`.
2. **Fonte da verdade versionada:** `server/scripts/slug-redirects.json`
   (`{ "slug-antigo": "slug-novo" }`), revisado em PR como qualquer outro dado. O
   reseed carrega esse arquivo dentro da mesma transação e substitui o conteúdo
   da tabela. Nada é inferido sozinho.
3. **Resolução só em falha:** `getArtworkBySlugOrId` faz exatamente a busca de hoje;
   só se ela não achar, consulta `artwork_redirects` (por slug, ou por `old_id` se
   vier um UUID) e busca a obra ativa pelo `new_slug`. Um slug vivo **nunca** é
   sombreado por um redirecionamento, e destino inativo ou inexistente continua 404.
   Resposta é 200 com o conteúdo da obra nova (o corpo já traz `slug`, e o
   `canonical` da página aponta para ele), na linha do ADR 006. Um único salto: o
   reseed achata cadeias (A→B, B→C vira A→C) e rejeita ciclos.
4. **Reseed protegido (etapa 3):**
   - histórico de `daily_artwork` é remapeado do ID antigo para o novo **antes** do
     `DELETE`;
   - o reseed **falha** se um slug do banco sumir do export sem estar em
     `slug-redirects.json` nem em `removed-slugs.json` (remoção declarada, por
     exemplo direitos autorais). Sumiço sem explicação nunca passa em silêncio;
   - alvo de redirecionamento tem que existir no export; `old_slug` não pode ser um
     slug vivo.
5. Mesmo mecanismo para `/artist/:slug` (etapa 4), porque corrigir o `autor:` muda o
   slug do artista.

## Alternativas descartadas
- **Chave estrangeira para `artworks`:** o `DELETE` do reseed levaria o
  redirecionamento junto, justamente no momento em que ele é necessário.
- **Destino por UUID:** o destino pode ser renomeado de novo e o UUID muda com ele.
  Slug é o que o resto do sistema já trata como identidade.
- **Só 301 no nginx:** não cobre a API, o `social-image`, o preview de link nem o
  UUID antigo, e quebra se o mapa ficar defasado. Fica como reforço (etapa 5), não
  como base.
- **Inferir renomeações por similaridade de texto:** erro silencioso em obra com
  título parecido. A inferência só pode **sugerir** candidatos para revisão humana.

## Consequências
- Corrigir uma nota deixa de custar uma URL: o preço é uma linha no JSON, revisada.
- A tabela cresce com o tempo (uma linha por renomeação). É pequena e indexada; se um
  dia incomodar, entradas sem acesso podem ser aposentadas de propósito.
- O reseed fica mais estrito: pode falhar onde antes apagava em silêncio. É o
  comportamento desejado, e o erro lista exatamente o que falta decidir.
- A resposta 200 sob a URL antiga serve conteúdo duplicado com `canonical` para a
  nova, o mesmo trade-off já aceito no ADR 006. Um 301 de verdade no nginx (etapa 5)
  reforça o sinal de SEO sem mudar nada do resto.

## Plano em etapas e reversão
Cada etapa é um commit/PR que se implanta e se desfaz sozinho.

| Etapa | Entrega | Reversão |
|---|---|---|
| 1 | tabela `artwork_redirects` (migration aditiva) | tabela fica sem uso; `DROP TABLE` |
| 2 | fallback em `getArtworkBySlugOrId` | tabela vazia = comportamento idêntico ao de hoje |
| 3 | carga + remapeamento + trava no reseed | reverter o commit; a tabela vazia não afeta nada |
| 4 | SPA vai ao canônico; artistas | reverter o commit |
| 5 | mapa 301 no nginx | remover o `include` do mapa |

Com `artwork_redirects` vazia (estado das etapas 1 e 2), o sistema se comporta
exatamente como antes. Só a etapa 3 popula a tabela, e só depois do ensaio geral num
dump de produção restaurado em Postgres descartável.

## Estado e ensaio geral (2026-10-12)
Etapas 0 a 3 implementadas. O ensaio geral rodou num dump de produção (1.090 obras, 39
linhas de histórico; `users` e `submissions` sem conteúdo) restaurado em Postgres
descartável, com a migration 0012 aplicada e o export novo gerado do vault de hoje:

| Verificação | Resultado |
|---|---|
| reseed sem o mapa | **abortou**, listando as 10 obras ativas que sumiriam; banco intacto |
| DRY_RUN com o mapa | 14 novas, 10 removidas ativas, 10 inativas, 1 linha de histórico remapeada, 10 redirecionamentos; nada gravado |
| reseed real | 1.084 obras; histórico 39 → 38 (37 intactas, 1 remapeada, 1 removida: a obra de Helmantel, retirada por direitos) |
| API real, 45 verificações | slug e UUID antigos → 200 com a obra nova (×10); obras vivas, 404 dos excluídos e inexistentes, `daily`, listagem e `og:url` dos bots: tudo ok |
| IDs | 20 saíram (10 renomeadas + 10 de direitos), 14 novos, o resto idêntico |
| segundo reseed | 0 novas, 0 removidas |
