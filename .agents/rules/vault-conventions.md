# Regras de Convenção de Frontmatter e Versículos no Obsidian Vault

Este documento estabelece as regras estritas de formatação para as notas de pintura em Markdown no Vault Obsidian do projeto **Bíblia na Arte**.

---

## 1. Frontmatter (`capítulos:`)

- **Regra**: O campo `capítulos:` no frontmatter YAML de cada nota DEVE conter APENAS wikilinks para notas de capítulos no formato `[[Livro Capítulo]]`.
- **Correto**:
  ```yaml
  capítulos:
    - "[[Êxodo 1]]"
    - "[[Êxodo 2]]"
    - "[[Êxodo 5]]"
  ```
- **PROIBIDO (Quebra o Vault)**:
  ```yaml
  # NUNCA colocar o versículo dentro do wikilink no frontmatter!
  capítulos:
    - "[[Êxodo 1:13-14]]"  # ERRADO: Quebra o Obsidian (busca nota Êxodo 1:13-14.md)
  ```

---

## 2. Seção `### 📖 Contexto Bíblico` e Versículos

- **Onde os versículos devem ficar**: Os versículos exatos pertencem ao corpo da nota, no bloco de citação bíblica da seção `### 📖 Contexto Bíblico`.
- **Sintaxe da Citação**:
  ```markdown
  ### 📖 Contexto Bíblico
  > "E os egípcios faziam servir os filhos de Israel com dureza..."
  > — **[[Êxodo 1]]:13-14**
  ```
- **Observação**: Note que os dois pontos `:` e a faixa de versículos `13-14` ficam **FORA** dos colchetes do wikilink `[[Êxodo 1]]`.

---

## 3. Pipeline de Parse (`vault-parse.ts` / `export-vault-data.ts`)

- `parseChapterLink()` extrai o livro e capítulo a partir de `[[Livro Capítulo]]`.
- `extractVerseFromContext()` e `extractPassageQuotes()` varrem a seção `### 📖 Contexto Bíblico` para extrair os versículos (`"13-14"`) e o texto da citação (`passageText`).
- O pipeline une automaticamente o capítulo do frontmatter aos versículos da citação e gera a referência completa para a UI do site (`Êxodo 1:13-14`).
