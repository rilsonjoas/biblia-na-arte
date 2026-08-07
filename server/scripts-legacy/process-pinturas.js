#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Função para extrair artista do link do Notion
function extractArtist(authorLink) {
  if (!authorLink || authorLink === '||||') return null;
  
  // Remover links de imagem se existir
  let cleaned = authorLink.replace(/!\[\[.*?\]\]/, '');
  
  // Extrair nome do artista do link do Notion
  const match = cleaned.match(/\[([^\]]+)\]/);
  if (match) {
    let artist = match[1];
    // Remover anos de nascimento/morte se existirem
    artist = artist.replace(/\s*\(\d{4}\s*[-–]\s*\d{4}\)/, '');
    artist = artist.replace(/\s*\(\d{4}\s*[-–]\s*\)/, '');
    artist = artist.replace(/\s*\(\d{4}\)/, '');
    return artist.trim();
  }
  
  return null;
}

// Função para extrair referências bíblicas
function extractBibleReferences(booksLink, chaptersLink) {
  const references = [];
  
  if (chaptersLink && chaptersLink.trim() && !chaptersLink.includes('||||')) {
    // Extrair do link de capítulos específicos
    const chapterMatch = chaptersLink.match(/\[([^\]]+)\]/);
    if (chapterMatch) {
      const chapterInfo = chapterMatch[1];
      // Parse do formato "1 Samuel 17" ou similar
      const parts = chapterInfo.split(' ');
      if (parts.length >= 2) {
        const chapter = parseInt(parts[parts.length - 1]);
        const book = parts.slice(0, -1).join(' ');
        if (!isNaN(chapter)) {
          references.push({
            book: book,
            bookSlug: book.toLowerCase().replace(/\s+/g, '-'),
            chapter: chapter,
            verses: null
          });
        }
      }
    }
  }
  
  return references;
}

// Função para gerar ID único para a obra
function generateId(title, artist) {
  let base = title.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-')     // Substitui espaços por hífens
    .replace(/--+/g, '-')     // Remove hífens duplos
    .replace(/^-|-$/g, '');   // Remove hífens no início/fim
  
  if (artist) {
    const artistPart = artist.toLowerCase().split(' ')[0]; // Primeiro nome do artista
    base = `${artistPart}-${base}`;
  }
  
  return base;
}

// Função para extrair referência de imagem de um arquivo .md
function extractImageFromMarkdown(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar por padrão ![[nome-arquivo.jpg]]
    const imageMatch = content.match(/!\[\[([^\]]+\.(jpg|jpeg|png|gif|webp))\]\]/i);
    if (imageMatch) {
      const imageName = imageMatch[1];
      
      // Verificar se o arquivo existe em src/assets/
      const imagePath = `./src/assets/${imageName}`;
      if (fs.existsSync(imagePath)) {
        return `/src/assets/${imageName}`;
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Erro ao ler arquivo ${filePath}:`, error.message);
    return null;
  }
}

// Função para extrair metadados do frontmatter
function extractMetadataFromMarkdown(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extrair frontmatter se existir
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const metadata = {};
      
      // Parse simples do YAML
      const lines = frontmatter.split('\n');
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          metadata[key] = value;
        }
      }
      
      return metadata;
    }
    
    return {};
  } catch (error) {
    console.warn(`Erro ao extrair metadados de ${filePath}:`, error.message);
    return {};
  }
}

// Função para extrair descrição do arquivo .md
function extractDescriptionFromMarkdown(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remover frontmatter
    let description = content.replace(/^---[\s\S]*?---\n?/, '');
    
    // Remover referências de imagem
    description = description.replace(/!\[\[[^\]]+\]\]/g, '');
    
    // Limpar quebras de linha extras e espacos
    description = description.trim().replace(/\n\s*\n/g, '\n').replace(/\n/g, ' ');
    
    return description || null;
  } catch (error) {
    console.warn(`Erro ao extrair descrição de ${filePath}:`, error.message);
    return null;
  }
}

// Ler todos os arquivos .md na pasta pinturas
const pinturasPath = './src/assets/pinturas/';
const mdFiles = fs.readdirSync(pinturasPath).filter(file => file.endsWith('.md'));

console.log(`Encontrados ${mdFiles.length} arquivos .md para processar`);

const artworks = [];

// Processar cada arquivo .md individual
for (const mdFile of mdFiles) {
  const filePath = path.join(pinturasPath, mdFile);
  
  // Extrair título do nome do arquivo (remover .md)
  const title = path.basename(mdFile, '.md');
  
  // Extrair metadados do frontmatter
  const metadata = extractMetadataFromMarkdown(filePath);
  
  // Extrair referência de imagem
  const imageUrl = extractImageFromMarkdown(filePath);
  
  // Extrair descrição
  const description = extractDescriptionFromMarkdown(filePath);
  
  // Usar ano dos metadados se disponível
  const year = metadata.Data || "Data Desconhecida";
  
  const artwork = {
    id: generateId(title, null),
    title: title,
    artistOrDirector: "Artista Desconhecido", // Por enquanto, pois não temos essa informação nos arquivos .md individuais
    year: year,
    category: "painting",
    mediumOrGenre: "Pintura",
    imageUrl: imageUrl,
    description: description || `Obra de arte representando ${title}.`,
    references: [], // Por enquanto vazio, pois não temos essa informação nos arquivos .md individuais
    sourceUrl: null,
    dimensionsOrDuration: null
  };
  
  artworks.push(artwork);
}

console.log(`Processadas ${artworks.length} obras de arte`);

// Gerar arquivo JavaScript com as novas obras
const jsContent = `// Obras processadas automaticamente do arquivo Pinturas.md
export const pinturas = ${JSON.stringify(artworks, null, 2)};
`;

fs.writeFileSync('./src/data/pinturas.ts', jsContent);
console.log('Arquivo pinturas.ts criado com sucesso!');

// Estatísticas
const withYear = artworks.filter(a => a.year !== "Data Desconhecida").length;
const withImages = artworks.filter(a => a.imageUrl !== null).length;
const withDescription = artworks.filter(a => a.description && !a.description.startsWith("Obra de arte representando")).length;

console.log('\nEstatísticas:');
console.log(`- Obras com ano definido: ${withYear}/${artworks.length}`);
console.log(`- Obras com imagens encontradas: ${withImages}/${artworks.length}`);
console.log(`- Obras com descrição personalizada: ${withDescription}/${artworks.length}`);