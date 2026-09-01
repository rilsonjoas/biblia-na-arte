import { Bookmark } from 'lucide-react';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  artworkId: string;
  className?: string;
  /** Card usa isso pra ficar fora do <Link> (previne navegação sem
   *  precisar de stopPropagation) — ArtworkDetail não precisa. */
  size?: 'sm' | 'md';
}

// Achado 2026-09-01: era um coração vermelho (ícone de "curtir" de rede
// social) — destoa do resto do site, que se apresenta como acervo/galeria,
// não feed social. Trocado por uma fita marcadora (Bookmark): o gesto de
// "marcar a página" de um catálogo, coerente com a identidade de biblioteca
// do cluster A Biblioteca (mesmo espírito da fita/ribbon do Scriptorium
// Divinum). Cor segue o dourado da marca em vez de vermelho, que aqui não
// tinha nenhum vínculo com a paleta.
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
        'transition-all duration-200',
        favorited
          ? 'text-primary'
          : 'text-muted-foreground hover:text-primary hover:scale-110',
        className,
      )}
    >
      <Bookmark className={dim} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
