# 003 — WebP gerado no export, não em script separado

**Data:** 2026-08-15/16

## Contexto
A otimização WebP existia como script à parte (`images:optimize`), que só
valia se alguém lembrasse de rodar *depois* de todo re-export do vault —
ninguém lembrava. Resultado real medido: só 25 de ~1580 arquivos em
`web/public/images/` estavam em WebP, o banco de produção nunca apontou
pra nenhum deles (`imageUrl` guardava `.jpg`/`.png` original), e o
diretório tinha ~2280 imagens órfãs de artistas já excluídos por
copyright.

## Decisão
`export-vault-data.ts` converte cada imagem pra WebP (max 1600px,
qualidade 82) **no momento da cópia do vault**, já salva com `imageFile =
slug.webp`, e limpa `web/public/images/` antes de regenerar — o diretório
é saída 100% derivada do vault, mesma filosofia do `import-seed-data.ts`:
não deve acumular sobra. `images:optimize` continua existindo só pra
backfill manual pontual, não faz mais parte do fluxo normal.

## Consequências
- Impossível esquecer o passo de otimização — é o mesmo comando que já
  todo mundo roda (`export:vault`).
- Catálogo de imagens: 958MB → 111MB (~88%, incluindo limpeza de órfãs).
- `web/public/images/` nunca deve ser editado à mão — é sempre
  regenerável do zero a partir do vault. Consequência prática: rodar
  `export:vault` limpa qualquer imagem manual colocada ali fora do fluxo.
