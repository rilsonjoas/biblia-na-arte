import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  slugify,
  extractFrontmatter,
  extractWikilink,
  extractDescription,
  extractPassageText,
  extractClassicCommentary,
  parseChapterLink,
  deriveArtistFromFilename,
  normalizeForComparison,
  parseTitleParts,
  titleFromFilename,
  findImageFile,
} from './vault-parse.js';

const SAMPLE_NOTE = `---
created: 2026-01-19
updated: 2026-07-27
tags:
  - arte-e-literatura/pintura/religiosa
autor: "[[Aimé Morot]]"
ano: 1880
titulo_original: "Le bon Samaritain"
livros:
  - "[[Lucas]]"
capítulos:
  - "[[Lucas 10]]"
---

![[Aimé Morot - O bom samaritano (Le bon Samaritain).jpeg|600]]

### Descrição da Obra

**Aimé Morot** (1850–1913) apresentou esta obra no Salão de Paris de 1880.

A compaixão do samaritano vira um ato quase litúrgico.

---

### 📖 Contexto Bíblico
> "E, chegando-se a ele, atou-lhe as feridas..."
> — **[[Lucas 10]]:34**
`;

describe('slugify', () => {
  it('remove acentos, normaliza e usa hífens', () => {
    expect(slugify('Aimé Morot - O bom samaritano (Le bon Samaritain)')).toBe(
      'aime-morot-o-bom-samaritano-le-bon-samaritain',
    );
  });

  it('limita a 100 caracteres', () => {
    const long = slugify(`${'palavra-'.repeat(20)}fim`);
    expect(long.length).toBeLessThanOrEqual(100);
  });
});

describe('extractFrontmatter', () => {
  it('lê o frontmatter YAML', () => {
    const fm = extractFrontmatter(SAMPLE_NOTE);
    expect(fm?.autor).toBe('[[Aimé Morot]]');
    expect(fm?.ano).toBe(1880);
    expect(fm?.capítulos).toEqual(['[[Lucas 10]]']);
  });

  it('retorna null sem frontmatter', () => {
    expect(extractFrontmatter('# Só um título')).toBeNull();
  });

  it('retorna null com YAML inválido', () => {
    expect(extractFrontmatter('---\nautor: [quebrado\n---')).toBeNull();
  });
});

describe('extractWikilink', () => {
  it('desembrulha o wikilink', () => {
    expect(extractWikilink('[[Aimé Morot]]')).toBe('Aimé Morot');
  });

  it('mantém string simples', () => {
    expect(extractWikilink('Desconhecido')).toBe('Desconhecido');
  });

  it('retorna vazio para vazio', () => {
    expect(extractWikilink('')).toBe('');
  });
});

describe('extractDescription', () => {
  it('extrai a seção Descrição da Obra, sem o frontmatter nem a imagem', () => {
    const desc = extractDescription(SAMPLE_NOTE);
    expect(desc).toContain('**Aimé Morot**');
    expect(desc).toContain('compaixão do samaritano');
    expect(desc).not.toContain('![[Aimé');
    expect(desc).not.toContain('Contexto Bíblico');
  });

  it('desembrulha wikilink do Obsidian no corpo da descrição (achado 2026-08-23: vazava cru pra tela — "Saudade" citava [[C. S. Lewis]])', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
É próxima do que [[C. S. Lewis]] chamou de *Sehnsucht*.
`;
    const desc = extractDescription(note);
    expect(desc).toContain('C. S. Lewis chamou de');
    expect(desc).not.toContain('[[');
  });

  it('wikilink com alias [[Nota Real|Texto Exibido]] usa só o texto exibido (achado 2026-08-23, nota do Rembrandt)', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
Ver "[[Rembrandt van Rijn - A Descida da Cruz (De kruisafname)|A Descida da Cruz]]" já no acervo.
`;
    const desc = extractDescription(note);
    expect(desc).toContain('"A Descida da Cruz"');
    expect(desc).not.toContain('kruisafname');
    expect(desc).not.toContain('|');
  });

  it('remove a linha "*Fonte: [Título](url)*" da descrição (achado 2026-09-01, Rilson em produção: link solto no meio do parágrafo — informação redundante, o site já tem sourceUrl/botão dedicado pra fonte)', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
Primeiro parágrafo com o conteúdo real da obra.

*Fonte: [Jesus Mocked by the Soldiers — Art Institute of Chicago](https://www.artic.edu/artworks/16499/jesus-mocked-by-the-soldiers)*
`;
    const desc = extractDescription(note);
    expect(desc).toContain('conteúdo real da obra');
    expect(desc).not.toContain('Fonte:');
    expect(desc).not.toContain('artic.edu');
  });

  it('corta em 4000 caracteres', () => {
    const long = `---\nautor: "[[X]]"\n---\n\n### Descrição da Obra\n\n${'a'.repeat(4500)}`;
    expect(extractDescription(long).length).toBe(4000);
  });

  it('sem seção, usa o primeiro parágrafo depois da imagem', () => {
    const note = `---
autor: "[[X]]"
---

![[img.jpg|600]]

Este é o primeiro parágrafo com texto de verdade, longo o bastante pra passar no filtro.

Segundo parágrafo.
`;
    expect(extractDescription(note)).toContain('primeiro parágrafo');
    expect(extractDescription(note)).not.toContain('Segundo parágrafo');
  });

  it('retorna vazio quando não há texto', () => {
    expect(extractDescription('---\nautor: "[[X]]"\n---')).toBe('');
  });

  it('retorna vazio quando a seção Descrição da Obra existe mas está vazia (achado real 2026-08-16: capturava "---" do divisor)', () => {
    const note = `---
autor: "[[X]]"
---
![[img.png]]
### Descrição da Obra


---

### Contexto Bíblico

`;
    expect(extractDescription(note)).toBe('');
  });

  it('ignora placeholder de navegação "Ver [[...]]" no fallback (achado real 2026-08-16)', () => {
    const note = `---
autor: "[[X]]"
livros:
  - "[[Salmos]]"
---

![[img.jpg|600]]

### Contexto Bíblico

Ver [[Salmos]], [[Salmo 19]].
`;
    expect(extractDescription(note)).toBe('');
  });

  it('remove callout [!info] de VÁRIAS linhas por inteiro, não só a primeira (achado real 2026-08-23: "O Faraó e as parteiras" vazava o aviso completo do Google Arts & Culture pro site — a regex antiga só apagava a 1ª linha do blockquote)', () => {
    const note = `---
autor: "[[James Tissot]]"
---
### Descrição da Obra
> [!info] Pharaoh and the Midwives - James Jacques Joseph Tissot - Google Arts & Culture
> *While the Jewish Museum is pleased to be able to share this information with you, note that scholarship and research relating to this work is ongoing.
> [https://artsandculture.google.com/asset/pharaoh-and-the-midwives-0001/2AETzqeoWd1Oqg](https://artsandculture.google.com/asset/pharaoh-and-the-midwives-0001/2AETzqeoWd1Oqg)

O episódio do faraó com as parteiras ocorre durante o período de escravidão dos israelitas no Egito.
`;
    const desc = extractDescription(note);
    expect(desc).toBe('O episódio do faraó com as parteiras ocorre durante o período de escravidão dos israelitas no Egito.');
    expect(desc).not.toContain('Google Arts');
    expect(desc).not.toContain('Jewish Museum');
    expect(desc).not.toContain('artsandculture.google.com');
  });

  it('remove linha de resolução/URL de site de reprodução mesmo fora de callout (gallerix.org)', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
> [!info] The Good Samaritan — William Henry Margetson
> ★ Image resolution: 974×1340 px.
> [https://gallerix.org/storeroom/foo](https://gallerix.org/storeroom/foo)

A pintura retrata a parábola do bom samaritano.
`;
    const desc = extractDescription(note);
    expect(desc).toBe('A pintura retrata a parábola do bom samaritano.');
  });

  it('não remove callout legítimo sem marcador de texto de terceiros', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
> [!note] Uma pintura restaurada em 2020, cores mais vivas que o original.

Descrição real da obra aqui.
`;
    const desc = extractDescription(note);
    expect(desc).toContain('Uma pintura restaurada em 2020');
    expect(desc).toContain('Descrição real da obra aqui.');
  });

  it('remove parágrafo de aside editorial ("Nota enriquecida", "Correção de dado") — achado real 2026-08-23: vazava pro site em notas escritas nesta mesma sessão', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
**Nota enriquecida em 2026-08-23** — entrada anterior era um esboço sem descrição, citação ou referência bíblica definida. Óleo sobre tela de **Jan Steen**, pintado em 1677.

Steen ambienta a cena num interior contemporâneo.
`;
    const desc = extractDescription(note);
    expect(desc).toBe('Óleo sobre tela de **Jan Steen**, pintado em 1677.\n\nSteen ambienta a cena num interior contemporâneo.');
    expect(desc).not.toContain('Nota enriquecida');
  });

  it('remove aside "**Correção..." com > de blockquote, mantendo conteúdo real que vier depois na mesma linha', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
> **Correção de referência (2026-08-23)**: a referência certa é Apocalipse 7:9. Dürer retrata patriarcas e santos em anéis concêntricos.
`;
    const desc = extractDescription(note);
    expect(desc).toBe('Dürer retrata patriarcas e santos em anéis concêntricos.');
    expect(desc).not.toContain('Correção de referência');
  });

  it('remove aside que ocupa a linha inteira (sem conteúdo real depois), sem deixar ">" órfão', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
> **Correção de referência (2026-08-23)**: a nota apontava só pra Apocalipse 21:2, mas o correto é Apocalipse 7:9.

Dürer retrata patriarcas e santos em anéis concêntricos.
`;
    const desc = extractDescription(note);
    expect(desc).toBe('Dürer retrata patriarcas e santos em anéis concêntricos.');
    expect(desc).not.toContain('>');
  });

  it('remove comentário Obsidian %%...%% e HTML <!-- --> usados como anotação editorial interna', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
%% nota interna de curadoria, não deve ir pro site %%
Descrição real da obra.
<!-- outra anotação interna -->
`;
    const desc = extractDescription(note);
    expect(desc).toBe('Descrição real da obra.');
  });
});

describe('parseChapterLink', () => {
  it('parse "Gênesis 18"', () => {
    expect(parseChapterLink('[[Gênesis 18]]')).toEqual({ book: 'Gênesis', chapter: 18 });
  });

  it('parse "Jó 2 1" com versículo', () => {
    expect(parseChapterLink('[[Jó 2 1]]')).toEqual({ book: 'Jó', chapter: 2, verse: '1' });
  });

  it('parse "1 Samuel 17"', () => {
    expect(parseChapterLink('[[1 Samuel 17]]')).toEqual({ book: '1 Samuel', chapter: 17 });
  });

  it('rejeita sem capítulo', () => {
    expect(parseChapterLink('[[Lucas]]')).toBeNull();
  });

  it('rejeita não-número', () => {
    expect(parseChapterLink('Lucas abc')).toBeNull();
  });
});

describe('deriveArtistFromFilename', () => {
  it('pega a parte antes do " - "', () => {
    expect(deriveArtistFromFilename('Aimé Morot - O bom samaritano (Le bon Samaritain).md')).toBe('Aimé Morot');
  });

  it('retorna vazio quando não segue a convenção', () => {
    expect(deriveArtistFromFilename('Jesus chorou.md')).toBe('');
  });
});

describe('normalizeForComparison', () => {
  it('ignora acentos, maiúsculas e espaços', () => {
    expect(normalizeForComparison('Autor Desconhecido')).toBe('autor desconhecido');
    expect(normalizeForComparison('  AUTOR desconhecido  ')).toBe('autor desconhecido');
  });
});

describe('titleFromFilename', () => {
  it('título é tudo depois do " - "', () => {
    expect(titleFromFilename('Aimé Morot - O bom samaritano (Le bon Samaritain).md')).toBe(
      'O bom samaritano (Le bon Samaritain)',
    );
  });

  it('sem " - ", o nome inteiro é o título', () => {
    expect(titleFromFilename('Jesus chorou.md')).toBe('Jesus chorou');
  });
});

describe('parseTitleParts', () => {
  it('separa o original entre parênteses e remove o número desambiguador de dentro', () => {
    expect(parseTitleParts('O bom samaritano (The Good Samaritan 2)')).toEqual({
      title: 'O bom samaritano',
      subtitle: 'The Good Samaritan',
    });
  });

  it('separa o original e remove o número depois do parêntese', () => {
    expect(parseTitleParts('A Ceia em Emaús (De maaltijd te Emmaüs) 2')).toEqual({
      title: 'A Ceia em Emaús',
      subtitle: 'De maaltijd te Emmaüs',
    });
  });

  it('remove o número desambiguador no fim do título sem parêntese', () => {
    expect(parseTitleParts('O bom samaritano 2')).toEqual({
      title: 'O bom samaritano',
      subtitle: undefined,
    });
  });

  it('mantém títulos sem parêntese e sem numeração', () => {
    expect(parseTitleParts('José explica o sonho do Faraó')).toEqual({
      title: 'José explica o sonho do Faraó',
      subtitle: undefined,
    });
  });

  it('não confunde anos de 4 dígitos com desambiguador', () => {
    expect(parseTitleParts('O bom pastor (The Good Shepherd, 2020)')).toEqual({
      title: 'O bom pastor',
      subtitle: 'The Good Shepherd, 2020',
    });
    expect(parseTitleParts('Desembarque de Pedro Álvares Cabral em Porto Seguro em 1500')).toEqual({
      title: 'Desembarque de Pedro Álvares Cabral em Porto Seguro em 1500',
      subtitle: undefined,
    });
  });

  it('separa subtítulo com parêntese aninhado (achado 2026-09-01: "Jó (Job on the Dunghill (Job in His Misery))" ficava inteiro no h1, sem separar)', () => {
    expect(parseTitleParts('Jó (Job on the Dunghill (Job in His Misery))')).toEqual({
      title: 'Jó',
      subtitle: 'Job on the Dunghill (Job in His Misery)',
    });
  });

  it('não remove número de 3 dígitos como título de salmo', () => {
    expect(parseTitleParts('Salmo 148')).toEqual({ title: 'Salmo 148', subtitle: undefined });
  });
});

describe('findImageFile', () => {
  it('encontra a imagem embutida em 0 - Anexos', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'vault-parse-test-'));
    const anexos = path.join(dir, 'anexos');
    mkdirSync(anexos, { recursive: true });
    const imageName = 'meu-quadro.jpg';
    writeFileSync(path.join(anexos, imageName), 'fake');
    try {
      const found = findImageFile(`![[sub/${imageName}|600]]`, anexos);
      expect(found).toBe(path.join(anexos, imageName));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('retorna null sem imagem embutida', () => {
    expect(findImageFile('# Sem imagem', '/nao/existe')).toBeNull();
  });

  it('retorna null quando o arquivo não existe', () => {
    expect(findImageFile('![[faltando.jpg]]', '/nao/existe')).toBeNull();
  });
});

describe('extractPassageText', () => {
  it('extrai citações bíblicas da amostra', () => {
    const passage = extractPassageText(SAMPLE_NOTE);
    expect(passage).toBe(
      '"E, chegando-se a ele, atou-lhe as feridas..."\n— **Lucas 10:34**',
    );
  });

  it('extrai múltiplas citações e ignora o comentário teológico abaixo', () => {
    const note = `---
autor: "[[Albrecht Dürer]]"
---
### 📖 Contexto Bíblico
> "Sei que buscais a Jesus, que foi crucificado."
> — **[[Mateus 28]]:5-6**

> "Mas de fato Cristo ressuscitou..."
> — **[[1 Coríntios 15]]:20**

Teologicamente, Cristo ressurreto é primícias da nova criação...
`;
    const passage = extractPassageText(note);
    expect(passage).toContain('"Sei que buscais a Jesus, que foi crucificado."');
    expect(passage).toContain('— **Mateus 28:5-6**');
    expect(passage).toContain('"Mas de fato Cristo ressuscitou..."');
    expect(passage).toContain('— **1 Coríntios 15:20**');
    expect(passage).not.toContain('Teologicamente');
  });

  it('retorna null para notas-stub "Ver [[Livro]]"', () => {
    const stub = `---
autor: "[[Autor]]"
---
### Contexto Bíblico
Ver [[Lucas]], [[Lucas 10]].
`;
    expect(extractPassageText(stub)).toBeNull();
  });

  it('retorna null se a seção estiver vazia ou ausente', () => {
    expect(extractPassageText('--- \nautor: "X"\n---')).toBeNull();
    expect(extractPassageText('### Contexto Bíblico\n\n')).toBeNull();
  });
});

describe('extractClassicCommentary', () => {
  it('extrai autor e texto da seção "Na leitura de {Autor}"', () => {
    const note = `---
autor: "[[Rembrandt van Rijn]]"
---
### Descrição da Obra
Descrição normal aqui.

---

### Na leitura de Rookmaaker
Hans Rookmaaker cita esta obra por nome.

> "trecho breve citado"
> — Hans Rookmaaker, *Filosofia e Estética*, p. 199-202

---

### 📖 Contexto Bíblico
> "E, havendo-o crucificado..."
> — **[[Mateus 27]]:35**
`;
    const result = extractClassicCommentary(note);
    expect(result).not.toBeNull();
    expect(result?.author).toBe('Rookmaaker');
    expect(result?.text).toContain('Hans Rookmaaker cita esta obra por nome.');
    expect(result?.text).toContain('Filosofia e Estética');
    // achado 2026-08-23: a nota real do Rembrandt citava *[[Filosofia e
    // Estética]]* — sem desembrulhar, o site mostrava os colchetes crus.
    expect(result?.text).not.toContain('[[');
  });

  it('não vaza pra dentro de Descrição da Obra nem de Contexto Bíblico', () => {
    const note = `---
autor: "[[X]]"
---
### Descrição da Obra
Só a descrição, sem menção a leitura nenhuma.

---

### 📖 Contexto Bíblico
> "citação"
> — **[[Lucas 10]]:34**
`;
    expect(extractClassicCommentary(note)).toBeNull();
  });

  it('retorna null quando a seção não existe', () => {
    expect(extractClassicCommentary('### Descrição da Obra\nSó isso.\n')).toBeNull();
  });

  it('retorna null se o texto ficar vazio', () => {
    const note = '### Na leitura de Schaeffer\n\n---\n### Contexto Bíblico\n';
    expect(extractClassicCommentary(note)).toBeNull();
  });
});

