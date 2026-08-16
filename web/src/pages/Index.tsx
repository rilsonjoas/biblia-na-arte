import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard, { ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { SEO } from '@/components/SEO';
import { ErrorCard } from '@/components/ui/error-display';
import { useFeaturedArtworks } from '@/hooks/use-artworks';
import { Book, Palette, Music, Film, Sparkles } from 'lucide-react';

// Servido de web/public/ (não é uma pintura do catálogo, é asset de UI) —
// path fixo em vez de import, sem precisar de hash de build pra um banner
// único que não muda com frequência.
const heroImage = '/hero-banner.jpg';

export default function Index() {
  const { data: featuredArtworks = [], isLoading, isError, error, refetch } = useFeaturedArtworks();

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bíblia na Arte',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://biblianaarte.narniano.com',
    description: 'Catálogo de arte sacra e pinturas históricas inspiradas nas Sagradas Escrituras.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${typeof window !== 'undefined' ? window.location.origin : 'https://biblianaarte.narniano.com'}/busca?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO schema={websiteSchema} />
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Overlay em 80% (não 60%) — achado real 2026-08-16: com 60% o
            gradiente dourado do título ficava com contraste real de
            ~2.9:1 sobre a imagem de fundo também dourada, abaixo do
            mínimo WCAG de 3:1 pra texto grande. Calculado com luminância
            real, não só "parece ok". */}
        <div className="absolute inset-0 bg-primary/80" />
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 text-sm shadow-golden">
              <Sparkles className="w-4 h-4 mr-2" />
              Explore as Conexões Sagradas
            </Badge>
            
            <h1 className="text-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
              A Bíblia através da
              <span className="block gradient-accent bg-clip-text text-transparent">
                Arte e Cultura
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
              Descubra como as narrativas sagradas foram interpretadas e retratadas 
              ao longo da história através de pinturas, músicas e filmes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="shadow-golden text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Link to="/biblia">
                  <Book className="w-5 h-5 mr-2" />
                  Explorar pela Bíblia
                </Link>
              </Button>
              <Button 
                asChild 
                variant="hero"
                size="lg" 
                className="shadow-classical text-lg px-8 py-6"
              >
                <Link to="/arte">
                  <Palette className="w-5 h-5 mr-2" />
                  Descobrir Arte
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-display text-3xl md:text-4xl font-bold mb-4">
              Como Explorar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Navegue pelas Escrituras ou por categoria artística para descobrir 
              as profundas conexões entre fé e expressão criativa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-2 gradient-card border-0">
              <Link to="/biblia">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4 group-hover:shadow-golden transition-all duration-300">
                    <Book className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-display text-xl group-hover:text-primary transition-colors">
                    Navegar pela Bíblia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Explore livro por livro, capítulo por capítulo, e descubra 
                    as obras de arte inspiradas em cada passagem.
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-2 gradient-card border-0">
              <Link to="/arte/painting">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4 group-hover:shadow-golden transition-all duration-300">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-display text-xl group-hover:text-primary transition-colors">
                    Pinturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Das obras renascentistas aos mestres barrocos, 
                    contemple como a arte visual interpretou as Escrituras.
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-2 gradient-card border-0">
              <Link to="/arte/music">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4 group-hover:shadow-golden transition-all duration-300">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-display text-xl group-hover:text-primary transition-colors">
                    Músicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Dos hinos gregorianos aos oratórios clássicos, 
                    ouça como a fé encontrou sua voz na música.
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-2 gradient-card border-0">
              <Link to="/arte/film">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4 group-hover:shadow-golden transition-all duration-300">
                    <Film className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-display text-xl group-hover:text-primary transition-colors">
                    Filmes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Descubra como o cinema moderno trouxe as 
                    narrativas bíblicas para as telas.
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Artworks */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-display text-3xl md:text-4xl font-bold mb-4">
              Obras em Destaque
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Uma seleção cuidadosa de obras-primas que capturam a essência 
              e beleza das narrativas sagradas.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <ArtworkCardSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            <ErrorCard 
              error={error} 
              onRetry={refetch}
              title="Erro ao carregar obras em destaque" 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredArtworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg" className="shadow-card">
              <Link to="/arte">
                Ver Todas as Obras
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-display text-3xl md:text-4xl font-bold mb-6">
              Sobre a Bíblia na Arte
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Este projeto nasceu da paixão por descobrir como a Palavra de Deus 
              inspirou os maiores artistas da humanidade. Aqui, cada pintura, música 
              e filme não é apenas uma obra de arte, mas uma janela para 
              compreender como diferentes culturas e épocas interpretaram as 
              verdades eternas das Escrituras.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Nossa missão é criar pontes entre a fé ancestral e a expressão 
              artística, oferecendo uma experiência contemplativa e educativa 
              para todos que buscam aprofundar sua compreensão tanto da Bíblia 
              quanto da arte que ela inspirou.
            </p>
            <Button asChild size="lg" className="shadow-classical">
              <Link to="/sobre">
                Saiba Mais sobre o Projeto
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}