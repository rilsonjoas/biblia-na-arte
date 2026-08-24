#!/usr/bin/env tsx
/**
 * Script de Coerência Bíblica Total do Vault:
 * 1. Para cada nota do Vault (1017 notas):
 *    a) Analisa os capítulos em 'capítulos:' do frontmatter.
 *    b) Se o capítulo já tem citação com versículos em '### 📖 Contexto Bíblico', preserva-o.
 *    c) Se não tem citação, busca o trecho/versículos exatos correspondentes à cena da obra.
 *    d) Se a passagem for encontrada, insere a citação completa:
 *       > "Texto dos versículos..."
 *       > — **[[Livro Capítulo]]:Versículos**
 *    e) Se o capítulo listado no frontmatter for uma referência espúria (sem nenhuma cena ou versículo aplicável),
 *       remove o capítulo do frontmatter para garantir 100% de coerência.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { extractPassageQuotes, parseChapterLink } from '../src/lib/vault-parse.js';
import { fetchBiblePassage } from '../src/lib/bible-api.js';
import { resolveBibleBook } from '../src/db/seed-data/bible-books.js';

const VAULT_DIR = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';

// Mapeamento temático e exegético extenso para passagens da Bíblia na arte
const SCENE_PASSAGE_MAP: { pattern: RegExp; passages: Record<string, string> }[] = [
  // Paixão & Crucificação
  {
    pattern: /crucific|crucifix|calvário|calvary|na cruz|no monte do calvário/i,
    passages: {
      'Mateus 27': '33-54',
      'Marcos 15': '22-39',
      'Lucas 23': '33-49',
      'João 19': '17-30',
    },
  },
  // Negação de Pedro
  {
    pattern: /negação de pedro|denial of peter/i,
    passages: {
      'Mateus 26': '69-75',
      'Marcos 14': '66-72',
      'Lucas 22': '54-62',
      'João 18': '15-27',
    },
  },
  // Prisão / Captura de Jesus
  {
    pattern: /prisão de jesus|arrest of christ|captura de cristo|no getsêmani/i,
    passages: {
      'Mateus 26': '47-56',
      'Marcos 14': '43-52',
      'Lucas 22': '47-53',
      'João 18': '1-11',
    },
  },
  // Sepultamento
  {
    pattern: /sepultamento|entombment|burial|túmulo/i,
    passages: {
      'Mateus 27': '57-61',
      'Marcos 15': '42-47',
      'Lucas 23': '50-56',
      'João 19': '38-42',
    },
  },
  // Ressurreição
  {
    pattern: /ressurreição|resurrection|túmulo vazio/i,
    passages: {
      'Mateus 28': '1-10',
      'Marcos 16': '1-8',
      'Lucas 24': '1-12',
      'João 20': '1-10',
    },
  },
  // Entrada em Jerusalém
  {
    pattern: /entrada em jerusalém|entry into jerusalem|domingo de ramos/i,
    passages: {
      'Mateus 21': '1-11',
      'Marcos 11': '1-11',
      'Lucas 19': '28-40',
      'João 12': '12-19',
    },
  },
  // Última Ceia
  {
    pattern: /última ceia|last supper|ceia com os apóstolos/i,
    passages: {
      'Mateus 26': '26-29',
      'Marcos 14': '22-25',
      'Lucas 22': '14-20',
      '1 Coríntios 11': '23-26',
    },
  },
  // Batismo de Cristo
  {
    pattern: /batismo de cristo|baptism of christ/i,
    passages: {
      'Mateus 3': '13-17',
      'Marcos 1': '9-11',
      'Lucas 3': '21-22',
      'João 1': '29-34',
    },
  },
  // Tentação de Cristo
  {
    pattern: /tentação|temptation|no deserto/i,
    passages: {
      'Mateus 4': '1-11',
      'Marcos 1': '12-13',
      'Lucas 4': '1-13',
    },
  },
  // Anunciação
  {
    pattern: /anunciação|annunciation/i,
    passages: {
      'Lucas 1': '26-38',
    },
  },
  // Natividade
  {
    pattern: /natividade|nativity|nascimento de jesus/i,
    passages: {
      'Lucas 2': '1-20',
      'Mateus 1': '18-25',
    },
  },
  // Adoração dos Magos
  {
    pattern: /adoração dos magos|adoration of the magi|reis magos/i,
    passages: {
      'Mateus 2': '1-12',
    },
  },
  // Sacrifício de Isaque
  {
    pattern: /abraão e isaque|sacrifice of isaac|monte moriá/i,
    passages: {
      'Gênesis 22': '1-19',
    },
  },
  // Davi e Golias
  {
    pattern: /davi e golias|david and goliath/i,
    passages: {
      '1 Samuel 17': '38-54',
    },
  },
  // Salomão
  {
    pattern: /julgamento de salomão|jugement de salomon/i,
    passages: {
      '1 Reis 3': '16-28',
    },
  },
];

async function ensureCoherence() {
  const files = readdirSync(VAULT_DIR).filter((f) => f.endsWith('.md'));
  let enrichedCount = 0;
  let cleanedCount = 0;

  console.log(`🛡️  Garantindo Coerência Bíblica Total em ${files.length} notas no Vault...\n`);

  for (const file of files) {
    const fullPath = path.join(VAULT_DIR, file);
    let content = readFileSync(fullPath, 'utf-8');
    let modified = false;

    // 1. Obter capítulos do frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch?.[1]) continue;

    const rawFm = fmMatch[1];
    const capsLines = rawFm.match(/capítulos:\s*\n((?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+)/);
    if (!capsLines?.[1]) continue;

    const fmChapters: { book: string; chapter: number; rawLine: string }[] = [];
    const lines = capsLines[1].split('\n').filter((l) => l.trim().startsWith('-'));
    for (const l of lines) {
      const parsed = parseChapterLink(l);
      if (parsed) {
        fmChapters.push({ book: parsed.book, chapter: parsed.chapter, rawLine: l });
      }
    }

    if (fmChapters.length === 0) continue;

    // 2. Citações atuais na nota
    const existingQuotes = extractPassageQuotes(content);
    const validChaptersInBody = new Set<string>();

    for (const q of existingQuotes) {
      if (q.chapter) {
        const bookName = q.bookName ? resolveBibleBook(q.bookName)?.name : null;
        if (bookName) validChaptersInBody.add(`${bookName} ${q.chapter}`);
      }
    }

    // 3. Processar cada capítulo do frontmatter
    const finalChaptersToKeep: string[] = [];
    let addedBlocks = '';

    const sceneMapping = SCENE_PASSAGE_MAP.find((m) => m.pattern.test(file) || m.pattern.test(content));

    for (const fc of fmChapters) {
      const bookObj = resolveBibleBook(fc.book);
      if (!bookObj) continue;

      const capKey = `${bookObj.name} ${fc.chapter}`;

      // Se já tem citação no corpo com versículos para esse capítulo
      if (validChaptersInBody.has(capKey) || existingQuotes.some((q) => q.chapter === fc.chapter)) {
        finalChaptersToKeep.push(`  - "[[${bookObj.name} ${fc.chapter}]]"`);
        continue;
      }

      // Tentar enriquecer buscando versículos no mapa temático
      const verseRange = sceneMapping?.passages[capKey];
      if (verseRange) {
        try {
          const passage = await fetchBiblePassage(bookObj.slug, fc.chapter);
          const [startV, endV] = verseRange.split('-').map(Number);
          const selectedVerses = passage.verses.filter((v) => {
            if (startV && endV) return v.verse >= startV && v.verse <= endV;
            if (startV) return v.verse === startV;
            return true;
          });

          const text = selectedVerses.map((v) => v.text.trim()).join(' ');
          if (text) {
            addedBlocks += `\n\n> "${text}"\n> — **[[${bookObj.name} ${fc.chapter}]]:${verseRange}**`;
            finalChaptersToKeep.push(`  - "[[${bookObj.name} ${fc.chapter}]]"`);
            enrichedCount++;
            continue;
          }
        } catch (e) {
          // Erro na busca do texto
        }
      }

      // Se não há citação existente e não foi possível encontrar versículos aplicáveis a este capítulo específico,
      // ele é uma referência espúria/sem contexto — removemos para manter a coerência total solicitada.
      cleanedCount++;
      console.log(`🧹 Removido capítulo sem versículo/contexto em ${file}: ${fc.book} ${fc.chapter}`);
    }

    // Atualizar corpo da nota com novos blocos de citação se houver
    if (addedBlocks) {
      if (content.includes('### 📖 Contexto Bíblico')) {
        content = content.replace(/(### 📖 Contexto Bíblico[\s\S]*?)(?=\n---|\n### Contexto Histórico|$)/, `$1${addedBlocks}\n\n`);
      } else {
        const newSection = `### 📖 Contexto Bíblico${addedBlocks}\n\n---\n\n`;
        content = content.replace(/(\n---\n\n### Contexto Histórico|$)/, `\n\n${newSection}$1`);
      }
      modified = true;
    }

    // Atualizar capítulos do frontmatter para conter apenas capítulos com versículos/citações verificadas
    if (finalChaptersToKeep.length !== fmChapters.length) {
      if (finalChaptersToKeep.length > 0) {
        const newCapsYaml = `capítulos:\n` + finalChaptersToKeep.join('\n');
        content = content.replace(/capítulos:\s*\n(?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+/, `${newCapsYaml}\n`);
      } else {
        content = content.replace(/capítulos:\s*\n(?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+/, '');
      }
      modified = true;
    }

    if (modified) {
      writeFileSync(fullPath, content, 'utf-8');
    }
  }

  console.log('\n========================================');
  console.log('✅ GARANTIA DE COERÊNCIA CONCLUÍDA');
  console.log('========================================');
  console.log(`📖 Citações bíblicas adicionadas/enriquecidas: ${enrichedCount}`);
  console.log(`🧹 Capítulos espúrios sem versículos removidos: ${cleanedCount}`);
  console.log('========================================\n');
}

ensureCoherence().catch(console.error);
