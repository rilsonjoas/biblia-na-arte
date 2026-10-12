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
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { TransactionRollbackError, and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { db, closeDb } from '../src/db/client.js';
import { artists, artworks, artworkThemes, bibleBooks, bibleReferences, themes } from '../src/db/schema.js';
import { bibleBooksSeed } from '../src/db/seed-data/bible-books.js';
import { listActiveVaultSlugs, remapDailyHistory, replaceArtworkRedirects } from '../src/db/seed-redirects.js';
import { artworkIdFromSlug } from '../src/lib/deterministic-uuid.js';
import {
  findUnexplainedRemovals,
  flattenRedirects,
  formatProblems,
  parseRedirectConfig,
  validateRedirects,
} from '../src/lib/slug-redirects.js';

const EXPORT_JSON = path.resolve(import.meta.dirname, 'vault-export.json');
// ADR 007: slug que mudou -> slug atual, e obras de propósito fora do site.
const REDIRECTS_JSON = path.resolve(import.meta.dirname, 'slug-redirects.json');
const REMOVED_JSON = path.resolve(import.meta.dirname, 'removed-slugs.json');

/** DRY_RUN=1 faz o reseed inteiro dentro da transação, imprime o relatório e dá
 *  rollback: nada é gravado. É o jeito de ver o que um reseed faria em produção. */
const DRY_RUN = process.env.DRY_RUN === '1';

function readOptionalJson(file: string): unknown {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : undefined;
}

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
  period?: string;
  tradition?: string;
  technique?: string;
  country?: string;
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

  console.log(`▶ ${exported.length} obras no export, ${DRY_RUN ? 'ENSAIO (DRY_RUN, nada será gravado)' : 'importando'}...`);

  // Redirecionamentos (ADR 007): valida ANTES de abrir a transação. Mapa torto,
  // ciclo, destino fora do export ou slug vivo sombreado param o reseed aqui.
  const config = parseRedirectConfig(readOptionalJson(REDIRECTS_JSON), readOptionalJson(REMOVED_JSON));
  const { flat: redirects, problems: flattenProblems } = flattenRedirects(config.redirects);
  const exportSlugs = new Set(exported.map((item) => item.slug));
  const removedSlugs = new Set(config.removed);
  const configProblems = [
    ...config.problems,
    ...flattenProblems,
    ...validateRedirects(redirects, { exportSlugs, removedSlugs }),
  ];
  if (configProblems.length > 0) {
    throw new Error(`Configuração de redirecionamento inválida (${configProblems.length}):\n${formatProblems(configProblems)}`);
  }
  console.log(`▶ ${Object.keys(redirects).length} redirecionamento(s) e ${removedSlugs.size} remoção(ões) declarada(s).`);

  // O DRY_RUN termina a transação com tx.rollback(), que lança TransactionRollbackError:
  // aqui isso vira `rolledBack = true`; qualquer outro erro continua subindo.
  const rolledBack = await db.transaction(async (tx) => {
    // Trava de "sumiço sem explicação" (ADR 007): obra ATIVA no banco que não está
    // no export, sem redirecionamento nem remoção declarada, sumiria do site em
    // silêncio (404 pra quem tem o link). Para antes de qualquer escrita.
    const activeDbSlugs = await listActiveVaultSlugs(tx);
    const unexplained = findUnexplainedRemovals({
      activeDbSlugs,
      exportSlugs,
      redirectSources: new Set(Object.keys(redirects)),
      removedSlugs,
    });
    if (unexplained.length > 0) {
      throw new Error(
        `${unexplained.length} obra(s) ativa(s) sumiriam do site sem explicação:\n` +
          unexplained.map((slug) => `  - ${slug}`).join('\n') +
          '\nSe o slug mudou, acrescente em server/scripts/slug-redirects.json ("antigo": "novo"). ' +
          'Se a remoção é de propósito (ex.: direitos autorais), acrescente em server/scripts/removed-slugs.json.',
      );
    }
    const existingVaultSlugs = new Set(
      (await tx.select({ slug: artworks.slug }).from(artworks).where(eq(artworks.origem, 'vault'))).map((row) => row.slug),
    );

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

    // Só remove obras de origem 'vault' — uma obra aprovada via painel
    // de submissão (origem 'submissao') nunca existiu no vault pra
    // "sair" dele, e não pode ser apagada por um reseed (ver ROADMAP,
    // "Submissão de artistas + painel administrativo").
    //
    // O DELETE das obras que saíram agora roda DEPOIS do upsert (ADR 007: o
    // histórico de daily_artwork precisa ser remapeado antes, porque a FK tem ON
    // DELETE CASCADE). Mas uma linha antiga cujo id não bate com o do próprio slug
    // (legado) bateria no UNIQUE do slug quando a obra nova fosse gravada; então
    // essas, e só elas, continuam saindo ANTES do upsert, como sempre foi.
    const conflictingLegacy = await tx
      .delete(artworks)
      .where(
        and(
          notInArray(artworks.id, validIds),
          eq(artworks.origem, 'vault'),
          inArray(artworks.slug, [...exportSlugs]),
        ),
      )
      .returning({ slug: artworks.slug });
    if (conflictingLegacy.length > 0) {
      console.log(`▶ ${conflictingLegacy.length} linha(s) legada(s) com ID fora do padrão removida(s) antes do upsert.`);
    }

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
        slug: item.slug,
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
        period: item.period,
        tradition: item.tradition,
        technique: item.technique,
        country: item.country,
        sourceUrl: item.sourceUrl,
        classicCommentaryAuthor: item.classicCommentaryAuthor,
        classicCommentary: item.classicCommentary,
        origem: 'vault' as const,
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

    // ADR 007: histórico da Pintura do Dia das obras renomeadas passa pro ID novo ANTES
    // do DELETE (a FK tem ON DELETE CASCADE e levaria o histórico junto).
    console.log('▶ Remapeando o histórico da Pintura do Dia das obras renomeadas...');
    const remappedHistory = await remapDailyHistory(tx, redirects);

    console.log('▶ Removendo obras que saíram do vault...');
    const removedRows = await tx
      .delete(artworks)
      .where(and(notInArray(artworks.id, validIds), eq(artworks.origem, 'vault')))
      .returning({ slug: artworks.slug, active: artworks.active });

    const redirectRows = await replaceArtworkRedirects(tx, redirects);

    const newSlugs = [...exportSlugs].filter((slug) => !existingVaultSlugs.has(slug));
    const removedActive = removedRows.filter((row) => row.active).map((row) => row.slug);
    console.log('▶ Relatório do reseed:');
    console.log(`    obras novas ................ ${newSlugs.length}`);
    console.log(`    obras removidas (ativas) ... ${removedActive.length}${removedActive.length ? `  ${removedActive.slice(0, 5).join(', ')}` : ''}`);
    console.log(`    obras removidas (inativas) . ${removedRows.length - removedActive.length}`);
    console.log(`    histórico remapeado ........ ${remappedHistory} linha(s) de daily_artwork`);
    console.log(`    redirecionamentos gravados . ${redirectRows}`);

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

    if (DRY_RUN) tx.rollback();
  }).then(
    () => false,
    (error: unknown) => {
      if (error instanceof TransactionRollbackError) return true;
      throw error;
    },
  );

  if (rolledBack) {
    console.log('🧪 DRY_RUN: tudo foi feito dentro de uma transação e DESFEITO. Nada foi gravado.');
    await closeDb();
    return;
  }

  console.log(
    `✅ Importação concluída: ${exported.length} obras, ${exportedArtists.length} artistas, ${exportedThemes.length} temas.`,
  );
  await closeDb();
}

main().catch((error) => {
  console.error('❌ Falha na importação:', error);
  process.exit(1);
});
