import { Link, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LoadingGrid, Loading } from '@/components/ui/loading';
import { ErrorCard } from '@/components/ui/error-display';
import { useBibleBooks, useOldTestamentBooks, useNewTestamentBooks } from '@/hooks/use-bible-books';
import { Book, BookOpen } from 'lucide-react';

export default function BibleBooks() {
  const [searchParams] = useSearchParams();
  const testament = searchParams.get('testament');
  
  const { isLoading: allLoading, isError: allError, error: allErrorData, refetch: refetchAll } = useBibleBooks();
  const { data: oldTestamentBooks = [], isLoading: oldLoading, isError: oldError, error: oldErrorData, refetch: refetchOld } = useOldTestamentBooks();
  const { data: newTestamentBooks = [], isLoading: newLoading, isError: newError, error: newErrorData, refetch: refetchNew } = useNewTestamentBooks();

  const getTitle = () => {
    if (testament === 'old') return 'Antigo Testamento';
    if (testament === 'new') return 'Novo Testamento';
    return 'Livros da Bíblia';
  };

  const getDescription = () => {
    if (testament === 'old') return 'Explore as obras de arte inspiradas nos livros do Antigo Testamento, de Gênesis a Malaquias.';
    if (testament === 'new') return 'Descubra as interpretações artísticas dos livros do Novo Testamento, de Mateus a Apocalipse.';
    return 'Navegue pelos 66 livros da Bíblia e descubra as obras de arte que cada um inspirou ao longo da história.';
  };

  // Handle loading and error states
  const isLoading = testament === 'old' ? oldLoading : testament === 'new' ? newLoading : allLoading;
  const isError = testament === 'old' ? oldError : testament === 'new' ? newError : allError;
  const errorData = testament === 'old' ? oldErrorData : testament === 'new' ? newErrorData : allErrorData;
  const refetch = testament === 'old' ? refetchOld : testament === 'new' ? refetchNew : refetchAll;

  return (
    <div className="min-h-screen bg-background">
      {/* Sem <SEO>, a aba ficava com o título da última página com SEO
          visitada (document.title não reseta ao trocar de rota na SPA) —
          achado real 2026-08-22. */}
      <SEO title={getTitle()} description={getDescription()} />
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="w-4 h-4 mr-2" />
            Navegação Bíblica
          </Badge>
          
          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {getTitle()}
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {getDescription()}
          </p>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              asChild 
              variant={!testament ? "default" : "outline"}
              className="shadow-card"
            >
              <Link to="/biblia">Todos os Livros</Link>
            </Button>
            <Button 
              asChild 
              variant={testament === 'old' ? "default" : "outline"}
              className="shadow-card"
            >
              <Link to="/biblia?testament=old">Antigo Testamento</Link>
            </Button>
            <Button 
              asChild 
              variant={testament === 'new' ? "default" : "outline"}
              className="shadow-card"
            >
              <Link to="/biblia?testament=new">Novo Testamento</Link>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            <div className="text-center">
              <Loading text="Carregando livros bíblicos..." />
            </div>
            <LoadingGrid count={12} />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <ErrorCard 
            error={errorData} 
            onRetry={refetch}
            title="Erro ao carregar livros bíblicos"
          />
        )}

        {/* Content - Only show when not loading and no error */}
        {!isLoading && !isError && (
          <>
            {/* Old Testament Section */}
            {(!testament || testament === 'old') && oldTestamentBooks.length > 0 && (
              <div className="mb-12 sm:mb-16">
                <h2 className="text-display text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
                  Antigo Testamento
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {oldTestamentBooks.map((book) => (
                    <Card key={book.slug} className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border-0">
                      <Link to={`/biblia/${book.slug}`}>
                        <CardHeader className="text-center p-3 sm:p-4 pb-2">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto gradient-hero rounded-lg flex items-center justify-center mb-2 group-hover:shadow-golden transition-all duration-300">
                            <Book className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <CardTitle className="text-display text-xs sm:text-sm font-semibold group-hover:text-primary transition-colors leading-tight">
                            {book.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 text-center">
                          {/* Pedido do Rilson 2026-09-01: cardzinho só mostrava
                              capítulos, sem noção de cobertura do acervo —
                              agora mostra as duas contagens juntas, curto o
                              bastante pro card compacto. */}
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {book.chapters} {book.chapters === 1 ? 'cap.' : 'caps.'}
                            {' · '}
                            {book.artworkCount} {book.artworkCount === 1 ? 'obra' : 'obras'}
                          </p>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* New Testament Section */}
            {(!testament || testament === 'new') && newTestamentBooks.length > 0 && (
              <div>
                <h2 className="text-display text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
                  Novo Testamento
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {newTestamentBooks.map((book) => (
                    <Card key={book.slug} className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border-0">
                      <Link to={`/biblia/${book.slug}`}>
                        <CardHeader className="text-center p-3 sm:p-4 pb-2">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto gradient-hero rounded-lg flex items-center justify-center mb-2 group-hover:shadow-golden transition-all duration-300">
                            <Book className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <CardTitle className="text-display text-xs sm:text-sm font-semibold group-hover:text-primary transition-colors leading-tight">
                            {book.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 text-center">
                          {/* Pedido do Rilson 2026-09-01: cardzinho só mostrava
                              capítulos, sem noção de cobertura do acervo —
                              agora mostra as duas contagens juntas, curto o
                              bastante pro card compacto. */}
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {book.chapters} {book.chapters === 1 ? 'cap.' : 'caps.'}
                            {' · '}
                            {book.artworkCount} {book.artworkCount === 1 ? 'obra' : 'obras'}
                          </p>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-display text-xl font-semibold mb-4">
              Não encontrou o que procurava?
            </h3>
            <p className="text-muted-foreground mb-6">
              Explore nossas obras de arte por categoria ou use a busca para encontrar algo específico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="shadow-card">
                <Link to="/arte">Explorar por Arte</Link>
              </Button>
              <Button asChild variant="outline" className="shadow-card">
                <Link to="/busca">Busca Avançada</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}