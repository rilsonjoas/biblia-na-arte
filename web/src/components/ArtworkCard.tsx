import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Artwork } from '@/types';
import { Music, Film, Palette } from 'lucide-react';

interface ArtworkCardProps {
  artwork: Artwork;
  showReferences?: boolean;
}

export default function ArtworkCard({ artwork, showReferences = true }: ArtworkCardProps) {
  const getCategoryIcon = () => {
    switch (artwork.category) {
      case 'painting':
        return <Palette className="w-4 h-4" />;
      case 'music':
        return <Music className="w-4 h-4" />;
      case 'film':
        return <Film className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
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

  return (
    <Card className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border-0">
      <Link to={`/obra/${artwork.id}`}>
        <CardHeader className="p-0">
          <AspectRatio ratio={4/3}>
            {artwork.imageUrl ? (
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
                {getCategoryIcon()}
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="shadow-sm">
                {getCategoryIcon()}
                <span className="ml-1 text-xs">{getCategoryLabel()}</span>
              </Badge>
            </div>
          </AspectRatio>
        </CardHeader>

        <CardContent className="p-4">
          <h3 className="text-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {artwork.title}
          </h3>
          
          <div className="space-y-1 text-sm text-muted-foreground mb-3">
            <p className="font-medium">{artwork.artistOrDirector}</p>
            {artwork.year && <p>{artwork.year}</p>}
            {artwork.mediumOrGenre && <p>{artwork.mediumOrGenre}</p>}
          </div>

          <p className="text-sm text-foreground/80 line-clamp-3 mb-3">
            {artwork.description}
          </p>

          {showReferences && artwork.references.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Referências Bíblicas:
              </p>
              <div className="flex flex-wrap gap-1">
                {artwork.references.slice(0, 3).map((ref, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs border-accent/30 text-accent-foreground/70"
                  >
                    {ref.book} {ref.chapter}{ref.verses ? `:${ref.verses}` : ''}
                  </Badge>
                ))}
                {artwork.references.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{artwork.references.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {artwork.dimensionsOrDuration && (
          <CardFooter className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">
              {artwork.dimensionsOrDuration}
            </p>
          </CardFooter>
        )}
      </Link>
    </Card>
  );
}