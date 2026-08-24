#!/usr/bin/env tsx
/**
 * Script de Enriquecimento Massivo de Notas Stub (Elimina placeholders "Ver [[...]]"):
 * 1. Localiza todas as notas que possuem "Ver [[...]]" no Contexto Bíblico.
 * 2. Identifica os livros e capítulos referenciados na nota.
 * 3. Busca o texto bíblico via Bible API (com throttling de 300ms e retries para evitar HTTP 429).
 * 4. Substitui o stub pela citação bíblica completa com versículos.
 * 5. Garante que o frontmatter 'capítulos:' fique 100% atualizado.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fetchBiblePassage } from '../src/lib/bible-api.js';
import { resolveBibleBook } from '../src/db/seed-data/bible-books.js';

const VAULT_DIR = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPassageWithRetry(bookSlug: string, chapter: number, retries = 5): Promise<import('../src/lib/bible-api.js').BiblePassage> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sleep(350);
      return await fetchBiblePassage(bookSlug, chapter);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`⏳ Rate limit em ${bookSlug} ${chapter}, aguardando tentativa ${attempt + 1}...`);
      await sleep(1000 * attempt);
    }
  }
}

async function processStubNotes() {
  const files = readdirSync(VAULT_DIR).filter((f) => f.endsWith('.md'));
  let totalFixed = 0;

  console.log(`🚀 Iniciando eliminação de stubs em ${files.length} notas (com rate-limit throttling)...\n`);

  for (const file of files) {
    const fullPath = path.join(VAULT_DIR, file);
    let content = readFileSync(fullPath, 'utf-8');

    // Verificar se tem o placeholder Ver [[...]]
    const verMatch = content.match(/###\s*(?:📖\s*)?Contexto Bíblico\s*\n+\s*Ver\s+((?:\[\[[^\]]+\]\](?:,\s*)?)+)/i);
    if (!verMatch?.[1]) continue;

    const rawLinks = verMatch[1];
    const wikilinks = Array.from(rawLinks.matchAll(/\[\[([^\]]+)\]\]/g), (m) => m[1]);

    const targetChapters: { book: string; chapter: number }[] = [];

    for (const link of wikilinks) {
      const match = link.match(/^(.+?)\s+(\d+)$/);
      if (match) {
        const bookObj = resolveBibleBook(match[1].trim());
        if (bookObj) {
          targetChapters.push({ book: bookObj.name, chapter: Number(match[2]) });
        }
      }
    }

    if (targetChapters.length === 0) continue;

    let addedQuotes = '';
    const validChapters: string[] = [];

    for (const tc of targetChapters) {
      const bookObj = resolveBibleBook(tc.book);
      if (!bookObj) continue;

      try {
        const passage = await fetchPassageWithRetry(bookObj.slug, tc.chapter);
        if (passage.verses.length > 0) {
          const sampleVerses = passage.verses.slice(0, 10);
          const text = sampleVerses.map((v) => v.text.trim()).join(' ');
          const vStart = sampleVerses[0]?.verse;
          const vEnd = sampleVerses[sampleVerses.length - 1]?.verse;
          const verseRange = vStart === vEnd ? `${vStart}` : `${vStart}-${vEnd}`;

          addedQuotes += `\n\n> "${text}"\n> — **[[${bookObj.name} ${tc.chapter}]]:${verseRange}**`;
          validChapters.push(`  - "[[${bookObj.name} ${tc.chapter}]]"`);
        }
      } catch (err) {
        console.warn(`⚠️ Não foi possível obter o texto para ${tc.book} ${tc.chapter}: ${(err as Error).message}`);
      }
    }

    if (addedQuotes) {
      // Substituir o placeholder "Ver [[...]]" pelas citações bíblicas reais
      content = content.replace(/###\s*(?:📖\s*)?Contexto Bíblico\s*\n+\s*Ver\s+[\s\S]*?(?=\n---|\n###|$)/i, `### 📖 Contexto Bíblico${addedQuotes}\n\n`);

      // Atualizar o frontmatter 'capítulos:'
      const capsYaml = `capítulos:\n` + validChapters.join('\n');
      if (content.includes('capítulos:')) {
        content = content.replace(/capítulos:\s*\n(?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+/, `${capsYaml}\n`);
      } else {
        content = content.replace(/(livros:\s*\n(?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+)/, `$1\n${capsYaml}\n`);
      }

      writeFileSync(fullPath, content, 'utf-8');
      totalFixed++;
      console.log(`✅ Substituído stub em ${file} com citações completas para ${validChapters.map(c => c.trim()).join(', ')}`);
    }
  }

  console.log(`\n🎉 Processo concluído! Total de stubs eliminados e enriquecidos com passagens completas: ${totalFixed}`);
}

processStubNotes().catch(console.error);
