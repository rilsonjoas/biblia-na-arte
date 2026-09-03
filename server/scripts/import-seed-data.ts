#!/usr/bin/env tsx
/**
 * Lê o JSON gerado por export-vault-data.ts (rodado no desktop, onde o
 * vault mora) e popula o Postgres. Roda perto do banco — no VPS, dentro
 * de um container na proxy-network, já que o Postgres não expõe porta
 * (ver hetzner-infra/MIGRATION.md, Fase 4.3).
 *
 * Idempotente por reset — MAS não é mais TRUNCATE cego em tudo (ver
 * ROADMAP "ID de obra muda a cada reseed" e "Débito de arquitetura
 * relacionado", 2026-09-03): `bible_books`/`artists`/`themes` continuam
 * truncados e reimportados do zero (sem identidade externa que valha
 * preservar), mas `artworks` agora faz UPSERT por ID determinístico
 * (`artworkIdFromSlug`) + DELETE explícito só de quem saiu do vault.
 * Preserva `createdAt` real (vem do export, baseado no `birthtime` da
 * nota) e nunca mais quebra link `/obra/:id` a cada curadoria nova.
 * `bible_references`/`artwork_themes` (sem identidade própria) seguem
 * limpos e recriados por obra — mesma simplicidade de antes, só que
 * escopados, não um TRUNCATE cego na tabela inteira.
 *
 * Uso: pnpm --filter server db:seed
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { inArray, notInArray, sql } from 'drizzle-orm';
import { db, closeDb } from '../src/db/client.js';
import { artists, artworks, artworkThemes, bibleBooks, bibleReferences, themes } from '../src/db/schema.js';
import { bibleBooksSeed } from '../src/db/seed-data/bible-books.js';
import { artworkIdFromSlug } from '../src/lib/deterministic-uuid.js';

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
  createdAt: string;
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
    // bible_books/artists/themes não têm identidade externa que valha
    // preservar (nenhuma tem link público nem timestamp que importe) —
    // seguem truncados e recriados do zero, mesma simplicidade de
    // sempre. TRUNCATE themes CASCADE esvazia artwork_themes junto (FK
    // themes.slug) — de propósito, essa tabela também não tem
    // identidade própria, recriar do zero por obra é seguro.
    await tx.execute(sql`TRUNCATE TABLE ${bibleBooks} RESTART IDENTITY CASCADE`);
    await tx.execute(sql`TRUNCATE TABLE ${artists} RESTART IDENTITY CASCADE`);
    await tx.execute(sql`TRUNCATE TABLE ${themes} CASCADE`);

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
      await tx.insert(themes).values(exportedThemes.map((t) => ({ slug: t.slug, name: t.name })));
    }

    // artworks: upsert por ID determinístico, não truncate — preserva
    // createdAt e qualquer link/tabela futura que dependa do ID
    // continuar o mesmo entre reseeds (ver ROADMAP).
    const validIds = exported.map((item) => artworkIdFromSlug(item.slug));

    console.log('▶ Removendo obras que saíram do vault...');
    await tx.delete(artworks).where(notInArray(artworks.id, validIds));

    // bible_references não tem identidade própria (nada externo linka
    // pra uma referência individual) — mais simples limpar tudo dos
    // sobreviventes e reinserir fresco por obra do que tentar diff.
    if (validIds.length > 0) {
      await tx.delete(bibleReferences).where(inArray(bibleReferences.artworkId, validIds));
    }

    console.log('▶ Upsert de obras + referências...');
    for (const item of exported) {
      const id = artworkIdFromSlug(item.slug);
      const values = {
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
        createdAt: new Date(item.createdAt),
      };

      await tx
        .insert(artworks)
        .values({ id, ...values })
        .onConflictDoUpdate({ target: artworks.id, set: values });

      if (item.references.length > 0) {
        await tx.insert(bibleReferences).values(
          item.references.map((ref) => ({
            artworkId: id,
            book: ref.book,
            bookSlug: ref.bookSlug,
            chapter: ref.chapter,
            verses: ref.verses,
            passageText: ref.passageText,
          })),
        );
      }

      if (item.themes && item.themes.length > 0) {
        await tx.insert(artworkThemes).values(item.themes.map((slug) => ({ artworkId: id, themeSlug: slug })));
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
