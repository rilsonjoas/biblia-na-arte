/**
 * Contrato de parâmetros de URL da busca avançada (/busca).
 *
 * Cluster "A Biblioteca", 2026-09-22: o `/explorar` já gerava
 * `/busca?themes=<slug>` mas a página ignorava o parâmetro (caía numa
 * busca sem filtro). Este arquivo define o único formato suportado e a
 * tradução dele pros filtros do `SearchFilters`:
 *
 *   /busca?themes=criacao            → filtro de tema, semântica "ou" (1 tema)
 *   /busca?themes=criacao,perdao     → filtro "ou" (vários temas, separados por vírgula)
 *   /busca?bookSlug=genesis          → filtro de livro (obra inteira)
 *   /busca?q=adoração                 → busca por texto (comportamento de sempre)
 *
 * Galeria com precisão de passagem (capítulo) NÃO é domínio do /busca:
 * quem quer "todas as obras de Gênesis 1" usa /biblia/genesis/1 ou
 * /explorar/genesis/1 (rotas existentes, indexáveis e mais ricas). O
 * filtro de livro da busca é do livro inteiro — aceitar `chapter` aqui
 * só criaria uma segunda galeria de passagem competindo com a existente.
 */
export function parseThemesParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean);
}

export function parseBookSlugParam(value: string | null | undefined): string | undefined {
  const slug = value?.trim();
  return slug || undefined;
}