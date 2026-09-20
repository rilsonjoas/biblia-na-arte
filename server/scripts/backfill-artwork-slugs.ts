#!/usr/bin/env tsx
/**
 * Backfill único (roadmap "URL amigável", 2026-09-19): preenche `slug`
 * pras obras que já existem no banco e nunca passaram pelo export do
 * vault — hoje só `origem = 'submissao'` (aprovadas via painel), já que
 * `import-seed-data.ts` grava o slug do export pra toda obra de origem
 * 'vault' a cada reseed. Rodar uma vez após a migração que adiciona a
 * coluna; depois disso, `approveSubmission` já gera o slug na hora da
 * aprovação e este script não tem mais nada pra fazer (idempotente —
 * só toca linha com slug IS NULL).
 *
 * Uso: pnpm --filter server exec tsx scripts/backfill-artwork-slugs.ts
 */
import { eq, isNull } from 'drizzle-orm';
import { db, closeDb } from '../src/db/client.js';
import { artworks } from '../src/db/schema.js';
import { slugify } from '../src/lib/vault-parse.js';

async function main() {
  const pending = await db
    .select({ id: artworks.id, title: artworks.title, artistOrDirector: artworks.artistOrDirector })
    .from(artworks)
    .where(isNull(artworks.slug));

  console.log(`▶ ${pending.length} obra(s) sem slug.`);

  for (const artwork of pending) {
    const baseSlug = slugify(`${artwork.artistOrDirector}-${artwork.title}`);
    let slug = baseSlug;
    let suffix = 2;
    for (;;) {
      const [collision] = await db
        .select({ id: artworks.id })
        .from(artworks)
        .where(eq(artworks.slug, slug))
        .limit(1);
      if (!collision) break;
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    await db.update(artworks).set({ slug }).where(eq(artworks.id, artwork.id));
    console.log(`  ✓ ${artwork.id} → ${slug}`);
  }

  console.log('✅ Backfill concluído.');
  await closeDb();
}

main().catch((error) => {
  console.error('❌ Falha no backfill:', error);
  process.exit(1);
});
