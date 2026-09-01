import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard, { ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { SEO } from '@/components/SEO';
import { ErrorCard } from '@/components/ui/error-display';
import { useFavorites } from '@/hooks/use-favorites';
import { useFavoriteArtworks } from '@/hooks/use-artworks';
import { Bookmark, Palette } from 'lucide-react';

/** Favoritos locais (roadmap Fase 5, 2026-08-23) — sem conta de usuário,
 *  por design. Fica só no navegador de quem favoritou. */
export default function Favorites() {
  const { favoriteIds } = useFavorites();
  const { artworks, isLoading, isError } = useFavoriteArtworks(favoriteIds);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Meus Favoritos"
        description="Suas obras favoritas do Bíblia na Arte, salvas neste navegador."
      />
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <Bookmark className="w-4 h-4 mr-2" />
            Sua coleção pessoal
          </Badge>
          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Meus Favoritos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Obras que você marcou com <Bookmark className="w-4 h-4 inline text-primary" fill="currentColor" /> —
            salvas só neste navegador, sem conta nem login.
          </p>
        </div>

        {favoriteIds.length === 0 ? (
          <Card className="gradient-card border-0 text-center py-16 max-w-xl mx-auto">
            <CardContent>
              <Bookmark className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-display text-xl font-semibold mb-2">
                Nenhum favorito ainda
              </h3>
              <p className="text-muted-foreground mb-6">
                Clique na fita de qualquer obra pra guardá-la aqui.
              </p>
              <Link
                to="/arte"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-classical"
              >
                <Palette className="w-5 h-5 mr-2" />
                Explorar o Acervo
              </Link>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: Math.min(favoriteIds.length, 6) }).map((_, index) => (
              <ArtworkCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <ErrorCard
            error={new Error('Falha ao carregar seus favoritos')}
            title="Erro ao carregar favoritos"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
