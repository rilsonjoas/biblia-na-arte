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

  it('corta em 2000 caracteres', () => {
    const long = `---\nautor: "[[X]]"\n---\n\n### Descrição da Obra\n\n${'a'.repeat(2500)}`;
    expect(extractDescription(long).length).toBe(2000);
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

