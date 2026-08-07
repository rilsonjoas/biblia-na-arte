import { useQuery } from '@tanstack/react-query'
import {
  getArtworks,
  getArtworkById,
  getArtworksByCategory,
  getArtworksByBibleReference,
  searchArtworksAdvanced,
  type SearchFilters,
} from '@/lib/api-data'

// Query keys for React Query
export const artworkKeys = {
  all: ['artworks'] as const,
  lists: () => [...artworkKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...artworkKeys.lists(), filters] as const,
  details: () => [...artworkKeys.all, 'detail'] as const,
  detail: (id: string) => [...artworkKeys.details(), id] as const,
  search: () => [...artworkKeys.all, 'search'] as const,
  searchQuery: (query: string, filters?: SearchFilters) =>
    [...artworkKeys.search(), query, filters] as const,
}

// Hook for fetching all artworks
export function useArtworks() {
  return useQuery({
    queryKey: artworkKeys.lists(),
    queryFn: getArtworks,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching a single artwork by ID
export function useArtwork(id: string | undefined) {
  return useQuery({
    queryKey: artworkKeys.detail(id || ''),
    queryFn: () => getArtworkById(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Hook for fetching artworks by category
export function useArtworksByCategory(category: string | undefined) {
  return useQuery({
    queryKey: artworkKeys.list({ category }),
    queryFn: () => getArtworksByCategory(category!),
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching artworks by bible reference
export function useArtworksByBibleReference(
  bookSlug: string | undefined,
  chapter?: number,
  verses?: string
) {
  return useQuery({
    queryKey: artworkKeys.list({ bookSlug, chapter, verses }),
    queryFn: () => getArtworksByBibleReference(bookSlug!, chapter, verses),
    enabled: !!bookSlug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Hook for advanced artwork search with filters
export function useArtworkSearchAdvanced(query: string, filters: SearchFilters = {}) {
  return useQuery({
    queryKey: artworkKeys.searchQuery(query, filters),
    queryFn: () => searchArtworksAdvanced(query, filters),
    enabled: query.trim().length > 0 || Object.keys(filters).length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for featured artworks (first 6)
export function useFeaturedArtworks() {
  return useQuery({
    queryKey: artworkKeys.list({ featured: true }),
    queryFn: async () => {
      const artworks = await getArtworks()
      return artworks.slice(0, 6)
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}
