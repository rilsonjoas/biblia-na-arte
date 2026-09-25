import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { Artwork } from '@/types';
import { Music, Film, Palette, ImageIcon } from 'lucide-react';
import { stripMarkdown, slugifyArtistName, artworkHref } from '@/lib/utils';
import { FavoriteButton } from '@/components/FavoriteButton';

interface ArtworkCardProps {
  artwork: Artwork;
  showReferences?: boolean;
}

export function ArtworkCardSkeleton({ showReferences = true }: { showReferences?: boolean }) {
  return (
    <Card className="overflow-hidden border border-border/50 bg-card shadow-sm">
      <CardHeader className="p-0">
        <AspectRatio ratio={4 / 3}>
          <Skeleton className="w-full h-full rounded-none" />
        </AspectRatio>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-12 w-full" />
        {showReferences && (
          <div className="pt-2 flex gap-1">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ArtworkCard({ artwork, showReferences = true }: ArtworkCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUrl = artwork.imageUrl;
  const navigate = useNavigate();
  const artistLinkTarget = `/artista/${slugifyArtistName(artwork.artistOrDirector)}`;

  // O card inteiro é um <Link> pro /obra/:id — aninhar outro <a> só no
  // nome do artista seria HTML inválido, então navegamos manualmente e
  // paramos a propagação antes que o clique chegue no Link de fora
  // (mesmo raciocínio do FavoriteButton acima, achado 2026-09-01).
  const goToArtist = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(artistLinkTarget);
  };

  const getCategoryIcon = () => {
    switch (artwork.category) {
      case 'painting':
        return <Palette className="w-3.5 h-3.5" />;
      case 'music':
        return <Music className="w-3.5 h-3.5" />;
      case 'film':
        return <Film className="w-3.5 h-3.5" />;
      default:
        return <Palette className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryLabel = () => {
    switch (artwork.category) {
      case 'painting':
        return 'Pintura';
      case 'music':
        return 'Música';
      case 'film':
        return 'Filme';
      default:
        return 'Arte';
    }
  };

  const linkTarget = artworkHref(artwork);

  return (
      <Card className="group relative overflow-hidden hover:shadow-classical transition-all duration-300 [transition-timing-function:var(--ease-liturgico)] hover:-translate-y-1 bg-card border border-border/60 hover:border-accent/40 rounded-xl">
      {/* Fora do <Link> de propósito — clique na fita não deve navegar
          (achado 2026-08-23, feature de favoritos locais) */}
      <FavoriteButton
        artworkId={artwork.id}
        size="sm"
        className="absolute top-2 left-2 z-10 h-7 w-7 flex items-center justify-center rounded-full shadow-md backdrop-blur-md bg-card/85 border border-border/40"
      />
      <Link to={linkTarget} viewTransition className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        <CardHeader className="p-0 relative overflow-hidden bg-muted/40 gallery-frame">
          <AspectRatio ratio={4 / 3}>
            {imageUrl ? (
              <>
                {!imageLoaded && (
                  <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
                )}
                <img
                  src={imageUrl}
                  alt={artwork.title}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  style={{ viewTransitionName: `artwork-img-${artwork.id}` }}
                  className={`w-full h-full object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300 [transition-timing-function:var(--ease-vela)] ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </>
            ) : (
              <div className="w-full h-full bg-muted/50 rounded-t-xl flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-xs">{getCategoryLabel()}</span>
              </div>
            )}

            {/* Category badge */}
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="secondary" className="shadow-md backdrop-blur-md bg-card/85 text-foreground border border-border/40 text-xs font-medium gap-1 px-2 py-0.5">
                {getCategoryIcon()}
                <span>{getCategoryLabel()}</span>
              </Badge>
            </div>
          </AspectRatio>
        </CardHeader>

        <CardContent className="p-4">
          <h3 className="text-display font-semibold text-base md:text-lg mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {artwork.title}
          </h3>

          <div className="space-y-0.5 text-xs md:text-sm text-muted-foreground mb-2">
            <span
              role="link"
              tabIndex={0}
              onClick={goToArtist}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToArtist(e)}
              className="font-medium text-foreground/90 hover:text-primary hover:underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm inline-block"
            >
              {artwork.artistOrDirector}
            </span>
            {artwork.year && <p className="numeral-classico text-xs">{artwork.year}</p>}
            {artwork.mediumOrGenre && <p className="italic text-xs">{artwork.mediumOrGenre}</p>}
          </div>

          {artwork.description && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {stripMarkdown(artwork.description)}
            </p>
          )}

          {showReferences && artwork.references.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider">
                Referências Bíblicas:
              </p>
              <div className="flex flex-wrap gap-1">
                {artwork.references.slice(0, 3).map((ref, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-[11px] font-normal border-accent/40 bg-accent/5 text-foreground/80 hover:bg-accent/15"
                  >
                    {ref.book} {ref.chapter}{ref.verses ? `:${ref.verses}` : ''}
                  </Badge>
                ))}
                {artwork.references.length > 3 && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    +{artwork.references.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {artwork.dimensionsOrDuration && (
          <CardFooter className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground/70">
              {artwork.dimensionsOrDuration}
            </p>
          </CardFooter>
        )}
      </Link>
    </Card>
  );
}