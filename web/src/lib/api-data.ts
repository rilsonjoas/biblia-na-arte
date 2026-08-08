import { apiClient, ApiError } from './api-client';
import type { Artwork, BibleBook, Artist } from '@/types';

const ALL_ARTWORKS_LIMIT = 1000;

export interface ArtworksResponse {
  items: Artwork[];
  total: number;
}

export interface PaginatedArtworksParams {
  page?: number;
  limit?: number;
  category?: string;
  artist?: string;
  bookSlug?: string;
  chapter?: number;
  verses?: string;
}

export async function getArtworksPaginated(params: PaginatedArtworksParams = {}): Promise<ArtworksResponse> {
  return apiClient.request<ArtworksResponse>('/artworks', {
    page: params.page ?? 1,
    limit: params.limit ?? 24,
    category: params.category,
    artist: params.artist,
    bookSlug: params.bookSlug,
    chapter: params.chapter,
    verses: params.verses,
  });
}

export async function getArtists(): Promise<Artist[]> {
  return apiClient.request<Artist[]>('/artists');
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

export async function getArtworksByCategory(category: string): Promise<Artwork[]> {
  const { items } = await apiClient.request<ArtworksResponse>('/artworks', {
    category,
    limit: ALL_ARTWORKS_LIMIT,
  });
  return items;
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
  testament?: 'old' | 'new';
  artist?: string;
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

export async function searchArtworksAdvanced(query: string, filters: SearchFilters = {}): Promise<Artwork[]> {
  let results: Artwork[];

  if (query.trim()) {
    results = await searchArtworks(query);
    if (filters.category) results = results.filter((a) => a.category === filters.category);
    if (filters.artist) {
      const needle = filters.artist.toLowerCase();
      results = results.filter((a) => a.artistOrDirector.toLowerCase().includes(needle));
    }
  } else {
    const { items } = await apiClient.request<ArtworksResponse>('/artworks', {
      category: filters.category,
      artist: filters.artist,
      limit: ALL_ARTWORKS_LIMIT,
    });
    results = items;
  }

  if (filters.testament) {
    const testamentBooks = await (filters.testament === 'old' ? getOldTestamentBooks() : getNewTestamentBooks());
    const testamentSlugs = new Set(testamentBooks.map((book) => book.slug));
    results = results.filter((artwork) => artwork.references.some((ref) => testamentSlugs.has(ref.bookSlug)));
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
