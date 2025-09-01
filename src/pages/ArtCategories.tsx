import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard from '@/components/ArtworkCard';
import { getArtworksByCategory } from '@/lib/data';
import { Music, Film, Palette, Sparkles } from 'lucide-react';
import { ArtworkCategory } from '@/types';

export default function ArtCategories() {
  const { category } = useParams<{ category?: string }>();

  const categories = [
    {
      slug: 'painting',
      name: 'Pinturas',
      description: 'Desde as obras renascentistas até os mestres barrocos, contemple como a arte visual interpretou as Sagradas Escrituras ao longo dos séculos.',
      icon: Palette,
      count: getArtworksByCategory('painting').length
    },
    {
      slug: 'music',
      name: 'Músicas',
      description: 'Dos hinos gregorianos aos grandes oratórios clássicos, ouça como a fé cristã encontrou sua voz mais sublime na música sacra.',
      icon: Music,
      count: getArtworksByCategory('music').length
    },
    {
      slug: 'film',
      name: 'Filmes',
      description: 'Descubra como o cinema moderno e clássico trouxe as narrativas bíblicas para as telas, criando experiências visuais impactantes.',
      icon: Film,
      count: getArtworksByCategory('film').length
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
            
            <h1 className="text-display text-3xl md:text-4xl font-bold mb-4">
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
                      <CardTitle className="text-display text-2xl group-hover:text-primary transition-colors mb-2">
                        {cat.name}
                      </CardTitle>
                      <Badge variant="outline" className="mb-4">
                        {cat.count} obras
                      </Badge>
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
    return <div>Categoria não encontrada</div>;
  }

  const artworks = getArtworksByCategory(category as ArtworkCategory);
  const IconComponent = currentCategory.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <IconComponent className="w-4 h-4 mr-2" />
            {currentCategory.name}
          </Badge>
          
          <h1 className="text-display text-3xl md:text-4xl font-bold mb-4">
            {currentCategory.name} Inspiradas na Bíblia
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {currentCategory.description}
          </p>

          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm">
              {artworks.length} obras encontradas
            </Badge>
          </div>
        </div>

        {/* Artworks Grid */}
        {artworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <IconComponent className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-display text-xl font-semibold mb-2">
              Nenhuma obra encontrada
            </h3>
            <p className="text-muted-foreground mb-6">
              Ainda não temos obras desta categoria em nossa coleção.
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