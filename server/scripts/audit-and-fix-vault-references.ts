#!/usr/bin/env tsx
/**
 * Script de auditoria profunda para as 1017 notas do Vault:
 * 1. Corrige 'capítulos:' no frontmatter com [[Livro Cap:Verso]] -> [[Livro Cap]].
 * 2. Verifica se CADA capítulo listado no frontmatter tem sua respectiva citação em '### 📖 Contexto Bíblico'.
 * 3. Reporta qualquer nota onde faltar citação bíblica para um dos capítulos indicados.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { extractPassageQuotes, parseChapterLink } from '../src/lib/vault-parse.js';

const VAULT_DIR = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';

interface AuditDetail {
  file: string;
  frontmatterChapters: string[];
  missingBodyCitations: string[];
}

function deepAuditVault() {
  const files = readdirSync(VAULT_DIR).filter((f) => f.endsWith('.md'));
  const fixedFrontmatter: string[] = [];
  const missingCitations: AuditDetail[] = [];

  for (const file of files) {
    const fullPath = path.join(VAULT_DIR, file);
    let content = readFileSync(fullPath, 'utf-8');
    let modified = false;

    // 1. Limpeza de wikilinks incorretos no frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch?.[1]) {
      const rawFm = frontmatterMatch[1];
      const invalidWikilinkRegex = /\[\[([^\]:]+?\s+\d+):([\d\-,]+)\]\]/g;
      
      if (invalidWikilinkRegex.test(rawFm)) {
        const cleanedFm = rawFm.replace(invalidWikilinkRegex, '[[$1]]');
        content = content.replace(/^---\n[\s\S]*?\n---/, `---\n${cleanedFm}\n---`);
        modified = true;
        fixedFrontmatter.push(file);
      }
    }

    if (modified) {
      writeFileSync(fullPath, content, 'utf-8');
    }

    // 2. Extrair capítulos do frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const capsMatch = fmMatch?.[1]?.match(/capítulos:\s*\n((?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+)/);
    const fmChapters: { raw: string; book: string; chapter: number }[] = [];

    if (capsMatch?.[1]) {
      const rawLines = capsMatch[1].split('\n').filter((l) => l.trim().startsWith('-'));
      for (const line of rawLines) {
        const parsed = parseChapterLink(line);
        if (parsed) {
          fmChapters.push({ raw: line, book: parsed.book, chapter: parsed.chapter });
        }
      }
    }

    // 3. Extrair citações do corpo da nota (Contexto Bíblico)
    const passageQuotes = extractPassageQuotes(content);
    
    // 4. Cruzar se cada capítulo do frontmatter possui citação correspondente no corpo
    const missing: string[] = [];
    for (const fmCap of fmChapters) {
      const hasQuote = passageQuotes.some(
        (q) => q.chapter === fmCap.chapter && (!q.bookName || q.bookName.toLowerCase() === fmCap.book.toLowerCase())
      );

      // Se a nota não tem nenhuma citação com capítulo explícito, mas a citação é genérica (sem capítulo)
      if (!hasQuote && passageQuotes.length > 0) {
        missing.push(`${fmCap.book} ${fmCap.chapter}`);
      }
    }

    if (missing.length > 0) {
      missingCitations.push({
        file,
        frontmatterChapters: fmChapters.map((c) => `${c.book} ${c.chapter}`),
        missingBodyCitations: missing,
      });
    }
  }

  console.log('========================================');
  console.log('📊 AUDITORIA DE INTEGRIDADE DE VERSÍCULOS DO VAULT');
  console.log('========================================');
  console.log(`📄 Total de notas auditadas: ${files.length}`);
  console.log(`🛠️  Notas com wikilinks corrigidos no frontmatter: ${fixedFrontmatter.length}`);
  console.log(`⚠️  Notas onde o capítulo do frontmatter não tinha citação direta no corpo: ${missingCitations.length}`);
  
  if (missingCitations.length > 0) {
    console.log('\nExemplos de notas pendentes de citação direta por capítulo:');
    missingCitations.slice(0, 10).forEach((item) => {
      console.log(`- ${item.file}`);
      console.log(`  Capítulos no frontmatter: ${item.frontmatterChapters.join(', ')}`);
      console.log(`  Faltando citação no corpo: ${item.missingBodyCitations.join(', ')}`);
    });
  }
  console.log('========================================\n');
}

deepAuditVault();
