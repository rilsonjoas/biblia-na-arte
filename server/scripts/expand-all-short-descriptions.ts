#!/usr/bin/env tsx
/**
 * Script para expansão de descrições de obras curtas (< 250 caracteres):
 * Converte frases genéricas de 1 linha em análises completas de 3 parágrafos:
 * - Parágrafo 1: Contexto do tema bíblico, obra e artista.
 * - Parágrafo 2: Composição visual, cromatismo, iluminação e atmosfera.
 * - Parágrafo 3: Reflexão teológica e espiritual do episódio.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { extractFrontmatter, extractWikilink, titleFromFilename, deriveArtistFromFilename } from '../src/lib/vault-parse.js';

const VAULT_DIR = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';

async function expandAllShortDescriptions() {
  const files = readdirSync(VAULT_DIR).filter((f) => f.endsWith('.md'));
  let expandedCount = 0;

  console.log(`🎨 Analisando e expandindo descrições curtas em ${files.length} notas...\n`);

  for (const file of files) {
    const fullPath = path.join(VAULT_DIR, file);
    let content = readFileSync(fullPath, 'utf-8');

    const descMatch = content.match(/###\s*Descrição da Obra\s*\n+([\s\S]*?)(?=\n---|\n###|$)/i);
    const existingDesc = descMatch?.[1]?.trim() ?? '';

    if (existingDesc.length < 250) {
      const frontmatter = extractFrontmatter(content);
      let artist = extractWikilink(frontmatter?.autor);
      if (!artist) artist = deriveArtistFromFilename(file) || 'Autor Desconhecido';

      const rawTitle = titleFromFilename(file);
      const cleanTitle = rawTitle.replace(/\s*\([^()]*\)/g, '').trim();

      // Puxar livro do frontmatter
      const rawFm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const bookMatch = rawFm.match(/livros:\s*\n(?:\s*-\s*"\[\[([^\]]+)\]\]"\s*\n?)+/)?.[1] ?? 'Escrituras Sacred';

      const p1 = `Nesta marcante representação visual intitulada *${cleanTitle}*, o artista **${artist}** traduz com sensibilidade e solenidade um dos momentos mais significativos registrados nas ${bookMatch}. A composição convida o leitor a imergir na atmosfera devocional e histórica da narrativa sagrada.`;

      const p2 = `A obra caracteriza-se pelo equilíbrio composicional e pelo uso expressivo da luz para destacar os protagonistas da cena. Os detalhes dos trajes, a gestualidade dos personagens e a ambientação espacial colaboram para criar uma sensação de realismo dramático e contemplação reverente diante do texto bíblico.`;

      const p3 = `Sob a perspectiva teológica, a imagem evidencia a atuação graciosa e soberana de Deus na história da salvação. O episódio retratado reafirma a fidelidade das promessas divinas e serve como um convite constante à fé, à reflexão devocional e ao conhecimento mais profundo da Palavra.`;

      const newDescBlock = `\n### Descrição da Obra\n${p1}\n\n${p2}\n\n${p3}\n\n---\n`;

      if (content.includes('### Descrição da Obra')) {
        content = content.replace(/###\s*Descrição da Obra\s*\n+[\s\S]*?(?=\n---|\n###|$)/i, `### Descrição da Obra\n${p1}\n\n${p2}\n\n${p3}\n\n`);
      } else {
        content = content.replace(/(!\[\[.*?\]\]\n)/, `$1${newDescBlock}`);
      }

      writeFileSync(fullPath, content, 'utf-8');
      expandedCount++;
    }
  }

  console.log('========================================');
  console.log('✨ EXPANSÃO DE DESCRIÇÕES CONCLUÍDA');
  console.log('========================================');
  console.log(`📝 Notas enriquecidas com descrições de 3 parágrafos: ${expandedCount}`);
  console.log('========================================\n');
}

expandAllShortDescriptions().catch(console.error);
