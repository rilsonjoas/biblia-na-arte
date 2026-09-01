import { useParams, Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard from '@/components/ArtworkCard';
import { SEO } from '@/components/SEO';
import { Loading, LoadingGrid } from '@/components/ui/loading';
import { ErrorCard, NotFoundError } from '@/components/ui/error-display';
import { Markdown } from '@/components/ui/markdown';
import { stripMarkdown } from '@/lib/utils';
import { useArtist } from '@/hooks/use-artworks';
import { User, Palette, ArrowLeft } from 'lucide-react';

/**
 * "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23) — mínimo
 * viável: rota funcionando + biografia (quando o vault tem uma) + grade
 * de obras + link do nome do artista apontando pra cá (ver
 * ArtworkCard/ArtworkDetail). Retrato em moldura *tondo* e linha do tempo
 * visual ficam pra "camada 2", em cima desta rota — não implementados
 * ainda, registrado no roadmap.
 */
export default function ArtistPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: artist, isLoading, isError, error } = useArtist(slug);

  const renderShell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">{children}</div>
      <Footer />
    </div>
  );

  if (!slug) {
    return renderShell(<NotFoundError message="Artista não encontrado." />);
  }

  if (isLoading) {
    return renderShell(
      <>
        <div className="text-center mb-12">
          <Loading text="Carregando artista..." />
        </div>
        <LoadingGrid count={6} />
      </>,
    );
  }

  if (isError) {
    return renderShell(<ErrorCard error={error} title="Erro ao carregar artista" />);
  }

  if (!artist) {
    return renderShell(<NotFoundError message="Artista não encontrado no acervo." />);
  }

  const artistSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.name,
    description: artist.bio ? stripMarkdown(artist.bio).slice(0, 300) : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${artist.name} — Obras na Arte Bíblica`}
        description={
          artist.bio
            ? stripMarkdown(artist.bio).slice(0, 160)
            : `Explore as ${artist.artworks.length} obras de ${artist.name} inspiradas nas Sagradas Escrituras.`
        }
        schema={artistSchema}
      />
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Início
          </Link>
          <span>/</span>
          <Link to="/arte" className="hover:text-foreground transition-colors">
            Galeria de Arte
          </Link>
          <span>/</span>
          <span className="text-foreground">{artist.name}</span>
        </div>

        <div className="mb-8">
          <Link
            to="/arte"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à Galeria
          </Link>
        </div>

        {/* Hero — nome + contagem de obras, biografia abaixo quando existe */}
        <div className="relative mb-12">
          <div className="gradient-hero rounded-2xl p-0.5 sm:p-1">
            <Card className="border-0 bg-background/95 backdrop-blur">
              <CardContent className="p-4 sm:p-8 md:p-12">
                <div className="text-center mb-6">
                  <Badge variant="secondary" className="mb-4 shadow-golden">
                    <User className="w-4 h-4 mr-2" />
                    Artista
                  </Badge>
                  <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                    {artist.name}
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Palette className="w-4 h-4 text-primary" />
                    <span>
                      {artist.artworks.length}{' '}
                      {artist.artworks.length === 1 ? 'obra no acervo' : 'obras no acervo'}
                    </span>
                  </div>
                </div>

                {artist.bio ? (
                  <div className="capitular text-foreground/90 text-base leading-relaxed max-w-3xl mx-auto">
                    <Markdown content={artist.bio} />
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground italic max-w-xl mx-auto">
                    Ainda não temos uma biografia curada pra {artist.name} — a galeria abaixo já mostra
                    todas as obras dele no acervo.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Galeria de Obras */}
        <section>
          <h2 className="text-display text-xl sm:text-2xl font-bold mb-6">
            Obras de {artist.name}
          </h2>

          {artist.artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {artist.artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          ) : (
            <Card className="gradient-card border-0 text-center py-16">
              <CardContent>
                <Palette className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-display text-xl font-semibold mb-2">Nenhuma obra encontrada</h3>
                <p className="text-muted-foreground">
                  Este artista ainda não tem obras publicadas no acervo.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
