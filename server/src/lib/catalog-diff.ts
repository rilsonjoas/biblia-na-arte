/** Comparação entre o catálogo exportado antes e depois (vault-export.json). Puro: sem
 *  disco, sem banco. Usado por `scripts/catalog-diff.ts`, que o `publicar-catalogo.sh`
 *  chama para dizer o que vai mudar antes de abrir o PR de dados. */

export interface CatalogArtwork {
  slug: string;
  title: string;
  createdAt: string;
}

const IGNORADOS_NA_COMPARACAO = new Set(['id', 'createdAt']);

function comparavel(a: CatalogArtwork): string {
  const campos = a as unknown as Record<string, unknown>;
  const keys = Object.keys(campos).filter((k) => !IGNORADOS_NA_COMPARACAO.has(k)).sort();
  return JSON.stringify(keys.map((k) => [k, campos[k]]));
}

export function diffCatalog(prev: readonly CatalogArtwork[], next: readonly CatalogArtwork[]) {
  const prevBySlug = new Map(prev.map((a) => [a.slug, a]));
  const nextBySlug = new Map(next.map((a) => [a.slug, a]));
  return {
    added: next.filter((a) => !prevBySlug.has(a.slug)),
    removed: prev.filter((a) => !nextBySlug.has(a.slug)),
    changed: next
      .filter((a) => {
        const p = prevBySlug.get(a.slug);
        return p !== undefined && comparavel(p) !== comparavel(a);
      })
      .map((a) => a.slug),
  };
}

/** O exportador lê `createdAt` da data de criação do ARQUIVO da nota, que muda quando o
 *  arquivo é regravado ou o vault é clonado de novo. Sem isso, cada export reembaralharia
 *  "Mais Recentes". Obra que já existia mantém a data de antes (inclusive a renomeada,
 *  achada pelo mapa de redirecionamento antigo → novo); só obra nova usa a data do arquivo. */
export function preserveCreatedAt<T extends CatalogArtwork>(
  next: readonly T[],
  prev: readonly CatalogArtwork[],
  redirects: Readonly<Record<string, string>>,
): T[] {
  const dateBySlug = new Map(prev.map((a) => [a.slug, a.createdAt]));
  const oldSlugOf = new Map(Object.entries(redirects).map(([from, to]) => [to, from]));
  return next.map((a) => {
    const old = dateBySlug.get(a.slug) ?? dateBySlug.get(oldSlugOf.get(a.slug) ?? '');
    return old ? { ...a, createdAt: old } : { ...a };
  });
}

/** Para cada obra que SUMIU, procura uma obra NOVA com o mesmo título (a mesma obra com o
 *  endereço mudado). Só sugere quando o par é único dos dois lados; título repetido é
 *  ambíguo e fica para decisão humana. Quem já tem redirecionamento ou remoção declarada
 *  fica de fora. É sugestão: quem aprova é a pessoa que lê o PR (atenção a autoria
 *  corrigida, ex.: Jan → Pieter Bruegel). */
export function suggestRedirects(
  removed: readonly CatalogArtwork[],
  added: readonly CatalogArtwork[],
  existingRedirects: Readonly<Record<string, string>>,
  removedSlugs: ReadonlySet<string>,
): { pairs: Record<string, string>; unmatched: string[]; ambiguous: string[] } {
  const pending = removed.filter((r) => !(r.slug in existingRedirects) && !removedSlugs.has(r.slug));
  const count = (list: readonly CatalogArtwork[]) => {
    const m = new Map<string, CatalogArtwork[]>();
    for (const a of list) m.set(a.title, [...(m.get(a.title) ?? []), a]);
    return m;
  };
  const removedByTitle = count(pending);
  const addedByTitle = count(added);
  const pairs: Record<string, string> = {};
  const unmatched: string[] = [];
  const ambiguous: string[] = [];
  for (const r of pending) {
    const sameRemoved = removedByTitle.get(r.title) ?? [];
    const sameAdded = addedByTitle.get(r.title) ?? [];
    if (sameAdded.length === 0) unmatched.push(r.slug);
    else if (sameRemoved.length === 1 && sameAdded.length === 1) pairs[r.slug] = sameAdded[0]!.slug;
    else ambiguous.push(r.slug);
  }
  return { pairs, unmatched, ambiguous };
}

/** Tira do sitemap as URLs `/obra/<slug>` dos slugs dados (obras que mudaram de endereço
 *  ou saíram de propósito). O gerador faz UNIÃO com o sitemap anterior de propósito (nunca
 *  derrubar URL por export parcial); estes são os casos em que a queda é intencional. */
export function dropSitemapSlugs(locs: readonly string[], slugs: ReadonlySet<string>): string[] {
  return locs.filter((loc) => {
    const m = loc.match(/\/obra\/([^/?#]+)$/);
    return !(m && slugs.has(m[1]!));
  });
}

/** Dois exports têm o mesmo conteúdo? Ignora `exportedAt`, que muda a cada execução e faria
 *  todo export parecer uma mudança. */
interface CatalogContent {
  artworks: unknown;
  artists: unknown;
  themes: unknown;
  exportedAt?: unknown;
}
export function catalogContentEquals(a: CatalogContent, b: CatalogContent): boolean {
  const pick = (x: CatalogContent) => JSON.stringify([x.artworks, x.artists, x.themes]);
  return pick(a) === pick(b);
}
