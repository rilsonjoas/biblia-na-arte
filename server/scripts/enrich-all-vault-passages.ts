#!/usr/bin/env tsx
/**
 * Script de enriquecimento bíblico do Vault:
 * Em vez de remover capítulos do frontmatter, busca as passagens e versículos
 * correspondentes e INSERE os blocos de citação bíblica completos na seção
 * '### 📖 Contexto Bíblico' de cada nota, no padrão:
 * > "Texto do versículo..."
 * > — **[[Livro Capítulo]]:Versículos**
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { extractPassageQuotes, parseChapterLink } from '../src/lib/vault-parse.js';
import { fetchBiblePassage, bibleApiBookName } from '../src/lib/bible-api.js';
import { resolveBibleBook } from '../src/db/seed-data/bible-books.js';

const VAULT_DIR = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';

// Mapeamento curado de versículos para histórias paralelas comuns na pintura bíblica
const PARALLELS: { topicMatch: RegExp; passages: Record<string, string> }[] = [
  {
    topicMatch: /negação de pedro|denial of peter/i,
    passages: {
      'Mateus 26': '69-75',
      'Marcos 14': '66-72',
      'Lucas 22': '54-62',
      'João 18': '15-27',
    },
  },
  {
    topicMatch: /prisão de jesus|arrest of christ|captura/i,
    passages: {
      'Mateus 26': '47-56',
      'Marcos 14': '43-52',
      'Lucas 22': '47-53',
      'João 18': '1-11',
    },
  },
  {
    topicMatch: /sepultamento|entombment|burial/i,
    passages: {
      'Mateus 27': '57-61',
      'Marcos 15': '42-47',
      'Lucas 23': '50-56',
      'João 19': '38-42',
    },
  },
  {
    topicMatch: /ressurreição|resurrection/i,
    passages: {
      'Mateus 28': '1-10',
      'Marcos 16': '1-8',
      'Lucas 24': '1-12',
      'João 20': '1-10',
    },
  },
  {
    topicMatch: /crucificação|crucifixion|na cruz|no calvário/i,
    passages: {
      'Mateus 27': '33-54',
      'Marcos 15': '22-39',
      'Lucas 23': '33-49',
      'João 19': '17-30',
    },
  },
  {
    topicMatch: /entrada em jerusalém|entry into jerusalem/i,
    passages: {
      'Mateus 21': '1-11',
      'Marcos 11': '1-11',
      'Lucas 19': '28-40',
      'João 12': '12-19',
    },
  },
  {
    topicMatch: /última ceia|last supper/i,
    passages: {
      'Mateus 26': '26-29',
      'Marcos 14': '22-25',
      'Lucas 22': '14-20',
    },
  },
  {
    topicMatch: /batismo de cristo|baptism of christ/i,
    passages: {
      'Mateus 3': '13-17',
      'Marcos 1': '9-11',
      'Lucas 3': '21-22',
    },
  },
  {
    topicMatch: /tentação de cristo|temptation of christ/i,
    passages: {
      'Mateus 4': '1-11',
      'Marcos 1': '12-13',
      'Lucas 4': '1-13',
    },
  },
];

async function enrichVaultNotes() {
  const files = readdirSync(VAULT_DIR).filter((f) => f.endsWith('.md'));
  let enrichedCount = 0;

  console.log(`🌾 Iniciando enriquecimento de versículos no Vault (${files.length} notas)...\n`);

  for (const file of files) {
    const fullPath = path.join(VAULT_DIR, file);
    let content = readFileSync(fullPath, 'utf-8');

    // Extrair capítulos do frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch?.[1]) continue;

    const rawFm = fmMatch[1];
    const capsLines = rawFm.match(/capítulos:\s*\n((?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+)/);
    if (!capsLines?.[1]) continue;

    const fmChapters: { book: string; chapter: number }[] = [];
    const lines = capsLines[1].split('\n').filter((l) => l.trim().startsWith('-'));
    for (const l of lines) {
      const parsed = parseChapterLink(l);
      if (parsed) {
        fmChapters.push({ book: parsed.book, chapter: parsed.chapter });
      }
    }

    if (fmChapters.length === 0) continue;

    // Extrair citações atuais
    const existingQuotes = extractPassageQuotes(content);
    const existingCapKeys = new Set(
      existingQuotes.map((q) => `${q.bookName ? resolveBibleBook(q.bookName)?.name : ''} ${q.chapter}`)
    );

    // Identificar capítulos do frontmatter que ainda não têm citação no corpo
    const missingChapters = fmChapters.filter((fc) => {
      const bookObj = resolveBibleBook(fc.book);
      const key = `${bookObj?.name} ${fc.chapter}`;
      return !existingCapKeys.has(key) && !existingQuotes.some((q) => q.chapter === fc.chapter);
    });

    if (missingChapters.length === 0) continue;

    // Tentar encontrar o paralelo apropriado no mapa de paralelos
    const parallelMapping = PARALLELS.find((p) => p.topicMatch.test(file));
    let addedQuoteBlocks = '';

    for (const mc of missingChapters) {
      const bookObj = resolveBibleBook(mc.book);
      if (!bookObj) continue;

      const capKey = `${bookObj.name} ${mc.chapter}`;
      const verseRange = parallelMapping?.passages[capKey];

      if (verseRange) {
        try {
          // Buscar texto bíblico
          const passage = await fetchBiblePassage(bookObj.slug, mc.chapter);
          // Filtrar os versículos do intervalo se necessário
          const [startV, endV] = verseRange.split('-').map(Number);
          const selectedVerses = passage.verses.filter((v) => {
            if (startV && endV) return v.verse >= startV && v.verse <= endV;
            if (startV) return v.verse === startV;
            return true;
          });

          const text = selectedVerses.map((v) => v.text.trim()).join(' ');
          if (text) {
            addedQuoteBlocks += `\n\n> "${text}"\n> — **[[${bookObj.name} ${mc.chapter}]]:${verseRange}**`;
          }
        } catch (err) {
          console.warn(`⚠️ Não foi possível buscar texto bíblico para ${capKey}: ${(err as Error).message}`);
        }
      }
    }

    if (addedQuoteBlocks) {
      // Inserir os novos blocos de citação na seção ### 📖 Contexto Bíblico
      if (content.includes('### 📖 Contexto Bíblico')) {
        content = content.replace(/(### 📖 Contexto Bíblico[\s\S]*?)(?=\n---|\n### Contexto Histórico|$)/, `$1${addedQuoteBlocks}\n\n`);
      } else {
        // Se a seção não existir, criar antes do divisor final ou Contexto Histórico
        const newSection = `### 📖 Contexto Bíblico${addedQuoteBlocks}\n\n---\n\n`;
        content = content.replace(/(\n---\n\n### Contexto Histórico|$)/, `\n\n${newSection}$1`);
      }

      writeFileSync(fullPath, content, 'utf-8');
      enrichedCount++;
      console.log(`📖 Enriquecida nota: ${file} com citações para ${missingChapters.map((c) => `${c.book} ${c.chapter}`).join(', ')}`);
    }
  }

  console.log(`\n🎉 Enriquecimento concluído! Total de notas enriquecidas: ${enrichedCount}`);
}

enrichVaultNotes().catch(console.error);
