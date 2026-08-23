import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard, { ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { SEO } from '@/components/SEO';
import { ErrorCard } from '@/components/ui/error-display';
import { useArtworksByCategory, useArtworks } from '@/hooks/use-artworks';
import { Music, Film, Palette, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 24;

export default function ArtCategories() {
  const { category } = useParams<{ category?: string }>();
  const [page, setPage] = useState(1);

  // Get all artworks for category counts (when showing all categories)
  const { data: allArtworks = [] } = useArtworks();
  
  // Get specific category data (when showing a specific category)
  const { 
    data: categoryArtworks = [], 
    isLoading: isCategoryLoading, 
    isError: isCategoryError, 
    error: categoryError,
    refetch: refetchCategory 
  } = useArtworksByCategory(category);

  const categories = [
    {
      slug: 'painting',
      name: 'Pinturas',
      description: 'Desde as obras renascentistas até os mestres barrocos, contemple como a arte visual interpretou as Sagradas Escrituras ao longo dos séculos.',
      icon: Palette,
      count: allArtworks.filter(a => a.category === 'painting').length
    },
    {
      slug: 'music',
      name: 'Músicas',
      description: 'Em breve, você poderá ouvir aqui como a fé cristã encontrou sua voz mais sublime — dos hinos gregorianos aos grandes oratórios clássicos da música sacra.',
      icon: Music,
      count: allArtworks.filter(a => a.category === 'music').length
    },
    {
      slug: 'film',
      name: 'Filmes',
      description: 'Em breve, vamos explorar como o cinema moderno e clássico trouxe as narrativas bíblicas para as telas, criando experiências visuais impactantes.',
      icon: Film,
      count: allArtworks.filter(a => a.category === 'film').length
    }
  ];

  // If no specific category, show all categories
  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 shadow-golden">
              <Sparkles className="w-4 h-4 mr-2" />
              Categorias Artísticas
            </Badge>
            
            <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Explorar por Arte
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Navegue pelas diferentes formas de expressão artística que encontraram 
              inspiração nas Sagradas Escrituras ao longo da história.
            </p>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Card key={cat.slug} className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-2 gradient-card border-0">
                  <Link to={`/arte/${cat.slug}`}>
                    <CardHeader className="text-center pb-4">
                      <div className="w-20 h-20 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4 group-hover:shadow-golden transition-all duration-300">
                        <IconComponent className="w-10 h-10 text-white" />
                      </div>
                      <CardTitle className="text-display text-2xl group-hover:text-primary transition-colors mb-1">
                        {cat.name}
                      </CardTitle>
                      {cat.count > 0 ? (
                        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-4">
                          {cat.count} {cat.count === 1 ? 'obra' : 'obras'}
                        </p>
                      ) : (
                        <p className="text-[11px] font-medium uppercase tracking-widest text-accent/80 mb-4">
                          ✦ Em breve
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center leading-relaxed">
                        {cat.description}
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-display text-xl font-semibold mb-4">
                Prefere navegar pela Bíblia?
              </h3>
              <p className="text-muted-foreground mb-6">
                Explore livro por livro e descubra as obras de arte inspiradas 
                em cada passagem das Escrituras.
              </p>
              <Link 
                to="/biblia"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-classical"
              >
                <Palette className="w-5 h-5 mr-2" />
                Navegar pela Bíblia
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Show specific category
  const currentCategory = categories.find(cat => cat.slug === category);
  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <ErrorCard 
            error={new Error('Categoria não encontrada')} 
            title="Categoria Inválida"
          />
        </div>
        <Footer />
      </div>
    );
  }

  const IconComponent = currentCategory.icon;

  if (isCategoryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <IconComponent className="w-4 h-4 mr-2" />
              {currentCategory.name}
            </Badge>
            <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              {currentCategory.name} Inspiradas na Bíblia
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <ArtworkCardSkeleton key={index} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isCategoryError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <ErrorCard 
            error={categoryError} 
            onRetry={refetchCategory}
            title="Erro ao carregar categoria"
          />
        </div>
        <Footer />
      </div>
    );
  }

  const totalPages = Math.ceil(categoryArtworks.length / PAGE_SIZE) || 1;
  const paginatedArtworks = categoryArtworks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${currentCategory.name} Inspiradas na Bíblia`}
        description={currentCategory.description}
      />
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <IconComponent className="w-4 h-4 mr-2" />
            {currentCategory.name}
          </Badge>
          
          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {currentCategory.name} Inspiradas na Bíblia
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {currentCategory.description}
          </p>

          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm">
              {categoryArtworks.length} obras encontradas
            </Badge>
          </div>
        </div>

        {/* Artworks Grid */}
        {categoryArtworks.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {paginatedArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage((p) => Math.max(p - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página <strong className="text-foreground">{page}</strong> de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage((p) => Math.min(p + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page >= totalPages}
                  className="gap-1"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <IconComponent className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-display text-xl font-semibold mb-2">
              Nenhuma obra encontrada
            </h3>
            <p className="text-muted-foreground mb-6">
              Ainda não temos obras desta categoria em nossa coleção.
              Volte em breve.
            </p>
            <Link 
              to="/arte"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ver Todas as Categorias
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}