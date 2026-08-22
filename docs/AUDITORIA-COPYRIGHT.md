# Auditoria de Direitos Autorais — Acervo de Obras

> **Última auditoria:** 2026-08-22 (850 obras na API)
> **Este documento é a lista oficial de bloqueio.** Antes de incluir
> qualquer obra nova no banco, conferir as seções 🚫 e ⚠️ abaixo e o
> checklist no fim. O arquivo `server/src/db/custom-sql/data-fixes.sql`
> desativa automaticamente tudo que está listado aqui — não remover
> UPDATEs de lá sem atualizar este documento junto.

---

## Critério legal (Brasil)

- **Lei 9.610/98 (LDA), art. 41:** proteção = vida do autor + **70 anos**,
  contados de 1º de janeiro do ano seguinte à morte. Tradução prática:
  **só é domínio público no Brasil quem morreu até 31/12/1955.**
- **Art. 27:** direitos morais são perpetuos — atribuição de autoria é
  sempre obrigatória, mesmo em obra de domínio público.
- **Licenças livres** (CC-BY, CC-BY-SA, CC0) valem com autor vivo, mas
  exigem cumprir os termos (ex.: CC-BY-SA exige attribution visível e
  licença compatível em derivados). Referência de uso correto no acervo:
  Andrei Mironov (`license_type='cc-by-sa-4.0'` + `attribution_text`).
- Reprodução fotográfica fiel de obra 2D em domínio público não gera
  novo direito no Brasil (art. 8, LDA) — mas se a imagem veio de fonte
  que exige licença (ex.: foto de museu com claim próprio), vale a
  licença da fonte.

---

## 🚫 BLOQUEADOS — verificar antes de reincluir JAMAIS sem licença formal

Cada caso abaixo foi verificado individualmente com fonte primária.
"Nenhum arquivo no Commons" = busca na API do Wikimedia Commons não
retornou obra desse autor (não há liberação CC publicada lá).

| # | Artista | Vida | Obra no acervo | Protegido até | Fonte |
|---|---|---|---|---|---|
| 1 | Sylwia Perczak | viva | A Santa Trindade (2026) | morte+70 | obra datada de 2026; zero arquivos no Commons |
| 2 | Cecília Rosa | viva | Uma coisa sei- eu era cego e agora vejo! (2024) | morte+70 | zero no Commons |
| 3 | Ulyana Tomkevych | viva | Transfiguração (2024); O nascimento de Cristo (2016) | morte+70 | zero no Commons |
| 4 | Leah Mitchell | viva | Uma alegoria de Eva e Maria (2022) | morte+70 | zero no Commons |
| 5 | Julia Mann | viva | Um menino nos nasceu (2022) | morte+70 | zero no Commons |
| 6 | Greta Maria Leśko | n. 1979, viva | Transfiguração (2019) | morte+70 | vende giclée comercial no Etsy; zero no Commons |
| 7 | Peter Brown | n. 1967, vivo | Natal (2019) | morte+70 | zero no Commons |
| 8 | Daphne Stephenson | viva | Eu sou o Caminho, a Verdade e a Vida (2019) | morte+70 | zero no Commons |
| 9 | Riki Yarbrough | viva | José, esposo de Maria (2018) | morte+70 | zero no Commons |
| 10 | Larry Cole | vivo | Amor (2010) | morte+70 | zero no Commons |
| 11 | Sedrick Huckaby | n. 1975, vivo | As Mãos Dela Sobre a Palavra (2008) | morte+70 | zero no Commons |
| 12 | James C. Christensen | 1942–2017 | Tocando a orla da veste de Deus (2003) | **2087** | obituários BYU/Deseret News/KSL |
| 13 | Ilya Glazunov | 1930–2017 | Rússia Eterna (1988) | **2087** | NYT/Wikipedia/TASS |
| 14 | John Reilly | 1928–2010 | Milagre de peixes (1978) | **2080** | christian.art marca © John Reilly artist |
| 15 | Lê Phổ | 1907–2001 | A Virgem e a Criança (1938) | **2071** | Wikipedia EN/VI, Sotheby's, Christie's |
| 16 | Eyvind Earle | 1916–2000 | Três homens sábios (1966) | **2070** | site oficial eyvindearle.com, Wikipedia |
| 17 | Kiyoshi Yamashita | 1922–1971 | Fogos de artifício (1950) | **2041** | Wikipedia, museus japoneses |
| 18 | Robert Henderson Blyth | 1919–1970 | À imagem do homem (1947) | **2040** | Art UK; National Galleries of Scotland marca © Estate |
| 19 | Francis Hoyland | **vivo** (n. 1930) | Natividade (1961) | morte+70 | Art UK "b.1930"; exposição em 2025 |

## ⚠️ PENDENTES — tratar como protegidos até verificar data de morte

Obras antigas de artistas obscuros que não foram possíveis de verificar
nesta rodada. Enquanto não confirmado "morte ≤ 1955", permanecem
desativadas (já estão nos UPDATEs do `data-fixes.sql`).

| # | Artista | Obra no acervo | Ano | O que falta |
|---|---|---|---|---|
| 20 | Gao Di'an | Jesus recitando uma lição | 1948 | datas do artista |
| 21 | Lu Hongnian | O nascimento de Cristo | 1941 | datas do artista |
| 22 | Hermann Clementz | Cristo no Getsêmani | ~1900 | datas do artista |
| 23 | Victor Oscar Guetin | Jesus ressuscita a filha de Jairo | ~1902 | datas do artista |

## ✔ Verificados e LIBERADOS (falso alarme desta rodada — não re-bloquear)

- **Josef August Untersberger** (1864–1933): suspeitei de morte em 1957,
  verificação em museum-digital/Wikipedia DE/Alamy confirmou **1933** →
  domínio público ✔
- Lote antigo todo confirmado DP pela data de morte: Margetson (†1940),
  Tanner (†1937), Tissot (†1902), Fugel (†1939), Nesterov (†1942),
  N.C. Wyeth (†1945), Hatherell (†1928), Knights (†1947), Benczúr
  (†1920), Maurice Denis (†1943), Amoedo (†1926), Yumeji (†1933),
  Chambers (†1941), Manigault (†1922), Guérin (†1938), Wilhelmson
  (†1934), Hablik (†1934), Pedro Bruno (†1949), Stachiewicz (†1938),
  Henri Martin (†1943), Burnand (†1921), Vasnetsov (†1926),
  Léo-Paul Robert (†1948), Repin (†1930), Styka (†1925), Kuindzhi
  (†1910), Hole (†1917), Oscar Pereira da Silva (†1939),
  William Ladd Taylor (†1926), Siberdt (†1931)
- **Andrei Mironov** (vivo): único contemporâneo liberado — publica ele
  mesmo sob **CC-BY-SA 4.0** com attribution. Manter `attribution_text`
  SEMPRE preenchido.

### Dívida de dados (menor)

- Obras do Margetson datadas "1950" no banco: ele morreu em 1940 — os
  anos estão errados (licença ok, dado errado). Corrigir anos numa
  passada futura de higienização.

---

## Estado implementado (2026-08-22)

1. Coluna nova `artworks.active boolean default true` (migration 0002)
2. API só devolve `active=true`: listagem, busca por id, busca full-text
   (`search_artworks`) e agregação de artistas
3. `data-fixes.sql` desativa os casos 1–23 acima e marca
   `license_type='in-copyright'` — roda idempotente a cada deploy
4. Registros ficam **inativos, não apagados**: se um dia houver licença
   formal do autor (opção aberta para o futuro — vários são vivos e
   acessíveis), basta `active=true` + `license_type` + `attribution_text`

## Checklist para qualquer inclusão futura

- [ ] Autor morreu ≤ **1955**? → pode incluir como `public-domain`
- [ ] Autor vivo/recente com licença livre **verificável**? Buscar o nome
      na [API do Wikimedia Commons](https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&format=json&srsearch=NOME)
      e no site oficial → incluir com `license_type` correto +
      `attribution_text` obrigatório
- [ ] Nenhuma das duas? → **não incluir** (ou pedir permissão formal ao
      autor/estado antes — registrar resposta aqui neste documento)
- [ ] Conferir coerência ano da obra × datas do autor (obra pós-morte =
      sinal de alerta de dado errado ou atribuição incorreta)
