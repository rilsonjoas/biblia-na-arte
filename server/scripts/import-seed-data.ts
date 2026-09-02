#!/usr/bin/env tsx
/**
 * Lê o JSON gerado por export-vault-data.ts (rodado no desktop, onde o
 * vault mora) e popula o Postgres. Roda perto do banco — no VPS, dentro
 * de um container na proxy-network, já que o Postgres não expõe porta
 * (ver hetzner-infra/MIGRATION.md, Fase 4.3).
 *
 * Idempotente por reset: trunca as 3 tabelas e reimporta do zero — é o
 * comportamento certo pra um catálogo curado (a fonte da verdade é o
 * vault + export, não o banco), não um sistema com dado gerado em runtime.
 *
 * Uso: pnpm --filter server db:seed
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { db, closeDb } from '../src/db/client.js';
import { artists, artworks, artworkThemes, bibleBooks, bibleReferences, themes } from '../src/db/schema.js';
import { bibleBooksSeed } from '../src/db/seed-data/bible-books.js';

const EXPORT_JSON = path.resolve(import.meta.dirname, 'vault-export.json');

interface ExportedArtwork {
  slug: string;
  title: string;
  subtitle?: string;
  artistOrDirector: string;
  year?: string;
  category: 'painting';
  description: string;
  imageFile: string;
  licenseType: string;
  attributionText?: string;
  location?: string;
  sourceUrl?: string;
  classicCommentaryAuthor?: string;
  classicCommentary?: string;
  references: { book: string; bookSlug: string; chapter: number; verses?: string; passageText?: string }[];
  themes?: string[];
}

interface ExportedArtist {
  name: string;
  slug: string;
  bio: string | null;
}

interface ExportedTheme {
  slug: string;
  name: string;
}

async function main() {
  const raw = readFileSync(EXPORT_JSON, 'utf-8');
  const {
    artworks: exported,
    artists: exportedArtists = [],
    themes: exportedThemes = [],
  } = JSON.parse(raw) as {
    artworks: ExportedArtwork[];
    artists?: ExportedArtist[];
    themes?: ExportedTheme[];
  };

  console.log(`▶ ${exported.length} obras no export, importando...`);

  await db.transaction(async (tx) => {
    // TRUNCATE ... RESTART IDENTITY CASCADE limpa as tabelas de uma vez
    // (bible_references e artwork_themes têm FK pra artworks; CASCADE
    // cobre a ordem). `artists`/`themes` não têm FK com artworks (artists
    // casa por nome; themes é referenciado por slug em artwork_themes, não
    // o contrário), mas entram no mesmo TRUNCATE pela mesma filosofia de
    // idempotência: fonte da verdade é o vault, não o banco.
    await tx.execute(
      sql`TRUNCATE TABLE ${bibleReferences}, ${artworkThemes}, ${artworks}, ${bibleBooks}, ${artists}, ${themes} RESTART IDENTITY CASCADE`,
    );

    console.log('▶ Semeando bible_books (66 livros)...');
    await tx.insert(bibleBooks).values(
      bibleBooksSeed.map((b) => ({
        name: b.name,
        slug: b.slug,
        chapters: b.chapters,
        testament: b.testament,
        order: b.order,
      })),
    );

    if (exportedThemes.length > 0) {
      console.log(`▶ Semeando themes (${exportedThemes.length})...`);
      // Precisa vir ANTES do loop de obras — artwork_themes referencia
      // themes.slug por FK, e o loop abaixo já insere artwork_themes junto
      // com cada obra.
      await tx.insert(themes).values(exportedThemes.map((t) => ({ slug: t.slug, name: t.name })));
    }

    console.log('▶ Inserindo obras + referências...');
    for (const item of exported) {
      const [inserted] = await tx
        .insert(artworks)
        .values({
          title: item.title,
          subtitle: item.subtitle,
          artistOrDirector: item.artistOrDirector,
          year: item.year,
          category: item.category,
          description: item.description,
          imageUrl: `/images/${item.imageFile}`,
          licenseType: item.licenseType,
          attributionText: item.attributionText,
          location: item.location,
          sourceUrl: item.sourceUrl,
          classicCommentaryAuthor: item.classicCommentaryAuthor,
          classicCommentary: item.classicCommentary,
        })
        .returning({ id: artworks.id });

      if (item.references.length > 0 && inserted) {
        await tx.insert(bibleReferences).values(
          item.references.map((ref) => ({
            artworkId: inserted.id,
            book: ref.book,
            bookSlug: ref.bookSlug,
            chapter: ref.chapter,
            verses: ref.verses,
            passageText: ref.passageText,
          })),
        );
      }

      if (item.themes && item.themes.length > 0 && inserted) {
        await tx.insert(artworkThemes).values(
          item.themes.map((slug) => ({ artworkId: inserted.id, themeSlug: slug })),
        );
      }
    }
    if (exportedArtists.length > 0) {
      console.log(`▶ Semeando artists (${exportedArtists.length})...`);
      await tx.insert(artists).values(
        exportedArtists.map((a) => ({
          name: a.name,
          slug: a.slug,
          bio: a.bio,
        })),
      );
    }
  });

  console.log(
    `✅ Importação concluída: ${exported.length} obras, ${exportedArtists.length} artistas, ${exportedThemes.length} temas.`,
  );
  await closeDb();
}

main().catch((error) => {
  console.error('❌ Falha na importação:', error);
  process.exit(1);
});
