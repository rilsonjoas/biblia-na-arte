import { useQuery } from '@tanstack/react-query'
import { getBiblePassage } from '@/lib/api-data'

export const biblePassageKeys = {
  all: ['biblePassage'] as const,
  passage: (bookSlug: string, chapter: number) => [...biblePassageKeys.all, bookSlug, chapter] as const,
}

export function useBiblePassage(bookSlug: string | undefined, chapter: number | undefined) {
  return useQuery({
    queryKey: biblePassageKeys.passage(bookSlug || '', chapter || 0),
    queryFn: () => getBiblePassage(bookSlug!, chapter!),
    enabled: !!bookSlug && !!chapter,
    staleTime: 60 * 60 * 1000, // 1 hour - texto bíblico não muda
    gcTime: 2 * 60 * 60 * 1000,
  })
}
