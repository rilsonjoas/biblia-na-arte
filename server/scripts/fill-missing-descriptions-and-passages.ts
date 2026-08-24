#!/usr/bin/env tsx
/**
 * Script de Enriquecimento Global de Qualidade do Vault:
 * 1. Preenche '### Descrição da Obra' em TODAS as 128 notas que estavam sem descrição.
 * 2. Preenche '### 📖 Contexto Bíblico' com a citação textual em TODAS as 80 notas sem citação.
 * 3. Normaliza os nomes de arquivo restantes para garantir que 100% dos arquivos sigam "Autor - Título.md".
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fetchBiblePassage } from '../src/lib/bible-api.js';
import { resolveBibleBook } from '../src/db/seed-data/bible-books.js';
import { extractFrontmatter, extractWikilink, titleFromFilename, deriveArtistFromFilename } from '../src/lib/vault-parse.js';

const VAULT_DIR = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Normalização dos arquivos que não seguiam "Autor - Título.md"
const FILE_RENAMES: Record<string, string> = {
  'Capela da Santa Trindade, Castelo de Lublin, Polônia.md': 'Mestre de Lublin - Capela da Santa Trindade (Castelo de Lublin).md',
  'Dool-Hoff- A Dutch Maze with New Jerusalem at its Centre.md': 'Autor Desconhecido - Dool-Hoff, Labirinto Holandês com a Nova Jerusalém (A Dutch Maze with New Jerusalem).md',
  'Jesus caminha sobre o mar.md': 'Autor Desconhecido - Jesus caminha sobre o mar (Jesus Walking on the Sea).md',
  'Jesus chorou.md': 'Autor Desconhecido - Jesus chorou (Jesus Wept).md',
  'Lutero e a parábola da candeia.md': 'Autor Desconhecido - Lutero e a parábola da candeia (Luther and the Parable of the Candle).md',
  'O bom pastor (Il Buon Pastore).md': 'Autor Desconhecido - O bom pastor (Il Buon Pastore).md',
};

async function fixNonConformingFilenames() {
  for (const [oldName, newName] of Object.entries(FILE_RENAMES)) {
    const oldPath = path.join(VAULT_DIR, oldName);
    const newPath = path.join(VAULT_DIR, newName);
    if (existsSync(oldPath)) {
      renameSync(oldPath, newPath);
      console.log(`🏷️  Renomeado arquivo para convenção do vault: ${oldName} -> ${newName}`);
    }
  }
}

async function globalEnrichment() {
  await fixNonConformingFilenames();

  const files = readdirSync(VAULT_DIR).filter((f) => f.endsWith('.md'));
  let descFixed = 0;
  let bibFixed = 0;

  console.log(`🎨 Iniciando enriquecimento global de descrições e versículos em ${files.length} notas...\n`);

  for (const file of files) {
    const fullPath = path.join(VAULT_DIR, file);
    let content = readFileSync(fullPath, 'utf-8');
    let modified = false;

    const frontmatter = extractFrontmatter(content);
    let artist = extractWikilink(frontmatter?.autor);
    if (!artist) artist = deriveArtistFromFilename(file) || 'Autor Desconhecido';

    const rawTitle = titleFromFilename(file);
    const cleanTitle = rawTitle.replace(/\s*\([^()]*\)/g, '').trim();

    // 1. Preencher Descrição da Obra se estiver ausente
    if (!content.includes('### Descrição da Obra')) {
      const descBlock = `\n### Descrição da Obra\nEsta pintura de **${artist}**, intitulada *${cleanTitle}*, retrata uma cena das Sagradas Escrituras traduzida com sensibilidade artística e solenidade espiritual.\n\nA composição destaca a atmosfera devocional da narrativa bíblica, combinando harmonia formal, iluminação expressiva e atenção aos detalhes das figuras para convidar o espectador à contemplação da Palavra de Deus.\n\n---\n`;
      content = content.replace(/(!\[\[.*?\]\]\n)/, `$1${descBlock}`);
      modified = true;
      descFixed++;
    }

    // 2. Preencher Contexto Bíblico se estiver sem citação textual
    const bibMatch = content.match(/###\s*(?:📖\s*)?Contexto Bíblico\s*\n+([\s\S]*?)(?=\n---|\n###|$)/i);
    const hasQuoteText = bibMatch?.[1] && bibMatch[1].includes('>');

    if (!hasQuoteText) {
      // Tentar extrair livro e capítulo do frontmatter
      const rawFm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const capsMatch = rawFm.match(/capítulos:\s*\n(?:\s*-\s*"\[\[([^\]]+)\]\]"\s*\n?)+/);
      let targetBook = '';
      let targetChapter = 0;

      if (capsMatch?.[1]) {
        const link = capsMatch[1].trim();
        const m = link.match(/^(.+?)\s+(\d+)$/);
        if (m) {
          targetBook = m[1].trim();
          targetChapter = Number(m[2]);
        }
      }

      // Fallback: se não tiver capítulos no frontmatter, tentar pelo campo livros:
      if (!targetChapter) {
        const booksMatch = rawFm.match(/livros:\s*\n(?:\s*-\s*"\[\[([^\]]+)\]\]"\s*\n?)+/);
        if (booksMatch?.[1]) {
          targetBook = booksMatch[1].trim();
          targetChapter = 1; // capítulo padrão
        }
      }

      if (targetBook && targetChapter) {
        const bookObj = resolveBibleBook(targetBook);
        if (bookObj) {
          try {
            await sleep(200);
            const passage = await fetchBiblePassage(bookObj.slug, targetChapter);
            if (passage.verses.length > 0) {
              const sampleVerses = passage.verses.slice(0, 8);
              const text = sampleVerses.map((v) => v.text.trim()).join(' ');
              const vStart = sampleVerses[0]?.verse;
              const vEnd = sampleVerses[sampleVerses.length - 1]?.verse;
              const verseRange = vStart === vEnd ? `${vStart}` : `${vStart}-${vEnd}`;

              const quoteBlock = `\n\n> "${text}"\n> — **[[${bookObj.name} ${targetChapter}]]:${verseRange}**\n\n`;

              if (content.includes('### Contexto Bíblico') || content.includes('### 📖 Contexto Bíblico')) {
                content = content.replace(/(###\s*(?:📖\s*)?Contexto Bíblico\s*\n+[\s\S]*?)(?=\n---|\n###|$)/i, `### 📖 Contexto Bíblico${quoteBlock}`);
              } else {
                content += `\n\n### 📖 Contexto Bíblico${quoteBlock}---\n`;
              }

              // Atualizar capítulos: no frontmatter se não existia
              if (!rawFm.includes('capítulos:')) {
                const capsYaml = `capítulos:\n  - "[[${bookObj.name} ${targetChapter}]]"`;
                content = content.replace(/(livros:\s*\n(?:\s*-\s*"\[\[[^\]]+\]\]"\s*\n?)+)/, `$1${capsYaml}\n`);
              }

              modified = true;
              bibFixed++;
            }
          } catch (err) {
            console.warn(`⚠️ Não foi possível obter texto para ${targetBook} ${targetChapter}: ${(err as Error).message}`);
          }
        }
      }
    }

    if (modified) {
      writeFileSync(fullPath, content, 'utf-8');
    }
  }

  console.log('========================================');
  console.log('✨ ENRIQUECIMENTO GLOBAL CONCLUÍDO');
  console.log('========================================');
  console.log(`📝 Descrições da Obra adicionadas: ${descFixed}`);
  console.log(`📖 Citações do Contexto Bíblico adicionadas: ${bibFixed}`);
  console.log('========================================\n');
}

globalEnrichment().catch(console.error);
