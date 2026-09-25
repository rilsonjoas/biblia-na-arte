import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard, { ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { PinturaDoDia } from '@/components/PinturaDoDia';
import { VersiculoDoDia } from '@/components/VersiculoDoDia';
import { SEO } from '@/components/SEO';
import { ErrorCard } from '@/components/ui/error-display';
import { useFeaturedArtworks } from '@/hooks/use-artworks';
import { Book, Palette, Search, Sparkles, Instagram } from 'lucide-react';

// Pintura/gravura sacra do acervo usada como imagem de fundo do Hero (Gustave Doré — Egípcios Afogados no Mar, 1866)
const heroImage = '/images/gustave-dore-egipcios-afogados-no-mar.webp';

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
          className="absolute inset-0 bg-cover bg-[center_30%] md:bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Scrim cinematográfico equilibrado: a arte fica perfeitamente visível e o texto 100% legível */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white py-12">
          <div className="max-w-4xl mx-auto">
            <Badge 
              variant="outline" 
              className="mb-6 text-sm px-4 py-1.5 bg-black/60 text-amber-300 border-amber-500/40 shadow-golden backdrop-blur-md inline-flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
              Explore as Conexões Sagradas
            </Badge>
            
            <h1 className="text-display text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              A Bíblia através da
              <span className="block mt-1 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                Arte e Cultura
              </span>
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl mb-8 text-white/95 max-w-3xl mx-auto leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] font-normal">
              Descubra como as narrativas sagradas foram interpretadas 
              ao longo da história através de pinturas cuidadosamente 
              curadas, ligadas às passagens que as inspiraram.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="shadow-golden text-lg px-8 py-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-transform hover:scale-[1.02]"
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
                className="shadow-classical text-lg px-8 py-6 bg-black/50 text-white border-white/30 hover:bg-white/20 hover:text-white backdrop-blur-md transition-transform hover:scale-[1.02]"
              >
                <Link to="/arte/painting">
                  <Palette className="w-5 h-5 mr-2" />
                  Descobrir Arte
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Cards: Como Explorar */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Como Explorar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Navegue pelas Escrituras, por movimentos artísticos ou pesquise obras 
              específicas para descobrir as profundas conexões entre fé e arte.
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
                    Galeria de Pinturas
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
              <Link to="/busca">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4 group-hover:shadow-golden transition-all duration-300">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-display text-xl group-hover:text-primary transition-colors">
                    Busca Avançada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Pesquise obras por artista, período histórico, 
                    estilo ou referências bíblicas detalhadas.
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-2 gradient-card border-0">
              <Link to="/colecoes">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4 group-hover:shadow-golden transition-all duration-300">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-display text-xl group-hover:text-primary transition-colors">
                    Explorar Coleções
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    Conheça as trilhas temáticas e seleções curadas
                    da nossa biblioteca visual de arte sacra.
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Pintura do Dia */}
      <PinturaDoDia />

      {/* Featured Artworks */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
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
              <Link to="/arte/painting">
                Ver Todas as Obras
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Versículo do Dia */}
      <VersiculoDoDia />

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              Sobre a Bíblia na Arte
            </h2>
            {/* text-foreground/80, sem text-lg: mesmo texto existe em About.tsx
                (/sobre) com esse estilo — aqui estava com text-lg
                text-muted-foreground, tamanho e cor diferentes pro mesmo
                parágrafo em duas páginas — achado real 2026-08-22 */}
            <p className="text-foreground/80 leading-relaxed mb-8">
              Este projeto nasceu da paixão por descobrir como a Palavra de Deus
              inspirou os artistas ao longo dos séculos — paixão alimentada pelas
              leituras de Hans Rookmaaker e Alister McGrath sobre fé, visão bíblica
              e a beleza nas artes. Aqui, cada pintura não é apenas uma imagem,
              mas uma janela para compreender como diferentes culturas e épocas
              interpretaram as verdades eternas das Escrituras.
            </p>
            <p className="text-foreground/80 leading-relaxed mb-8">
              Na prática, tudo começou no Instagram com o Arte Cristã Diária, um
              museu devocional digital — <em>Ora et Contempla</em>, uma obra por
              dia. Este site é a casa permanente desse acervo: cada pintura
              ligada à passagem que a gerou, numa experiência contemplativa e
              educativa para todos que buscam aprofundar tanto a Bíblia quanto
              a arte que ela inspirou.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="shadow-classical">
                <Link to="/sobre">
                  Saiba Mais sobre o Projeto
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="shadow-card">
                <a href="https://www.instagram.com/artecristadiaria/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-5 h-5 mr-2" />
                  Seguir o Arte Cristã Diária
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}