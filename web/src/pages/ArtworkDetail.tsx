import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingCard } from '@/components/ui/loading';
import { ErrorCard, NotFoundError } from '@/components/ui/error-display';
import { useArtwork } from '@/hooks/use-artworks';
import { Music, Film, Palette, ExternalLink, Calendar, User, Ruler, Info } from 'lucide-react';

export default function ArtworkDetail() {
  const { artworkId } = useParams<{ artworkId: string }>();
  
  const { data: artwork, isLoading, isError, error, refetch } = useArtwork(artworkId);
  
  if (!artworkId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <ErrorCard 
            error={new Error('ID da obra não fornecido')} 
            title="Erro de Navegação"
          />
        </div>
        <Footer />
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <LoadingCard text="Carregando obra de arte..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <ErrorCard 
            error={error} 
            onRetry={refetch}
            title="Erro ao carregar obra"
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <NotFoundError />
        </div>
        <Footer />
      </div>
    );
  }

  const getCategoryIcon = () => {
    switch (artwork.category) {
      case 'painting':
        return <Palette className="w-5 h-5" />;
      case 'music':
        return <Music className="w-5 h-5" />;
      case 'film':
        return <Film className="w-5 h-5" />;
      default:
        return <Palette className="w-5 h-5" />;
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <span>/</span>
          <Link to="/arte" className="hover:text-foreground transition-colors">
            Arte
          </Link>
          <span>/</span>
          <Link to={`/arte/${artwork.category}`} className="hover:text-foreground transition-colors">
            {getCategoryLabel()}
          </Link>
          <span>/</span>
          <span className="text-foreground">{artwork.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Image/Media Section */}
          <div>
            <Card className="gradient-card border-0 overflow-hidden">
              <CardContent className="p-0">
                <AspectRatio ratio={4/3}>
                  {artwork.embedUrl ? (
                    <iframe
                      src={artwork.embedUrl}
                      title={artwork.title}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : artwork.imageUrl ? (
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      {getCategoryIcon()}
                    </div>
                  )}
                </AspectRatio>
              </CardContent>
            </Card>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-4">
                {getCategoryIcon()}
                <span className="ml-2">{getCategoryLabel()}</span>
              </Badge>
              
              <h1 className="text-display text-3xl md:text-4xl font-bold mb-4">
                {artwork.title}
              </h1>
              
              <div className="space-y-3 text-lg">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{artwork.artistOrDirector}</span>
                </div>
                
                {artwork.year && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>{artwork.year}</span>
                  </div>
                )}
                
                {artwork.mediumOrGenre && (
                  <div className="flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                    <span>{artwork.mediumOrGenre}</span>
                  </div>
                )}
                
                {artwork.dimensionsOrDuration && (
                  <div className="flex items-center space-x-2">
                    <Ruler className="w-5 h-5 text-muted-foreground" />
                    <span>{artwork.dimensionsOrDuration}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-display text-xl font-semibold mb-3">Descrição</h2>
              <p className="text-foreground/80 leading-relaxed">
                {artwork.description}
              </p>
            </div>

            {/* Atribuição — obrigatória por licença (ex. CC BY-SA), não
                cosmética. Ver auditoria de direitos autorais no vault. */}
            {artwork.attributionText && (
              <div className="flex items-start space-x-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{artwork.attributionText}</span>
              </div>
            )}

            {artwork.sourceUrl && (
              <Button asChild variant="outline" className="shadow-card">
                <a href={artwork.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Fonte Original
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Biblical References */}
        {artwork.references.length > 0 && (
          <Card className="gradient-card border-0 mb-12">
            <CardHeader>
              <CardTitle className="text-display text-2xl">
                Referências Bíblicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artwork.references.map((ref, index) => (
                  <Card key={index} className="border bg-background/50">
                    <CardContent className="p-4">
                      <Link 
                        to={`/biblia/${ref.bookSlug}/${ref.chapter}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <h3 className="font-semibold mb-1">
                          {ref.book} {ref.chapter}
                          {ref.verses && `:${ref.verses}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Clique para ver outras obras inspiradas nesta passagem
                        </p>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="shadow-card">
            <Link to={`/arte/${artwork.category}`}>
              Ver Mais {getCategoryLabel()}s
            </Link>
          </Button>
          <Button asChild variant="outline" className="shadow-card">
            <Link to="/arte">
              Explorar Todas as Artes
            </Link>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}