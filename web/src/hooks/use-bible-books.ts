import { useQuery } from '@tanstack/react-query'
import {
  getBibleBooks,
  getBibleBookBySlug,
  getOldTestamentBooks,
  getNewTestamentBooks,
} from '@/lib/supabase-data'

// Query keys for React Query
export const bibleBookKeys = {
  all: ['bibleBooks'] as const,
  lists: () => [...bibleBookKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...bibleBookKeys.lists(), filters] as const,
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
export function useBibleBook(slug: string | undefined) {
  return useQuery({
    queryKey: bibleBookKeys.detail(slug || ''),
    queryFn: () => getBibleBookBySlug(slug!),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}

// Alias for consistency
export const useBibleBookBySlug = useBibleBook

// Hook for fetching Old Testament books
export function useOldTestamentBooks() {
  return useQuery({
    queryKey: bibleBookKeys.list({ testament: 'old' }),
    queryFn: getOldTestamentBooks,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Hook for fetching New Testament books
export function useNewTestamentBooks() {
  return useQuery({
    queryKey: bibleBookKeys.list({ testament: 'new' }),
    queryFn: getNewTestamentBooks,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Hook for fetching books by testament (dynamic)
export function useBibleBooksByTestament(testament: 'old' | 'new' | undefined) {
  return useQuery({
    queryKey: bibleBookKeys.list({ testament }),
    queryFn: () => {
      if (testament === 'old') return getOldTestamentBooks()
      if (testament === 'new') return getNewTestamentBooks()
      return getBibleBooks()
    },
    enabled: !!testament,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Hook for bible book statistics
export function useBibleBookStats() {
  const { data: books } = useBibleBooks()
  
  return useQuery({
    queryKey: [...bibleBookKeys.all, 'stats'],
    queryFn: () => {
      if (!books) return null
      
      const oldTestament = books.filter(book => book.testament === 'old')
      const newTestament = books.filter(book => book.testament === 'new')
      
      return {
        total: books.length,
        oldTestament: {
          count: oldTestament.length,
          totalChapters: oldTestament.reduce((sum, book) => sum + book.chapters, 0),
        },
        newTestament: {
          count: newTestament.length,
          totalChapters: newTestament.reduce((sum, book) => sum + book.chapters, 0),
        },
      }
    },
    enabled: !!books,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}

// Hook for checking if bible data is loading
export function useBibleBooksLoading() {
  const books = useBibleBooks()
  
  return {
    isLoading: books.isLoading,
    isError: books.isError,
    error: books.error,
  }
}