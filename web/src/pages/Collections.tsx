import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LoadingGrid } from '@/components/ui/loading';
import { ErrorCard } from '@/components/ui/error-display';
import { useCollections } from '@/hooks/use-collections';
import { Sparkles, Layers, ArrowRight } from 'lucide-react';

export default function Collections() {
  const { data: collections = [], isLoading, isError, error, refetch } = useCollections();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Coleções Temáticas"
        description="Explore trilhas temáticas e narrativas das Escrituras através da arte sacra e mestres da pintura."
      />
      <Header />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
            Trilhas e Narrativas
          </Badge>

          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Coleções Temáticas
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trilhas curadas para contemplar a história bíblica através de sequências de obras-primas da arte mundial.
          </p>
        </div>

        {isLoading && <LoadingGrid count={4} />}

        {isError && (
          <div className="max-w-md mx-auto">
            <ErrorCard error={error} onRetry={refetch} title="Erro ao carregar coleções" />
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                to={`/colecoes/${collection.slug}`}
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
              >
                <Card className="h-full overflow-hidden border border-border/70 bg-card hover:border-primary/40 hover:shadow-classical transition-all duration-300 [transition-timing-function:var(--ease-liturgico)] hover:-translate-y-1 rounded-2xl flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {collection.coverImage ? (
                      <img
                        src={collection.coverImage}
                        alt={collection.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 [transition-timing-function:var(--ease-vela)]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted/60 flex items-center justify-center">
                        <Layers className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 drop-shadow">
                        {collection.subtitle}
                      </span>
                      <h2 className="text-xl font-display font-bold leading-snug drop-shadow-md">
                        {collection.title}
                      </h2>
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {collection.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                      <Badge variant="outline" className="gap-1 border-primary/20 text-primary bg-primary/5">
                        <Layers className="w-3 h-3" />
                        <span>{collection.artworkCount} obras na trilha</span>
                      </Badge>

                      <span className="flex items-center gap-1 text-primary font-medium group-hover:translate-x-1 transition-transform">
                        Explorar trilha <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
