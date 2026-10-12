import { and, eq, isNotNull, sql } from 'drizzle-orm';
import type { db } from './client.js';
import { artworkRedirects, artworks, dailyArtwork } from './schema.js';
import { artworkIdFromSlug } from '../lib/deterministic-uuid.js';

/** O que o reseed passa: o próprio `db` ou o `tx` de `db.transaction()` (o
 *  DRY_RUN depende de tudo isto funcionar dentro de uma transação que depois
 *  dá rollback). */
export type SeedExecutor = Pick<typeof db, 'select' | 'insert' | 'update' | 'delete' | 'execute'>;

/** Slugs das obras ATIVAS de origem `vault`: as únicas que o reseed pode apagar
 *  e que têm URL pública. Obra inativa não entra (apagá-la não quebra link) e
 *  obra de `submissao` nunca é apagada pelo reseed. */
export async function listActiveVaultSlugs(tx: SeedExecutor): Promise<string[]> {
  const rows = await tx
    .select({ slug: artworks.slug })
    .from(artworks)
    .where(and(eq(artworks.active, true), eq(artworks.origem, 'vault'), isNotNull(artworks.slug)));
  return rows.map((row) => row.slug).filter((slug): slug is string => slug !== null);
}

/** Aponta o histórico da "Pintura do Dia" (`daily_artwork`) do ID da obra antiga
 *  pro ID da obra nova. Tem que rodar DEPOIS de a obra nova ser gravada e ANTES do
 *  `DELETE` das obras que saíram do vault: `daily_artwork.artwork_id` tem ON
 *  DELETE CASCADE e, sem isto, o histórico da obra renomeada some junto (e a obra
 *  volta com ID novo, fora da janela de não-repetição). Só remapeia se a obra nova
 *  já existe no banco, senão violaria a chave estrangeira. Devolve quantas linhas
 *  mudaram. */
export async function remapDailyHistory(tx: SeedExecutor, flat: Readonly<Record<string, string>>): Promise<number> {
  let total = 0;
  for (const [oldSlug, newSlug] of Object.entries(flat)) {
    const oldId = artworkIdFromSlug(oldSlug);
    const newId = artworkIdFromSlug(newSlug);
    const rows = await tx
      .update(dailyArtwork)
      .set({ artworkId: newId })
      .where(
        and(
          eq(dailyArtwork.artworkId, oldId),
          sql`exists (select 1 from ${artworks} where ${artworks.id} = ${newId})`,
        ),
      )
      .returning({ date: dailyArtwork.date });
    total += rows.length;
  }
  return total;
}

/** Troca o conteúdo de `artwork_redirects` pelo mapa (já achatado e validado):
 *  idempotente, rodar de novo dá o mesmo resultado. `old_id` é o UUID que a obra
 *  tinha com o slug antigo (UUID v5 do slug), o que permite resolver link antigo
 *  por UUID. Devolve quantas linhas ficaram. */
export async function replaceArtworkRedirects(tx: SeedExecutor, flat: Readonly<Record<string, string>>): Promise<number> {
  await tx.delete(artworkRedirects);
  const rows = Object.entries(flat).map(([oldSlug, newSlug]) => ({
    oldSlug,
    oldId: artworkIdFromSlug(oldSlug),
    newSlug,
  }));
  if (rows.length > 0) await tx.insert(artworkRedirects).values(rows);
  return rows.length;
}
