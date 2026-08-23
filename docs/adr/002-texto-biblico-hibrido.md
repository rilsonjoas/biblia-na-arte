# 002 — Texto bíblico: proxy por capítulo + trecho curado por obra

**Data:** 2026-08-08

## Contexto
Duas necessidades diferentes de texto bíblico no site: (a) o capítulo
inteiro na página `/biblia/:livro/:capitulo`, e (b) o versículo específico
que uma obra retrata, na página da obra. A decisão original (07/08) era
armazenar tudo numa coluna `passage_text` curada no export do vault, sem
API externa.

## Decisão
Híbrido, não uma solução única:
- **Capítulo inteiro**: proxy no server pra Bible-API
  (`server/src/lib/bible-api.ts`, tradução João Ferreira de Almeida,
  domínio público, sem chave), com cache em memória (TTL 24h). Substitui
  o plano original de coluna pro capítulo inteiro — curar 66 livros à mão
  não escala.
- **Trecho por obra**: continua curado, extraído do bloco "Contexto
  Bíblico" de cada nota do vault no momento do export → coluna
  `passage_text` em `bible_references`. Esse sim vale curar — é o
  versículo exato que a obra retrata, não dá pra automatizar sem perder
  precisão.

## Consequências
- Sem dependência de chave/quota de API externa pro uso mais pesado
  (capítulo inteiro, toda visita).
- O trecho por obra mantém a precisão da curadoria manual sem precisar
  reescrever 66 livros de texto bíblico.
- Achado no caminho: `extractPassageText()` tinha um bug de regex que
  quebrava blockquotes com `**` sem fechar — corrigido de vez na função,
  não nota por nota (~100 notas do vault afetadas).
