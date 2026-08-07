import { useQuery } from '@tanstack/react-query'
import { getBibleBooks, getBibleBookBySlug, getOldTestamentBooks, getNewTestamentBooks } from '@/lib/api-data'

// Query keys for React Query
export const bibleBookKeys = {
  all: ['bibleBooks'] as const,
  lists: () => [...bibleBookKeys.all, 'list'] as const,
  details: () => [...bibleBookKeys.all, 'detail'] as const,
  detail: (slug: string) => [...bibleBookKeys.details(), slug] as const,
}

// Hook for fetching all bible books
export function useBibleBooks() {
  return useQuery({
    queryKey: bibleBookKeys.lists(),
    queryFn: getBibleBooks,
    staleTime: 30 * 60 * 1000, // 30 minutes - bible books rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Hook for fetching a single bible book by slug
export function useBibleBookBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: bibleBookKeys.detail(slug || ''),
    queryFn: () => getBibleBookBySlug(slug!),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}

// Hook for fetching Old Testament books
export function useOldTestamentBooks() {
  return useQuery({
    queryKey: [...bibleBookKeys.lists(), { testament: 'old' }],
    queryFn: getOldTestamentBooks,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Hook for fetching New Testament books
export function useNewTestamentBooks() {
  return useQuery({
    queryKey: [...bibleBookKeys.lists(), { testament: 'new' }],
    queryFn: getNewTestamentBooks,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}
