import { apiClient, ApiError } from './api-client';
import type { Artwork, BibleBook, Artist, ArtistDetail, Theme, Period, ExploreData } from '@/types';

const ALL_ARTWORKS_LIMIT = 1000;

export interface ArtworksResponse {
  items: Artwork[];
  total: number;
}

export interface PaginatedArtworksParams {
  page?: number;
  limit?: number;
  category?: string;
  /** Multiselect (roadmap 2026-09-01) — nomes exatos, vindos de `/artists`. */
  artists?: string[];
  /** Multiselect de tema (roadmap, Passo 2, 2026-09-02) — slugs de `/themes`. */
  themes?: string[];
  bookSlug?: string;
  chapter?: number;
  verses?: string;
}

export async function getArtworksPaginated(params: PaginatedArtworksParams = {}): Promise<ArtworksResponse> {
  return apiClient.request<ArtworksResponse>('/artworks', {
    page: params.page ?? 1,
    limit: params.limit ?? 24,
    category: params.category,
    artists: params.artists,
    themes: params.themes,
    bookSlug: params.bookSlug,
    chapter: params.chapter,
    verses: params.verses,
  });
}

export async function getArtists(): Promise<Artist[]> {
  return apiClient.request<Artist[]>('/artists');
}

// "Filtros Avançados" (roadmap, Passo 2, 2026-09-02).
export async function getThemes(): Promise<Theme[]> {
  return apiClient.request<Theme[]>('/themes');
}

// Filtro "Período" (achado 2026-09-02: lista de séculos hardcoded no
// front tinha ficado obsoleta — faltavam IV, XII-XIV, XIX, XX e XXI, e
// "século IX" não tinha nenhuma obra). Mesmo padrão de getThemes/getArtists.
export async function getPeriods(): Promise<Period[]> {
  return apiClient.request<Period[]>('/periods');
}

// "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23).
export async function getArtistBySlug(slug: string): Promise<ArtistDetail | undefined> {
  try {
    return await apiClient.request<ArtistDetail>(`/artists/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getArtworks(): Promise<Artwork[]> {
  const { items } = await apiClient.request<ArtworksResponse>('/artworks', { limit: ALL_ARTWORKS_LIMIT });
  return items;
}

export async function getArtworkById(id: string): Promise<Artwork | undefined> {
  try {
    return await apiClient.request<Artwork>(`/artworks/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

/** "Me surpreenda" — obra aleatória do acervo, no estilo do artigo
 *  aleatório da Wikipédia. Escolha no server (`ORDER BY RANDOM()`), não
 *  no cliente — evitar baixar 1000 obras só pra sortear uma no browser. */
export async function getRandomArtwork(): Promise<Artwork> {
  return apiClient.request<Artwork>('/artworks/random');
}

/** "Pintura do Dia" — mesma obra pra todo mundo que visitar no mesmo dia
 *  UTC (sorteio determinístico no server, ver getDailyArtwork em
 *  server/src/db/queries.ts). `date` opcional só existe pra permitir
 *  testar um dia específico; o uso normal não passa nada e o server usa
 *  a data UTC corrente. */
export async function getDailyArtwork(date?: string): Promise<Artwork> {
  return apiClient.request<Artwork>('/artworks/daily', { date });
}

export async function getArtworksByBibleReference(
  bookSlug: string,
  chapterNum?: number,
  verses?: string,
): Promise<Artwork[]> {
  const { items } = await apiClient.request<ArtworksResponse>('/artworks', {
    bookSlug,
    chapter: chapterNum,
    verses,
    limit: ALL_ARTWORKS_LIMIT,
  });
  return items;
}

export async function searchArtworks(query: string): Promise<Artwork[]> {
  if (!query.trim()) return [];
  return apiClient.request<Artwork[]>('/artworks/search', { q: query });
}

export interface SearchFilters {
  category?: string;
  /** Multiselect de livro (achado 2026-09-02, Rilson: "Testamento" sozinho
   *  era raso demais — livro já informa o testamento) — "ou" entre os
   *  livros escolhidos, slugs vindos de `/bible-books`. Substitui o antigo
   *  filtro `testament`. */
  books?: string[];
  /** Multiselect (roadmap 2026-09-01) — "ou" entre os artistas escolhidos. */
  artists?: string[];
  /** Multiselect de tema (roadmap, Passo 3, 2026-09-02) — "ou" entre os temas. */
  themes?: string[];
  yearFrom?: number;
  yearTo?: number;
}

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BiblePassage {
  reference: string;
  translation: string;
  bookSlug: string;
  chapter: number;
  verses: BibleVerse[];
}

export async function getBiblePassage(bookSlug: string, chapter: number): Promise<BiblePassage> {
  return apiClient.request<BiblePassage>(`/bible-text/${bookSlug}/${chapter}`);
}

export function parseYear(value: number | string | undefined | null): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const match = /(\d{3,4})/.exec(String(value ?? ''));
  return match?.[1] ? Number.parseInt(match[1], 10) : null;
}

export async function searchArtworksAdvanced(query: string, filters: SearchFilters = {}): Promise<Artwork[]> {
  let results: Artwork[];

  if (query.trim()) {
    results = await searchArtworks(query);
    if (filters.category) results = results.filter((a) => a.category === filters.category);
    if (filters.artists?.length) {
      // Nomes vêm exatos de `/artists` — comparação de conjunto, não
      // substring (evita, por exemplo, "Rembrandt" casar com um artista
      // hipotético "Rembrandt Bugatti").
      const needles = new Set(filters.artists.map((a) => a.toLowerCase()));
      results = results.filter((a) => needles.has(a.artistOrDirector.toLowerCase()));
    }
    if (filters.themes?.length) {
      // /artworks/search (full-text) não tem filtro de tema embutido — a
      // obra não carrega os próprios temas na resposta (decisão de escopo:
      // não valia expor isso em toda obra só pra cobrir esse cruzamento
      // raro texto+tema). Busca o conjunto de IDs que batem no tema via
      // /artworks?themes=... (já teste server-side) e intersecta por ID.
      const { items: themeMatches } = await apiClient.request<ArtworksResponse>('/artworks', {
        themes: filters.themes,
        limit: ALL_ARTWORKS_LIMIT,
      });
      const matchingIds = new Set(themeMatches.map((a) => a.id));
      results = results.filter((a) => matchingIds.has(a.id));
    }
  } else {
    const { items } = await apiClient.request<ArtworksResponse>('/artworks', {
      category: filters.category,
      artists: filters.artists,
      themes: filters.themes,
      limit: ALL_ARTWORKS_LIMIT,
    });
    results = items;
  }

  if (filters.yearFrom != null || filters.yearTo != null) {
    results = results.filter((artwork) => {
      const year = parseYear(artwork.year);
      if (year === null) return false;
      if (filters.yearFrom != null && year < filters.yearFrom) return false;
      if (filters.yearTo != null && year > filters.yearTo) return false;
      return true;
    });
  }

  if (filters.books?.length) {
    // Mesma mecânica do antigo filtro de testamento (intersecção com
    // `artwork.references`), só que com os livros escolhidos direto —
    // sem precisar buscar a lista de livros do testamento inteiro.
    const bookSlugs = new Set(filters.books);
    results = results.filter((artwork) => artwork.references.some((ref) => bookSlugs.has(ref.bookSlug)));
  }

  return results;
}

export async function getBibleBooks(): Promise<BibleBook[]> {
  return apiClient.request<BibleBook[]>('/bible-books');
}

export async function getBibleBookBySlug(slug: string): Promise<BibleBook | undefined> {
  try {
    return await apiClient.request<BibleBook>(`/bible-books/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function getOldTestamentBooks(): Promise<BibleBook[]> {
  return apiClient.request<BibleBook[]>('/bible-books', { testament: 'old' });
}

export async function getNewTestamentBooks(): Promise<BibleBook[]> {
  return apiClient.request<BibleBook[]>('/bible-books', { testament: 'new' });
}

// "Mapa de obras ↔ referências bíblicas" (/explorar, aprovada 2026-09-02).
// A passagem como hub do grafo. Livro/capítulo inexistente ou capítulo fora
// do intervalo vira 404 na API — mapper devolve undefined no mesmo padrão de
// getBibleBookBySlug/getArtistBySlug, pra página renderizar o estado de
// "não encontrado" em vez de assumir erro de servidor.
export async function getExplore(bookSlug: string, chapter: number): Promise<ExploreData | undefined> {
  try {
    return await apiClient.request<ExploreData>(`/explore/${bookSlug}/${chapter}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}
