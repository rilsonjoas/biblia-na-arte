# Relatório de Qualidade & Backlog de Curadoria de Conteúdo

Documento de mapeamento e priorização do backlog de conteúdo do **Bíblia na Arte**, organizado em 4 lotes de ação contínua para enriquecimento das descrições e contextos históricos das obras.

---

## 📊 Status Atual do Acervo após Melhorias

- **Total de Obras Ativas Exportadas:** 848 pinturas
- **Obras sem Referência Bíblica:** Reduzido de 53 para apenas 6 obras
- **Referências Bíblicas Totais:** 1.480 referências ativas
- **Referências com Versículos Destacados:** **818 referências** (aumento de 2 para 818)
- **Obras Não-Bíblicas Excluídas do Site:** 22 pinturas profanas/seculares filtradas

---

## 🎯 Plano de Lotes para o Backlog de Conteúdo

Para atuar no backlog restante de 606 notas sem contexto histórico, 199 com descrições curtas (<30 palavras) e 124 sem descrição no Vault, dividimos a curadoria nos seguintes 4 lotes priorizados:

### Lote 1: Grandes Mestres e Obras Principais da Paixão e Natividade (Prioridade Alta)
- **Foco:** Obras-primas de Caravaggio, Rembrandt, Gustave Doré, Carl Bloch, Fra Angelico, Velázquez e Murillo.
- **Ação:** Enriquecer a descrição visual (pelo menos 2 parágrafos) e adicionar o bloco de Contexto Histórico/Teológico citando o período (Barroco, Renascimento, Romantismo).
- **Volume:** ~150 obras.

### Lote 2: Antigo Testamento e Narrativas Patriarcais (Prioridade Média-Alta)
- **Foco:** Cenas de Gênesis, Êxodo, Reis, Salmos e Profetas (obras de James Tissot, Aert de Gelder, Guercino, Francisco de Zurbarán).
- **Ação:** Complementar versículos de destaque e expandir análises simbólicas das vestes, iluminação e elementos sacros.
- **Volume:** ~180 obras.

### Lote 3: Novo Testamento, Parábolas e Milagres (Prioridade Média)
- **Foco:** Milagres, Parábolas do Evangelho e Atos dos Apóstolos (Domenico Fetti, Cornelis van Poelenburch, Eugène Burnand, Henry Ossawa Tanner).
- **Ação:** Adicionar exegese visual simples e destacar versículos chaves da parábola ou milagre.
- **Volume:** ~170 obras.

### Lote 4: Iluminuras, Mosaicos e Acervos Regionais (Prioridade Normal)
- **Foco:** Obras medievais, afrescos de capelas e iluminuras de autores desconhecidos ou acervos regionais.
- **Ação:** Padronização da estrutura de notas e inclusão de dados do acervo/localização física (*Onde ver pessoalmente*).
- **Volume:** ~148 obras.

---

## 🔄 Fluxo de Atualização Vault <-> Site

Toda melhoria realizada nas notas do Vault (`/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas`) é automaticamente refletida no site ao executar:
```bash
pnpm --filter server exec tsx scripts/export-vault-data.ts
```
O exportador processa as imagens em WebP otimizado e atualiza `vault-export.json`, pronto para re-seeme do banco de dados Postgres via `pnpm --filter server db:seed`.
