import { useQuery } from '@tanstack/react-query';
import { getCollections, getCollectionBySlug } from '@/lib/api-data';
import type { ThematicCollection, ThematicCollectionDetail } from '@/types';

export function useCollections() {
  return useQuery<ThematicCollection[], Error>({
    queryKey: ['collections'],
    queryFn: getCollections,
    staleTime: 1000 * 60 * 30, // 30 min
  });
}

export function useCollection(slug?: string) {
  return useQuery<ThematicCollectionDetail | null, Error>({
    queryKey: ['collection', slug],
    queryFn: () => (slug ? getCollectionBySlug(slug) : Promise.resolve(null)),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 15, // 15 min
  });
}
