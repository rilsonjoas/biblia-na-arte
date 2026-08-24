import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useArtworks } from '@/hooks/use-artworks';
import { CATEGORIES } from '@/lib/categories';
import { Palette, Sparkles } from 'lucide-react';

/** Picker de categorias em `/arte` — só isso. O antigo "modo por
 *  categoria" (`/arte/:category`) foi removido daqui e unificado com
 *  `Search.tsx` (achado 2026-08-23, decisão do Rilson: unificar código,
 *  não a URL — zero risco de SEO). Essa página segue existindo porque é
 *  conteúdo genuinamente diferente de busca: um convite pra explorar,
 *  não uma lista de resultados. */
export default function ArtCategories() {
  const { data: allArtworks = [] } = useArtworks();

  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    count: allArtworks.filter((a) => a.category === cat.slug).length,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Explorar por Arte"
        description="Navegue pelas diferentes formas de expressão artística inspiradas nas Sagradas Escrituras: pinturas, músicas e filmes."
      />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Card key={cat.slug} className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border-0">
                <Link to={`/arte/${cat.slug}`}>
                  <CardHeader className="text-center p-4 sm:p-6 pb-2 sm:pb-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-3 group-hover:shadow-golden transition-all duration-300">
                      <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <CardTitle className="text-display text-xl sm:text-2xl group-hover:text-primary transition-colors mb-1">
                      {cat.name}
                    </CardTitle>
                    {cat.count > 0 ? (
                      <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-2 sm:mb-4">
                        {cat.count} {cat.count === 1 ? 'obra' : 'obras'}
                      </p>
                    ) : (
                      <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-accent/80 mb-2 sm:mb-4">
                        ✦ Em breve
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:pt-0">
                    <CardDescription className="text-center leading-relaxed text-xs sm:text-sm">
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
