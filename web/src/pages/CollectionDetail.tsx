import { useParams, Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard, { ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { SEO } from '@/components/SEO';
import { ErrorCard, NotFoundError } from '@/components/ui/error-display';
import { useCollection } from '@/hooks/use-collections';
import { Sparkles, ChevronRight, Layers } from 'lucide-react';

export default function CollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: collection, isLoading, isError, error, refetch } = useCollection(slug);

  if (!slug) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-12 flex-1">
          <NotFoundError message="Coleção não encontrada." />
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-12 flex-1">
          <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
            <div className="h-6 w-32 bg-muted rounded-full mx-auto animate-pulse" />
            <div className="h-10 w-3/4 bg-muted rounded-xl mx-auto animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <ArtworkCardSkeleton key={index} />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-12 flex-1">
          <ErrorCard error={error} onRetry={refetch} title="Erro ao carregar coleção" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-12 flex-1">
          <NotFoundError message="Coleção temática não encontrada no catálogo." />
        </main>
        <Footer />
      </div>
    );
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    description: collection.description,
    hasPart: collection.artworks.map((art) => ({
      '@type': 'VisualArtwork',
      name: art.title,
      creator: { '@type': 'Person', name: art.artistOrDirector },
      image: art.imageUrl,
    })),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`${collection.title} — Coleção Temática`}
        description={collection.description}
        image={collection.coverImage || undefined}
        schema={schema}
      />
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs md:text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Link to="/colecoes" className="hover:text-primary transition-colors">
            Coleções
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-md">
            {collection.title}
          </span>
        </nav>

        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border/70 p-6 md:p-12 mb-12 shadow-classical">
          {collection.coverImage && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-15 dark:opacity-25 bg-cover bg-center filter blur-xl -z-10 scale-105"
              style={{ backgroundImage: `url(${collection.coverImage})` }}
            />
          )}

          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 gap-1.5 shadow-golden">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Trilha Curada • {collection.artworks.length} Obras</span>
            </Badge>

            <h1 className="text-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight">
              {collection.title}
            </h1>

            {collection.subtitle && (
              <p className="signature-italic text-lg md:text-xl text-primary dark:text-amber-300 mb-6">
                {collection.subtitle}
              </p>
            )}

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {collection.description}
            </p>
          </div>
        </div>

        {/* Artworks List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-display text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Obras da Trilha
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              Sequência Narrativa
            </span>
          </div>

          {collection.artworks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collection.artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} showReferences />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl p-8">
              <p className="text-muted-foreground text-sm">
                Nenhuma obra catalogada para esta trilha temática no momento.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
