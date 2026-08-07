import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getArtworks,
  getArtworkById,
  getArtworksByCategory,
  getArtworksByBibleReference,
  searchArtworks,
  searchArtworksAdvanced,
  getArtworkStats,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  type SearchFilters,
} from '@/lib/supabase-data'
import type { Artwork } from '@/types'

// Query keys for React Query
export const artworkKeys = {
  all: ['artworks'] as const,
  lists: () => [...artworkKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...artworkKeys.lists(), filters] as const,
  details: () => [...artworkKeys.all, 'detail'] as const,
  detail: (id: string) => [...artworkKeys.details(), id] as const,
  search: () => [...artworkKeys.all, 'search'] as const,
  searchQuery: (query: string, filters?: SearchFilters) => 
    [...artworkKeys.search(), query, filters] as const,
  stats: () => [...artworkKeys.all, 'stats'] as const,
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

// Alias for admin dashboard
export const useAllArtworks = useArtworks;

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

// Hook for searching artworks
export function useArtworkSearch(query: string) {
  return useQuery({
    queryKey: artworkKeys.searchQuery(query),
    queryFn: () => searchArtworks(query),
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
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

// Hook for artwork statistics
export function useArtworkStats() {
  return useQuery({
    queryKey: artworkKeys.stats(),
    queryFn: getArtworkStats,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
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

// Hook for infinite scroll artworks (for future use)
export function useInfiniteArtworks(pageSize = 12) {
  return useInfiniteQuery({
    queryKey: [...artworkKeys.lists(), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const allArtworks = await getArtworks()
      const start = pageParam * pageSize
      const end = start + pageSize
      
      return {
        artworks: allArtworks.slice(start, end),
        nextPage: end < allArtworks.length ? pageParam + 1 : undefined,
        hasMore: end < allArtworks.length,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for recent artworks
export function useRecentArtworks(limit = 4) {
  return useQuery({
    queryKey: artworkKeys.list({ recent: true, limit }),
    queryFn: async () => {
      const artworks = await getArtworks()
      return artworks.slice(0, limit)
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  })
}

// Hook for random artworks
export function useRandomArtworks(count = 3) {
  return useQuery({
    queryKey: artworkKeys.list({ random: true, count }),
    queryFn: async () => {
      const artworks = await getArtworks()
      const shuffled = [...artworks].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, count)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for checking if data is loading across multiple queries
export function useArtworksLoading() {
  const artworks = useArtworks()
  
  return {
    isLoading: artworks.isLoading,
    isError: artworks.isError,
    error: artworks.error,
  }
}

// Hook for updating an artwork
export function useUpdateArtwork() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateArtwork,
    onSuccess: (_, artwork) => {
      // Invalidate and refetch artwork queries
      queryClient.invalidateQueries({ queryKey: artworkKeys.all })
      console.log(`Artwork ${artwork.id} updated and cache invalidated`)
    },
    onError: (error, artwork) => {
      console.error(`Failed to update artwork ${artwork.id}:`, error)
    },
  })
}

// Hook for creating an artwork
export function useCreateArtwork() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createArtwork,
    onSuccess: (newArtwork) => {
      // Invalidate and refetch artwork queries
      queryClient.invalidateQueries({ queryKey: artworkKeys.all })
      console.log(`Artwork ${newArtwork.id} created and cache invalidated`)
    },
    onError: (error, artwork) => {
      console.error(`Failed to create artwork "${artwork.title}":`, error)
    },
  })
}

// Hook for deleting an artwork
export function useDeleteArtwork() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteArtwork,
    onSuccess: (_, artworkId) => {
      // Invalidate and refetch artwork queries
      queryClient.invalidateQueries({ queryKey: artworkKeys.all })
      console.log(`Artwork ${artworkId} deleted and cache invalidated`)
    },
    onError: (error, artworkId) => {
      console.error(`Failed to delete artwork ${artworkId}:`, error)
    },
  })
}