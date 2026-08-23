# 004 — Dedupe determinístico de slug

**Data:** 2026-08-22

## Contexto
Varredura completa (`parseTitleParts` + `slugify` + listas de exclusão)
achou 7 colisões reais de slug no export — notas diferentes gerando o
mesmo slug e, portanto, sobrescrevendo o mesmo arquivo WebP. Não era
inofensivo: cada nota do par tem embed próprio (arquivo diferente em
`0 - Anexos`), mas o slug colidido fazia as duas gravarem o **mesmo**
arquivo — pelo menos uma obra de cada par aparecia com a imagem errada em
produção.

## Decisão
Desempate determinístico em `export-vault-data.ts`: a 1ª ocorrência (na
ordem de leitura do diretório) mantém o slug limpo — URLs e imagens já
indexadas no Google ficam estáveis. Duplicatas recebem o ano da obra
(`slug-ano`) e, se ainda colidir, sufixo numérico (`-2`, `-3`...), com
warning no console a cada desempate.

## Consequências
- Slugs previsíveis e estáveis pra SEO já conquistado (2.115 páginas
  indexadas no Search Console) — nenhuma URL limpa já indexada muda.
- Preencher `ano` corretamente no frontmatter passou a ter efeito direto
  na qualidade do slug gerado, não é só metadado decorativo — mais um
  motivo pra fechar os "esqueletos" (notas sem ano) na curadoria.
- Continua exigindo curadoria manual por par pra decidir se é duplicata
  de verdade (excluir uma) ou obra distinta (manter as duas) — o dedupe
  resolve a colisão técnica, não decide a questão de conteúdo.
