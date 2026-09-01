#!/usr/bin/env tsx
/**
 * Lê as ~1000 notas de pintura do vault Obsidian, aplica as decisões da
 * auditoria de direitos autorais (ver "Auditoria de Direitos Autorais -
 * Bíblia na Arte" no vault, 2026-08-07), converte as imagens aprovadas pra
 * WebP direto em web/public/images/ (não copia o original — ver "Pipeline
 * de imagens" no ROADMAP.md, decisão 2026-08-15: antes disso a otimização
 * era um script manual à parte, fácil de esquecer de rodar de novo depois
 * de um re-export; agora todo re-export já sai otimizado, sem passo extra)
 * e escreve um JSON com os dados prontos pra importar no Postgres
 * (import-seed-data.ts, que roda perto do banco no VPS).
 *
 * Limpa OUTPUT_IMAGES_DIR antes de regenerar — o diretório é 100% derivado
 * do vault (mesma filosofia do import-seed-data.ts: fonte da verdade é o
 * vault, não o disco), então um re-export não deve deixar sobras de
 * artistas excluídos numa auditoria anterior.
 *
 * Só roda no desktop do Rilson (é onde o vault mora) — não faz parte do
 * deploy, é uma etapa de curadoria manual.
 *
 * Uso: pnpm --filter server exec tsx scripts/export-vault-data.ts
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  extractBiography,
  extractClassicCommentary,
  extractDescription,
  extractFrontmatter,
  extractPassageQuotes,
  extractVerseFromContext,
  extractWikilink,
  findImageFile,
  deriveArtistFromFilename,
  normalizeForComparison,
  parseChapterLink,
  parseTitleParts,
  slugify,
  titleFromFilename,
} from '../src/lib/vault-parse.js';
import { resolveBibleBook } from '../src/db/seed-data/bible-books.js';

const VAULT_PINTURAS = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Pinturas';
const VAULT_ANEXOS = '/home/narniano/Documentos/Rilson/0 - Anexos';
const VAULT_AUTORES = '/home/narniano/Documentos/Rilson/10 - Arte e literatura/Autores';
const OUTPUT_IMAGES_DIR = path.resolve(import.meta.dirname, '../../web/public/images');
const OUTPUT_JSON = path.resolve(import.meta.dirname, 'vault-export.json');

// ---------------------------------------------------------------------
// Listas de exclusão — fonte da verdade é a nota de auditoria no vault.
// Nomes exatamente como aparecem no campo `autor:` corrigido (wikilink).
// ---------------------------------------------------------------------

/** Lista 🔴 completa (alto risco) + Wang/Latimore (decisão 2026-08-07: não
 * perseguir licenciamento por enquanto, fica pra um futuro se fizer
 * sentido revisitar) + Nobleheart (achado durante a migração — artista
 * pseudônimo contemporâneo de arte devocional web, mesmo perfil de risco
 * dos outros, nunca foi auditado por não aparecer com esse nome antes). */
const EXCLUDED_ARTISTS = new Set([
  'Kirk Richards',
  'Andrei Bodko',
  'Ivanka Demchuk',
  'Elizabeth Wang', // licenciamento não é prioridade agora (Radiant Light)
  'Candido Portinari',
  'Cândido Portinari',
  'Yongsung Kim',
  'Kateryna Kuziv',
  'Borys Sheremeta',
  'Lyuba Yatskiv',
  'Salvador Dalí',
  'Janet McKenzie',
  'Timothy Schmalz',
  'The Chosen', // nem é pintura, still de série de TV
  'Kelly Latimore', // licenciamento não é prioridade agora
  'Josh Tiessen',
  'Danny Hahlbohm',
  'Kim Ki-chang', // falecido em 2001 — obra protegida (KR até ~2072, US até ~2048); decisão do Rilson em 2026-08-22
  'Dan Hillier',
  'Pablo Sanaguano',
  'Soichi Watanabe',
  'He Qi',
  'Henk Helmantel',
  'Maximino Cerezo Barredo',
  'Liz Lemon Swindle',
  'Walter Rane',
  'Arnold Friberg',
  'Mariusz Lewandowski',
  'Kim Ki-chang',
  'Takato Yamamoto',
  'Aaron Douglas',
  'Charles S Ndege',
  'Olya Kravchenko',
  'Olivia McLeod',
  'Natalya Rusetska',
  'Luke Hua Xiaoxian',
  'Nobleheart', // achado 2026-08-08, mesmo perfil dos outros contemporâneos
]);

// Comparação normalizada (sem acento, sem caixa) — achado real 2026-08-23:
// "Kim Ki-chang" (excluído, autor falecido/protegido) e "Kim Ki-Chang" (nota
// diferente, "C" maiúsculo) são o MESMO artista pro humano, mas
// EXCLUDED_ARTISTS.has() faz comparação exata de string — a variante com
// capitalização diferente passava batido e ficava exposta em produção.
// Mesma classe de bug já achada em data-fixes.sql (2ª obra da Sylwia
// Perczak) — nome de artista digitado de forma levemente diferente entre
// notas do vault não pode depender de bater caractere por caractere.
const EXCLUDED_ARTISTS_NORMALIZED = new Set([...EXCLUDED_ARTISTS].map(normalizeForComparison));

/** Nomes que, depois de resolvidos (frontmatter ou fallback pelo nome do
 * arquivo), indicam "sem autor identificado" — tratado como allowlist, não
 * blocklist: por padrão TODA pintura de autor desconhecido fica de fora,
 * só entram as explicitamente confirmadas seguras abaixo. */
const UNKNOWN_AUTHOR_VALUES = new Set(['autor desconhecido', 'desconhecido']);

/** As 16 pinturas de autor desconhecido confirmadas seguras na auditoria
 * (pré-1900 por data no frontmatter, ou mural/mosaico identificado com
 * artista+data que elimina qualquer dúvida — ver nota de auditoria,
 * seção ⚫). Qualquer outra pintura de autor desconhecido (as 4 que
 * ficaram sem resolução + as descobertas depois, durante a escrita deste
 * script) fica de fora por padrão. */
const ALLOWED_UNKNOWN_AUTHOR_FILENAMES = new Set([
  'Autor Desconhecido - Ceia em Emaús no Tabernáculo de Cherves (Supper at Emmaus on the Tabernacle of Cherves).md',
  'Autor Desconhecido - Criação do Universo (Creation of the Universe).md',
  'Autor Desconhecido - Entrada de Jesus em Jerusalém, 1856 (Entry of Jesus into Jerusalem).md',
  'Autor Desconhecido - Jesus Amaldiçoa a Figueira (Jesus Curses the Fig Tree).md',
  'Autor Desconhecido - Judas recebendo 30 moedas de prata (Judas recebendo 30 moedas de prata).md',
  'Autor Desconhecido - Maria unge os pés de Jesus (Mary Anoints the Feet of Jesus).md',
  'Autor Desconhecido - O sonho de José e a jornada até Belém (O sonho de José e a jornada até Belém).md',
  'Autor Desconhecido - Os temperados e os intemperados (Os temperados e os intemperados).md',
  'Autor Desconhecido - Paulo e Barnabé tomados por deuses (Paul and Barnabas at Lystra).md',
  'Autor Desconhecido - Transfiguração de Cristo (Transfiguration of Christ).md',
  'Autor desconhecido - A natividade.md',
  'Autor desconhecido - Os alegres mártires de Nagasaki  The Joyful Martyrs of Nagasaki (The Joyful Martyrs of Nagasaki).md',
  'Desconhecido - A Adoração do Cordeiro (Adoration of the Lamb).md',
  'Desconhecido - A Incredulidade de Tomé.md',
  'Autor Desconhecido - A Transfiguração (The Transfiguration).md', // mosaico do Monte Tabor, Umberto Noni, 1924
  'Autor Desconhecido - Pentecoste (Pentecoste).md', // capela de Eugenio Cisterna, Lourdes, 1893-1907
]);

/** Notas vazias (stub) ou de tema NÃO-bíblico que entraram na pasta
 * Pinturas — achado original 2026-08-16 (3 paisagens/gêneros de Van Gogh,
 * frontmatter e corpo vazios), expandido em 2026-09-01 (achado ao investigar
 * "A Colheita" aparecendo no site: mais 3 casos de conexão bíblica forçada
 * sobre paisagem/gênero — 2 deles o próprio texto da nota admite "não
 * retrata uma cena bíblica específica"). Em vez de forçar uma "conexão
 * bíblica" inventada, ficam de fora do catálogo — mesmo princípio já usado
 * para obras sem licença permissiva: se não pertence de fato ao escopo, não
 * entra. As notas continuam no vault (não foram apagadas), só excluídas da
 * exportação.
 *
 * **Bug encontrado e corrigido em 2026-09-01**: esta lista comparava o nome
 * de arquivo EXATO, mas o processo externo de renomeação do vault (que
 * acrescenta o `titulo_original` como subtítulo entre parênteses) já tinha
 * silenciosamente quebrado 14 das 22 entradas — essas 14 pinturas voltaram
 * a aparecer no site sem ninguém perceber. Corrigido: agora compara pela
 * chave estável (autor + título, antes do primeiro parêntese), que sobrevive
 * ao processo de renomeação — ver `nonBiblicalKey()` abaixo. */
function nonBiblicalKey(filename: string): string {
  // Corta no primeiro " (" — o subtítulo (titulo_original) do processo de
  // renomeação sempre vem depois disso, mesmo quando o próprio subtítulo
  // tem parênteses aninhados (ex.: "Celebração (La Fête ... (F 222)).md").
  // Nenhuma das entradas desta lista tem parêntese como parte do título
  // real antes do subtítulo, então cortar no primeiro " (" é seguro aqui.
  return filename.replace(/\.md$/, '').split(' (')[0]!.trim();
}

const EXCLUDED_NON_BIBLICAL_KEYS = new Set(
  [
    'Vincent Van Gogh - A Amoreira (The Mulberry Tree).md',
    'Vincent Van Gogh - Celebração.md',
    'Vincent Van Gogh - Paisagem com casas.md',
    'Gustave Doré - Os espíritos em Júpiter (Os espíritos em Júpiter).md',
    'Albert Bierstadt - Tempestade nas montanhas (Storm in the mountains).md',
    'Albert Chevalier Taylor - Um feixe de luz solar.md',
    'Caspar David Friedrich - Dois homens contemplando a Lua.md',
    'Charles Edward Chambers - Casal se despedindo na varanda sob a neve (Couple Parting on Porch in Snow).md',
    'Claude Monet - Impressão, Sol Nascente.md',
    'Claude Monet - Um campo de tulipas na Holanda.md',
    'Elizabeth Sonrel - O jardim das virgens (Le jardin des vierges).md',
    'John William Godward - Dolce Far Niente.md',
    'Jose Ferraz de Almeida Júnior - Saudade.md',
    'L. A. Fomichev - Ciência Soviética (Soviet science).md',
    'Luigi Loir - O café noturno (The night café).md',
    'Oscar Pereira da Silva - Desembarque de Pedro Álvares Cabral em Porto Seguro em 1500.md',
    'Pedro Bruno - A Pátria.md',
    'Rafael - A escola de Atenas.md',
    'Rob Gonsalves - O Sol Zarpa (The Sun Sets Sail).md',
    'Viggo Johansen - Alegre Natal.md',
    'Wenzel Hablik - Céu estrelado.md',
    'Émile Friant - Os Namorados (Les Amoureux).md',
    // Achados 2026-09-01 (mesmo padrão: paisagem/gênero com conexão bíblica forçada)
    'Vincent van Gogh - A Colheita (La moisson).md',
    'J. C. Leyendecker - Lune de Miel (Lua de Mel).md',
    'Kiyoshi Yamashita - Fogos de artifício (長岡の花火 (Nagaoka no Hanabi - Fogos de Nagaoka)).md',
  ].map(nonBiblicalKey),
);

/** Autor -> { licença, texto de atribuição } pra quem não é domínio
 * público simples mas está aprovado com licença explícita. */
const LICENSED_ARTISTS: Record<string, { licenseType: string; attributionText: string }> = {
  'Andrei Mironov': {
    licenseType: 'cc-by-sa-4.0',
    attributionText:
      'Andrei Mironov, CC BY-SA 4.0, via Wikimedia Commons (https://commons.wikimedia.org/wiki/Category:Religious_paintings_by_Andrei_Mironov)',
  },
};

// ---------------------------------------------------------------------

interface ExportedReference {
  book: string;
  bookSlug: string;
  chapter: number;
  verses?: string | undefined;
  passageText?: string | undefined;
}

interface ExportedArtwork {
  slug: string;
  title: string;
  subtitle?: string | undefined;
  artistOrDirector: string;
  year?: string | undefined;
  category: 'painting';
  description: string;
  imageFile: string; // nome do arquivo já copiado pra web/public/images/
  licenseType: string;
  attributionText?: string | undefined;
  // "Onde ver pessoalmente" (roadmap Fase 5) — campo `localizacao` no
  // frontmatter do vault, texto livre tipo "Cleveland Museum of Art,
  // Cleveland, EUA". Opcional de propósito: preenchido só onde a
  // curadoria já confirmou museu/acervo — não força dado que não existe.
  location?: string | undefined;
  sourceUrl?: string | undefined;
  classicCommentaryAuthor?: string | undefined;
  classicCommentary?: string | undefined;
  references: ExportedReference[];
}

interface ExportedArtist {
  name: string;
  slug: string;
  bio: string | null;
}

async function main() {
  if (existsSync(OUTPUT_IMAGES_DIR)) {
    for (const f of readdirSync(OUTPUT_IMAGES_DIR)) {
      try { rmSync(path.join(OUTPUT_IMAGES_DIR, f), { recursive: true, force: true }); } catch (err) { void err; }
    }
  } else {
    mkdirSync(OUTPUT_IMAGES_DIR, { recursive: true });
  }

  const files = readdirSync(VAULT_PINTURAS).filter((f) => f.endsWith('.md'));

  const artworks: ExportedArtwork[] = [];
  const skipped: { file: string; reason: string }[] = [];
  const unresolvedBooks = new Set<string>();
  const usedSlugs = new Map<string, number>();
  let optimizeFailures = 0;

  for (const file of files) {
    const fullPath = path.join(VAULT_PINTURAS, file);
    const content = readFileSync(fullPath, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (EXCLUDED_NON_BIBLICAL_KEYS.has(nonBiblicalKey(file))) {
      skipped.push({ file, reason: 'stub sem tema bíblico (obra confirmada não-bíblica, achado 2026-08-16)' });
      continue;
    }

    if (!frontmatter || !frontmatter.autor) {
      skipped.push({ file, reason: 'sem frontmatter válido ou sem campo autor' });
      continue;
    }

    let artist = extractWikilink(frontmatter.autor);
    if (!artist) artist = deriveArtistFromFilename(file);

    if (!artist) {
      skipped.push({ file, reason: 'autor não identificável (frontmatter vazio + nome de arquivo sem convenção)' });
      continue;
    }

    if (EXCLUDED_ARTISTS_NORMALIZED.has(normalizeForComparison(artist))) {
      skipped.push({ file, reason: `artista excluído: ${artist}` });
      continue;
    }

    if (UNKNOWN_AUTHOR_VALUES.has(normalizeForComparison(artist)) && !ALLOWED_UNKNOWN_AUTHOR_FILENAMES.has(file)) {
      skipped.push({ file, reason: 'autor desconhecido, não confirmado seguro na auditoria' });
      continue;
    }

    const imageSourcePath = findImageFile(content, VAULT_ANEXOS);
    if (!imageSourcePath) {
      skipped.push({ file, reason: 'sem imagem válida em 0 - Anexos' });
      continue;
    }

    const parsedTitle = parseTitleParts(titleFromFilename(file));
    const title = parsedTitle.title;

    // Desempate determinístico de slug (achado 2026-08-22: 8 grupos de
    // notas geravam o MESMO slug e, portanto, a mesma imagem no banco).
    // O 1º arquivo mantém o slug limpo (URLs/imagens já indexadas ficam
    // estáveis); duplicatas recebem o ano da obra e, se ainda colidir,
    // sufixo numérico (-2, -3...). Curadoria final por par continua no
    // vault (excluir duplicado verdadeiro como os 3 Van Gogh).
    const baseSlug = slugify(`${artist}-${title}`);
    let slug = baseSlug;
    if (usedSlugs.has(baseSlug)) {
      const yearDigits = String(frontmatter.ano ?? frontmatter.data ?? '').match(/\d{4}/)?.[0];
      const withYear = yearDigits ? `${baseSlug}-${yearDigits}` : '';
      if (withYear && !usedSlugs.has(withYear)) {
        slug = withYear;
      } else {
        let suffix = 2;
        while (usedSlugs.has(`${baseSlug}-${suffix}`)) suffix++;
        slug = `${baseSlug}-${suffix}`;
      }
      console.warn(`⚠️  Slug duplicado desambiguado: ${baseSlug} -> ${slug} (${file})`);
    }
    usedSlugs.set(slug, (usedSlugs.get(slug) ?? 0) + 1);
    const imageFile = `${slug}.webp`;

    // Mesmos parâmetros do antigo optimize-images.ts (agora só um backfill
    // manual, não faz mais parte do fluxo normal): max 1600px, qualidade
    // 82 — fidelidade adequada pra arte, ~79% menor que jpg/png original.
    try {
      await sharp(imageSourcePath)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(path.join(OUTPUT_IMAGES_DIR, imageFile));
    } catch (err) {
      optimizeFailures++;
      skipped.push({ file, reason: `falha ao converter imagem pra WebP: ${(err as Error).message}` });
      continue;
    }

    const passageQuotes = extractPassageQuotes(content);
    const references: ExportedReference[] = [];
    const capitulos = Array.isArray(frontmatter.capítulos) ? frontmatter.capítulos : [];

    for (let i = 0; i < capitulos.length; i++) {
      const raw = capitulos[i];
      const parsed = parseChapterLink(raw);
      if (!parsed) continue;
      const book = resolveBibleBook(parsed.book);
      if (!book) {
        unresolvedBooks.add(parsed.book);
        continue;
      }
      const verses = parsed.verse || extractVerseFromContext(content, book.name, parsed.chapter) || extractVerseFromContext(content, parsed.book, parsed.chapter);

      // Find matching quote for this specific reference
      const matchedQuote = passageQuotes.find(
        (q) => (q.chapter === parsed.chapter && (!q.bookName || resolveBibleBook(q.bookName)?.slug === book.slug)) ||
               (capitulos.length === 1 && passageQuotes.length === 1)
      );

      const refPassageText = matchedQuote ? matchedQuote.text : (i === 0 && passageQuotes.length > 0 && !passageQuotes.some(q => q.chapter) ? passageQuotes.map(q => q.text).join('\n\n') : undefined);

      references.push({
        book: book.name,
        bookSlug: book.slug,
        chapter: parsed.chapter,
        verses: verses || undefined,
        passageText: refPassageText || undefined,
      });
    }

    const licensed = LICENSED_ARTISTS[artist];
    const yearRaw = frontmatter.ano ?? frontmatter.data;
    const year = yearRaw !== undefined && yearRaw !== '' ? String(yearRaw) : undefined;
    const classicCommentary = extractClassicCommentary(content);

    artworks.push({
      slug,
      title,
      subtitle: parsedTitle.subtitle,
      artistOrDirector: artist,
      year,
      category: 'painting',
      description: extractDescription(content) || `${title}, de ${artist}.`,
      imageFile,
      licenseType: licensed?.licenseType ?? 'public-domain',
      attributionText: licensed?.attributionText,
      location: typeof frontmatter.localizacao === 'string' && frontmatter.localizacao.trim()
        ? frontmatter.localizacao.trim()
        : undefined,
      // Achado 2026-09-01 (Rilson perguntou "os links de fonte oficial
      // estão aparecendo pros usuários?" — a resposta era não, quase
      // nunca): lia `frontmatter.fonte`, mas o campo real usado em toda
      // nota do vault é `fonte_localizacao`. Só as 10 notas (de 904!) que
      // por acaso usavam o nome errado é que já tinham sourceUrl
      // preenchido — bug de longa data, não um achado de hoje.
      sourceUrl: typeof frontmatter.fonte_localizacao === 'string' && frontmatter.fonte_localizacao.trim()
        ? frontmatter.fonte_localizacao.trim()
        : undefined,
      classicCommentaryAuthor: classicCommentary?.author,
      classicCommentary: classicCommentary?.text,
      references,
    });
  }

  // Achado ao testar o export com a tabela `artists` nova: o mesmo pintor
  // aparece com grafias levemente diferentes em notas diferentes (ex.:
  // "Jan Bruegel o Velho" vs "Jan Bruegel, o Velho" — vírgula some/aparece
  // conforme quem escreveu a nota). `normalizeForComparison` (só
  // acento/caixa) NÃO pega isso — vírgula sobrevive, os dois continuam
  // "diferentes" — mas `slugify()` das duas dá o MESMO slug, quebrando a
  // constraint UNIQUE de `artists.slug` de verdade. Agrupa pelo PRÓPRIO
  // slug (a fonte real da colisão, não uma aproximação) e reescreve
  // `artistOrDirector` de toda obra pra uma forma canônica única —
  // preferindo a grafia que tem nota correspondente em `Autores/`, senão
  // a mais frequente no acervo. Sem isso, a galeria da página de artista
  // (que casa por NOME exato) também perderia as obras da grafia "errada".
  const nameVariantsBySlug = new Map<string, Map<string, number>>();
  for (const art of artworks) {
    const s = slugify(art.artistOrDirector);
    const variants = nameVariantsBySlug.get(s) ?? new Map<string, number>();
    variants.set(art.artistOrDirector, (variants.get(art.artistOrDirector) ?? 0) + 1);
    nameVariantsBySlug.set(s, variants);
  }
  const canonicalNameBySlug = new Map<string, string>();
  for (const [s, variants] of nameVariantsBySlug) {
    const withAuthorNote = [...variants.keys()].find((n) => existsSync(path.join(VAULT_AUTORES, `${n}.md`)));
    const mostFrequent = [...variants.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    canonicalNameBySlug.set(s, withAuthorNote ?? mostFrequent ?? [...variants.keys()][0]!);
  }
  for (const art of artworks) {
    art.artistOrDirector = canonicalNameBySlug.get(slugify(art.artistOrDirector))!;
  }

  // "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23) — 1 entrada
  // por artista DISTINTO que sobrou em `artworks` (depois de toda exclusão
  // de direitos autorais já aplicada acima e da canonicalização de nome
  // acima), não por artista listado no vault — evita gerar página de
  // artista pra alguém excluído do catálogo, o que seria uma página vazia
  // sem obra nenhuma. Nota de `Autores/*.md` é opcional: casa pelo nome
  // exato do arquivo (mesmo texto de `artistOrDirector`, já
  // resolvido/normalizado acima); sem nota correspondente, a página ainda
  // funciona só com a galeria, `bio` fica `null` em vez de inventar texto.
  const distinctArtists = [...new Set(artworks.map((a) => a.artistOrDirector))].sort();
  const artists: ExportedArtist[] = distinctArtists.map((name) => {
    const authorPath = path.join(VAULT_AUTORES, `${name}.md`);
    let bio: string | null = null;
    if (existsSync(authorPath)) {
      const authorContent = readFileSync(authorPath, 'utf-8');
      bio = extractBiography(authorContent) || null;
    }
    return { name, slug: slugify(name), bio };
  });

  writeFileSync(
    OUTPUT_JSON,
    JSON.stringify({ artworks, artists, exportedAt: new Date().toISOString() }, null, 2),
  );

  console.log(`✅ ${artworks.length} pinturas exportadas (imagens já em WebP)`);
  console.log(`👤 ${artists.length} artistas (${artists.filter((a) => a.bio).length} com biografia do vault)`);
  console.log(`⏭️  ${skipped.length} puladas${optimizeFailures > 0 ? ` (${optimizeFailures} por falha de conversão WebP)` : ''}`);
  console.log(`📁 Imagens em: ${OUTPUT_IMAGES_DIR}`);
  console.log(`📄 JSON: ${OUTPUT_JSON}`);
  if (unresolvedBooks.size > 0) {
    console.log(`⚠️  Livros bíblicos não reconhecidos (referência pulada, obra mantida):`, [...unresolvedBooks]);
  }

  const skipCounts = skipped.reduce<Record<string, number>>((acc, s) => {
    const key = s.reason.split(':')[0] ?? s.reason;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  console.log('📊 Motivos de exclusão:', skipCounts);
}

main().catch((error) => {
  console.error('❌ Falha na exportação:', error);
  process.exit(1);
});
