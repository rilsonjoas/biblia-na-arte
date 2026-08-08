import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard from '@/components/ArtworkCard';
import { LoadingGrid, Loading } from '@/components/ui/loading';
import { ErrorCard, NotFoundError } from '@/components/ui/error-display';
import { useBibleBookBySlug } from '@/hooks/use-bible-books';
import { useArtworksByBibleReference } from '@/hooks/use-artworks';
import { bibleDescriptions } from '@/data/bibleDescriptions';
import { Book, Palette, Sparkles, ArrowLeft, Quote, Clock, Globe, Heart } from 'lucide-react';

export default function BibleBook() {
  const { bookSlug } = useParams<{ bookSlug: string }>();
  
  const { data: book, isLoading: bookLoading, isError: bookError, error: bookErrorData } = useBibleBookBySlug(bookSlug);
  const { 
    data: artworks = [], 
    isLoading: artworksLoading, 
    isError: artworksError, 
    error: artworksErrorData,
    refetch: refetchArtworks 
  } = useArtworksByBibleReference(bookSlug);

  // Get description data
  const bookDescription = bibleDescriptions.find(desc => desc.slug === bookSlug);

  if (!bookSlug) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <ErrorCard 
            error={new Error('Slug do livro não fornecido')} 
            title="Erro de Navegação"
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <Loading text="Carregando livro bíblico..." />
          </div>
          <LoadingGrid count={6} />
        </div>
        <Footer />
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          {bookError ? (
            <ErrorCard 
              error={bookErrorData} 
              title="Erro ao carregar livro"
            />
          ) : (
            <NotFoundError message="Livro bíblico não encontrado" />
          )}
        </div>
        <Footer />
      </div>
    );
  }

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
          <Link to="/biblia" className="hover:text-foreground transition-colors">
            Livros da Bíblia
          </Link>
          <span>/</span>
          <span className="text-foreground">{book.name}</span>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Button asChild variant="outline" className="shadow-card">
            <Link to="/biblia">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Livros
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <div className="relative mb-16">
          <div className="gradient-hero rounded-2xl p-1">
            <Card className="border-0 bg-background/95 backdrop-blur">
              <CardContent className="p-12">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-6 shadow-golden">
                    <Book className="w-4 h-4 mr-2" />
                    {book.testament === 'old' ? 'Antigo Testamento' : 'Novo Testamento'}
                  </Badge>
                  
                  <h1 className="text-display text-4xl md:text-6xl font-bold mb-6 gradient-text">
                    {book.name}
                  </h1>
                  
                  <div className="flex items-center justify-center space-x-6 text-lg text-muted-foreground mb-8">
                    <div className="flex items-center space-x-2">
                      <Book className="w-5 h-5" />
                      <span>{book.chapters} capítulos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Palette className="w-5 h-5" />
                      <span>{artworks.length} obras de arte</span>
                    </div>
                  </div>

                  {bookDescription && (
                    <p className="text-xl text-foreground/80 max-w-4xl mx-auto leading-relaxed">
                      {bookDescription.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Book Information Grid */}
        {bookDescription && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Key Themes */}
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-display text-2xl flex items-center">
                  <Sparkles className="w-6 h-6 mr-3 text-primary" />
                  Temas Principais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {bookDescription.keyThemes.map((theme, index) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Famous Passages */}
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-display text-2xl flex items-center">
                  <Quote className="w-6 h-6 mr-3 text-primary" />
                  Passagens Famosas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {bookDescription.famousPassages.map((passage, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-sm text-foreground/80">{passage}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Historical Context */}
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-display text-2xl flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-primary" />
                  Contexto Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 leading-relaxed">
                  {bookDescription.historicalContext}
                </p>
              </CardContent>
            </Card>

            {/* Artistic Significance */}
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-display text-2xl flex items-center">
                  <Heart className="w-6 h-6 mr-3 text-primary" />
                  Significado Artístico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 leading-relaxed">
                  {bookDescription.artisticSignificance}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Artworks Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 shadow-golden">
              <Palette className="w-4 h-4 mr-2" />
              Obras de Arte
            </Badge>
            
            <h2 className="text-display text-3xl font-bold mb-4">
              Arte Inspirada em {book.name}
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Descubra como artistas ao longo da história interpretaram e deram vida às 
              narrativas e ensinamentos deste livro sagrado.
            </p>
          </div>

          {/* Artworks Loading State */}
          {artworksLoading && (
            <div className="space-y-8">
              <div className="text-center">
                <Loading text="Carregando obras de arte..." />
              </div>
              <LoadingGrid count={6} />
            </div>
          )}

          {/* Artworks Error State */}
          {artworksError && !artworksLoading && (
            <ErrorCard 
              error={artworksErrorData} 
              onRetry={refetchArtworks}
              title="Erro ao carregar obras de arte"
            />
          )}

          {/* Artworks Content */}
          {!artworksLoading && !artworksError && (
            <>
              {artworks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {artworks.map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>
              ) : (
                <Card className="gradient-card border-0 text-center py-16">
                  <CardContent>
                    <Book className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-display text-xl font-semibold mb-2">
                      Nenhuma obra encontrada
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Ainda não temos obras de arte específicas para este livro em nossa coleção.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild variant="outline" className="shadow-card">
                        <Link to="/arte">
                          Explorar Todas as Artes
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="shadow-card">
                        <Link to="/contribuir">
                          Sugerir uma Obra
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-display text-xl font-semibold mb-4">
              Continue Explorando
            </h3>
            <p className="text-muted-foreground mb-6">
              Descubra outros livros da Bíblia e as obras de arte que eles inspiraram.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="shadow-card">
                <Link to="/biblia">
                  <Book className="w-4 h-4 mr-2" />
                  Outros Livros Bíblicos
                </Link>
              </Button>
              <Button asChild variant="outline" className="shadow-card">
                <Link to={`/biblia?testament=${book.testament}`}>
                  <Globe className="w-4 h-4 mr-2" />
                  {book.testament === 'old' ? 'Antigo Testamento' : 'Novo Testamento'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}