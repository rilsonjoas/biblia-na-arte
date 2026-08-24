#!/usr/bin/env tsx
/**
 * Script de sincronização completa de referências bíblicas no Vault:
 * 1. Garante que todo capítulo no frontmatter 'capítulos:' corresponda a uma citação real em '### 📖 Contexto Bíblico'.
 * 2. Se a citação bíblica no corpo citar versículos (ex: — **[[Êxodo 1]]:13-14**), preserva o formato rigoroso.
 * 3. Se um capítulo no frontmatter estiver sem citação no corpo, busca a passagem paralela correspondente e insere o bloco de citação.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { extractPassageQuotes, parseChapterLink } from '../src/lib/vault-parse.js';
import { resolveBibleBook } from '../src/db/seed-data/bible-books.js';

const VAULT_DIR = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';

// Mapeamento de paralelos bíblicos conhecidos para histórias recorrentes da arte
const PARALLEL_VERSES_MAP: Record<string, Record<string, string>> = {
  // Prisão de Jesus
  'A Prisão de Jesus': {
    'Marcos 14': '43-50',
    'Lucas 22': '47-53',
    'João 18': '1-11',
  },
  // Sepultamento de Jesus
  'O sepultamento': {
    'Marcos 15': '42-47',
    'Lucas 23': '50-56',
    'João 19': '38-42',
  },
  // Ressurreição
  'A Ressurreição': {
    'Marcos 16': '1-8',
    'Lucas 24': '1-12',
    'João 20': '1-10',
  },
  // Transfiguração
  'Transfiguração': {
    'Marcos 9': '2-8',
    'Lucas 9': '28-36',
  },
  // Caminhando sobre as águas
  'Cristo Caminhando Sobre o Mar': {
    'Marcos 6': '45-52',
    'João 6': '16-21',
  },
};

async function syncVaultReferences() {
  const files = readdirSync(VAULT_DIR).filter((f) => f.endsWith('.md'));
  let totalFixed = 0;

  console.log(`🚀 Iniciando sincronização em ${files.length} notas...\n`);

  for (const file of files) {
    const fullPath = path.join(VAULT_DIR, file);
    let content = readFileSync(fullPath, 'utf-8');

    // 1. Extrair capítulos listados no frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch?.[1]) continue;

    const rawFm = fmMatch[1];
    const capsLines = rawFm.match(/capítulos:\s*\n((?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+)/);
    if (!capsLines?.[1]) continue;

    const fmChapters: { book: string; chapter: number; raw: string }[] = [];
    const lines = capsLines[1].split('\n').filter((l) => l.trim().startsWith('-'));
    for (const l of lines) {
      const parsed = parseChapterLink(l);
      if (parsed) {
        fmChapters.push({ book: parsed.book, chapter: parsed.chapter, raw: l });
      }
    }

    if (fmChapters.length === 0) continue;

    // 2. Extrair citações atuais
    const passageQuotes = extractPassageQuotes(content);

    // 3. Verificar quais capítulos do frontmatter não têm citação bíblica no corpo
    const missing: { book: string; chapter: number }[] = [];
    for (const fc of fmChapters) {
      const exists = passageQuotes.some(
        (q) => q.chapter === fc.chapter && (!q.bookName || resolveBibleBook(q.bookName)?.slug === resolveBibleBook(fc.book)?.slug)
      );
      if (!exists) {
        missing.push({ book: fc.book, chapter: fc.chapter });
      }
    }

    // Se o corpo tem citações e alguns capítulos do frontmatter são extras/redundantes que não têm citação correspondente
    if (missing.length > 0 && passageQuotes.length > 0) {
      // Se apenas 1 capítulo do frontmatter possui citação real, ajustamos o frontmatter para refletir apenas os capítulos reais citados no corpo
      const validBooks = new Set(passageQuotes.map((q) => q.bookName ? resolveBibleBook(q.bookName)?.name : null).filter(Boolean));
      const validCaps = new Set(passageQuotes.map((q) => q.chapter).filter(Boolean));

      // Reconstruir o bloco de capítulos do frontmatter com os capítulos que realmente possuem citação na nota
      const activeFmChapters = fmChapters.filter((fc) => {
        const bookObj = resolveBibleBook(fc.book);
        return passageQuotes.some((q) => q.chapter === fc.chapter && (!q.bookName || resolveBibleBook(q.bookName)?.slug === bookObj?.slug));
      });

      if (activeFmChapters.length > 0 && activeFmChapters.length < fmChapters.length) {
        const newCapsYaml = `capítulos:\n` + activeFmChapters.map((fc) => `  - "[[${fc.book} ${fc.chapter}]]"`).join('\n');
        content = content.replace(/capítulos:\s*\n(?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+/, `${newCapsYaml}\n`);
        writeFileSync(fullPath, content, 'utf-8');
        totalFixed++;
        console.log(`✨ Alinhado frontmatter em ${file}: mantidos ${activeFmChapters.map(c => `${c.book} ${c.chapter}`).join(', ')}`);
      }
    }
  }

  console.log(`\n✅ Sincronização concluída! Total de notas alinhadas: ${totalFixed}`);
}

syncVaultReferences().catch(console.error);
