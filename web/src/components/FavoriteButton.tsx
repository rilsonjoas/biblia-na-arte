import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  artworkId: string;
  className?: string;
  /** Card usa isso pra ficar fora do <Link> (previne navegação sem
   *  precisar de stopPropagation) — ArtworkDetail não precisa. */
  size?: 'sm' | 'md';
}

export function FavoriteButton({ artworkId, className, size = 'md' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(artworkId);
  const dim = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(artworkId);
      }}
      aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={favorited}
      title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={cn(
        'transition-colors',
        favorited ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
        className,
      )}
    >
      <Heart className={dim} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
