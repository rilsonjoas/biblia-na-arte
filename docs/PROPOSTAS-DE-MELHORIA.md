# Propostas de melhoria (a decidir)

> Nada aqui está feito nem comprometido. São ideias levantadas em 2026-10-12/13,
> depois de um dia inteiro de ajustes no caminho dos dados (vault → site). O plano
> oficial continua sendo o `ROADMAP.md`; isto é a lista para decidir se vale a pena.
> Contexto: `docs/adr/007-redirecionamento-de-slug.md`, `docs/adr/008-reseed-no-deploy.md`
> e a entrada de 2026-10-12 em `docs/registro/2026-10.md`.

## Diagnóstico em uma frase

O deploy em si (push → CI → VPS puxa e reconstrói) é simples e leva de 4,5 a 6,5
minutos. O sofrimento de 12/10 veio do **caminho dos dados**: slug calculado de nome de
arquivo, `autor:` torto driblando a exclusão por direitos, reseed manual sem ensaio e
nomes de arquivo incompatíveis com o Windows. Isso já foi corrigido (PRs #4 a #15).

## Propostas, em ordem de valor

### 1. Validar o PR de dados antes de mesclar (esforço pequeno)
Hoje a trava do reseed só dispara depois do merge, no job `deploy`. Um PR de dados ruim
já está em `main` quando se descobre; só o reseed fica bloqueado. A checagem que não
precisa de banco (`catalog-diff.ts`: obra sumida sem explicação, redirecionamento
inválido, destino fora do export) pode rodar no CI do PR e deixá-lo vermelho antes do
merge.
- **Cuidado:** só rodar quando `vault-export.json`, `slug-redirects.json` ou
  `removed-slugs.json` mudam; comparar contra o `vault-export.json` de `origin/main`.
- **Risco:** baixo (CI só lê). **Teste:** unitário em cima das funções que já existem.

### 2. Mostrar o relatório do ensaio na página da execução (esforço pequeno a médio)
Hoje o relatório do ensaio fica enterrado no log do job `deploy`, e quando dois PRs são
mesclados em sequência ele aparece no deploy do **primeiro** (o segundo diz "dados não
mudaram"). Gravar um resumo em `$GITHUB_STEP_SUMMARY` (ou um comentário no PR) deixa
qualquer pessoa ler sem caçar no log.
- **Cuidado:** a saída vem de um `ssh-action`; é preciso capturá-la num passo seguinte.

### 3. Não reconstruir o VPS por mudança só de documentação (esforço pequeno)
PRs que mexem só em `docs/**` ou `*.md` fazem o mesmo rebuild de 2 a 3 minutos e reiniciam
a API sem necessidade. Um filtro de caminhos no job `deploy` resolve.
- **Cuidado:** a exceção precisa ser explícita e restrita a documentação; nunca pular o
  deploy quando algo em `server/`, `web/`, `scripts/` ou `.github/` muda.

### 4. Mesclar um PR por vez (hábito, sem código)
Dois merges em sequência geram dois deploys em fila (o GitHub serializa pelo
`concurrency: deploy-vps`) e o ensaio "perdido" do item 2. Esperar o verde entre um merge
e outro evita as duas coisas.

## Ideias que NÃO recomendo agora

- **Tirar as imagens do git/LFS para um armazenamento de objetos.** Resolveria de vez o
  risco da cota de banda do LFS (estourou em 2026-09-27), mas é uma mudança grande no
  site. Reavaliar se a cota voltar a incomodar.
- **Reseed 100% automático.** Decisão de 2026-10-12: manter um humano entre o ensaio e a
  gravação (botão "Reseed do catálogo"). Reavaliar depois de semanas de ensaios sem
  surpresa. Limite conhecido: dado errado que só "atualiza" uma obra passa na trava; a
  defesa é ler o PR de dados.
- **Ambiente de staging.** O ensaio (`DRY_RUN`) no próprio VPS já cobre o risco real para
  um site deste tamanho.

## Pendências de decisão (não são melhorias de código)

- **Frans Floris:** a nota tem caminho de 243 caracteres no vault, o que o Windows não
  abre por padrão. Solução: `core.longpaths` no git e a chave `LongPathsEnabled` no
  Windows. Renomear a nota mudaria o subtítulo da obra no site.
- **Posts do Henk Helmantel de 06/10** no Instagram e no Threads: a obra saiu do site
  (artista vivo, sem direito de uso). Decidido manter os posts por ora.
- **Lote LLL da Padronização** das notas de pintura: parado; a próxima nota é
  `Jan Steen - A Oração Antes da Refeição`.
- **Token do Instagram:** expira por volta de 06/11/2026; renovar a partir de 23/10.
