import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getBibleBooks, getOldTestamentBooks, getNewTestamentBooks } from '@/lib/data';
import { Book, BookOpen } from 'lucide-react';

export default function BibleBooks() {
  const [searchParams] = useSearchParams();
  const testament = searchParams.get('testament');
  
  const allBooks = getBibleBooks();
  const oldTestamentBooks = getOldTestamentBooks();
  const newTestamentBooks = getNewTestamentBooks();

  const getDisplayBooks = () => {
    if (testament === 'old') return oldTestamentBooks;
    if (testament === 'new') return newTestamentBooks;
    return allBooks;
  };

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

  const displayBooks = getDisplayBooks();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="w-4 h-4 mr-2" />
            Navegação Bíblica
          </Badge>
          
          <h1 className="text-display text-3xl md:text-4xl font-bold mb-4">
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

        {/* Old Testament Section */}
        {(!testament || testament === 'old') && (
          <div className="mb-16">
            <h2 className="text-display text-2xl font-bold mb-6 text-center">
              Antigo Testamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {oldTestamentBooks.map((book) => (
                <Card key={book.slug} className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border-0">
                  <Link to={`/biblia/${book.slug}`}>
                    <CardHeader className="text-center pb-2">
                      <div className="w-12 h-12 mx-auto gradient-hero rounded-lg flex items-center justify-center mb-3 group-hover:shadow-golden transition-all duration-300">
                        <Book className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-display text-sm font-semibold group-hover:text-primary transition-colors leading-tight">
                        {book.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-center">
                      <p className="text-xs text-muted-foreground">
                        {book.chapters} capítulos
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* New Testament Section */}
        {(!testament || testament === 'new') && (
          <div>
            <h2 className="text-display text-2xl font-bold mb-6 text-center">
              Novo Testamento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {newTestamentBooks.map((book) => (
                <Card key={book.slug} className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border-0">
                  <Link to={`/biblia/${book.slug}`}>
                    <CardHeader className="text-center pb-2">
                      <div className="w-12 h-12 mx-auto gradient-hero rounded-lg flex items-center justify-center mb-3 group-hover:shadow-golden transition-all duration-300">
                        <Book className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-display text-sm font-semibold group-hover:text-primary transition-colors leading-tight">
                        {book.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-center">
                      <p className="text-xs text-muted-foreground">
                        {book.chapters} capítulos
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
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