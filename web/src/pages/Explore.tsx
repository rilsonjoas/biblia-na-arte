import { useParams, Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard, { ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { SEO } from '@/components/SEO';
import { Loading } from '@/components/ui/loading';
import { ErrorCard, NotFoundError } from '@/components/ui/error-display';
import { useExplore } from '@/hooks/use-artworks';
import { useBibleBookBySlug } from '@/hooks/use-bible-books';
import { Book, Palette, Network, ArrowLeft, Map } from 'lucide-react';

/**
 * "Mapa de obras ↔ referências bíblicas" (/explorar, aprovada 2026-09-02).
 * Decisão (registrada no roadmap): o "grafo" da ideia original virou um
 * mapa estático navegável — a passagem é o hub das conexões: as obras dela,
 * para onde dá pra navegar a partir dela (outros capítulos do livro com
 * arte) e os temas presentes. Sem lib de grafo force-directed (pesado/no
 * mobile/não indexável) — é navegação clicável que o Google indexa.
 */
export default function Explore() {
  const { bookSlug, chapter } = useParams<{ bookSlug: string; chapter: string }>();

  const chapterNum = chapter ? Number(chapter) : NaN;
  const chapterIsValid = Number.isInteger(chapterNum) && chapterNum > 0;

  const { data: explore, isLoading, isError, error, refetch } = useExplore(
    bookSlug,
    chapterIsValid ? chapterNum : undefined,
  );
  const { data: book } = useBibleBookBySlug(bookSlug);

  const renderShell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">{children}</div>
      <Footer />
    </div>
  );

  if (!bookSlug || !chapterIsValid) {
    return renderShell(
      <NotFoundError message="Passagem inválida. Verifique o endereço e tente novamente." />,
    );
  }

  if (isLoading) {
    return renderShell(
      <>
        <div className="text-center mb-12">
          <Loading text="Carregando as conexões desta passagem..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArtworkCardSkeleton key={index} />
          ))}
        </div>
      </>,
    );
  }

  if (isError) {
    return renderShell(<ErrorCard error={error} onRetry={refetch} title="Erro ao mapear passagem" />);
  }

  if (!explore) {
    return renderShell(<NotFoundError message="Passagem não encontrada no acervo." />);
  }

  const { book: exploreBook, chapter: exploreChapter, artworks, relatedChapters, themes } = explore;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${exploreBook.name} ${exploreChapter} — explorar conexões com a arte`,
    description: `Mapa de conexões da passagem ${exploreBook.name} ${exploreChapter}: ${artworks.length} obras, outros capítulos do livro com arte e os temas que atravessam esta passagem.`,
    hasPart: artworks.map((art) => ({
      '@type': 'VisualArtwork',
      name: art.title,
      creator: { '@type': 'Person', name: art.artistOrDirector },
      image: art.imageUrl,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${exploreBook.name} ${exploreChapter} — Explorar conexões com a arte`}
        description={`Mapeie as obras que retratam ${exploreBook.name} ${exploreChapter}, os outros capítulos deste livro com arte e os temas que atravessam esta passagem.`}
        schema={schema}
      />
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
          <Link to={`/biblia/${book ? book.slug : bookSlug}`} className="hover:text-foreground transition-colors">
            {exploreBook.name}
          </Link>
          <span>/</span>
          <Link to={`/biblia/${bookSlug}/${exploreChapter}`} className="hover:text-foreground transition-colors">
            Capítulo {exploreChapter}
          </Link>
          <span>/</span>
          <span className="text-foreground">Explorar</span>
        </div>

        {/* Back to chapter */}
        <div className="mb-8">
          <Link
            to={`/biblia/${bookSlug}/${exploreChapter}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar à página do capítulo
          </Link>
        </div>

        {/* Hero — a passagem como hub */}
        <div className="relative mb-12">
          <div className="gradient-hero rounded-2xl p-0.5 sm:p-1">
            <Card className="border-0 bg-background/95 backdrop-blur">
              <CardContent className="p-4 sm:p-8 md:p-12">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-4 shadow-golden">
                    <Network className="w-4 h-4 mr-2" />
                    Mapa de Conexões
                  </Badge>
                  <h1 className="text-display text-2xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight gradient-text">
                    {exploreBook.name} {exploreChapter}
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                    Esta passagem como centro de uma rede: as obras que a retratam,
                    os outros capítulos do livro que também viraram arte e os temas
                    que atravessam esta cena.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-5">
                    <Palette className="w-4 h-4 text-primary" />
                    <span>
                      {artworks.length} {artworks.length === 1 ? 'obra nesta passagem' : 'obras nesta passagem'} ·{' '}
                      {relatedChapters.length} {relatedChapters.length === 1 ? 'outro capítulo com arte' : 'outros capítulos com arte'} ·{' '}
                      {themes.length} {themes.length === 1 ? 'tema' : 'temas'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Temas desta passagem */}
        {themes.length > 0 && (
          <section className="mb-12">
            <div className="text-center mb-6">
              <Badge variant="secondary" className="mb-3 shadow-golden">
                <Map className="w-3.5 h-3.5 mr-2" />
                Temas desta passagem
              </Badge>
              <h2 className="text-display text-lg sm:text-2xl font-bold">
                Os fios que atravessam esta cena
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {themes.map((theme) => (
                <Link
                  key={theme.slug}
                  to={`/busca?themes=${theme.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-sm text-foreground hover:border-accent/40 hover:bg-muted/70 transition-colors"
                >
                  <span>{theme.name}</span>
                  <span className="text-xs text-muted-foreground">{theme.artworkCount}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Obras da passagem */}
        <section className="mb-14">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3 shadow-golden">
              <Palette className="w-3.5 h-3.5 mr-2" />
              Obras desta passagem
            </Badge>
            <h2 className="text-display text-lg sm:text-2xl font-bold">
              {exploreBook.name} {exploreChapter} na Arte
            </h2>
          </div>

          {artworks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {artworks.map((art) => (
                <ArtworkCard
                  key={art.id}
                  showReferences={false}
                  artwork={{
                    id: art.id,
                    title: art.title,
                    subtitle: art.subtitle,
                    artistOrDirector: art.artistOrDirector,
                    year: art.year,
                    category: art.category,
                    description: '',
                    imageUrl: art.imageUrl,
                    references: [],
                    licenseType: 'public-domain',
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="gradient-card border-0 text-center py-16">
              <CardContent>
                <Book className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-display text-xl font-semibold mb-2">Nenhuma obra aqui</h3>
                <p className="text-muted-foreground mb-6">
                  Ainda não temos obras para esta passagem específica — mas há outras
                  passagens deste livro que viraram arte.
                </p>
                {(() => {
                  const firstRelated = relatedChapters[0];
                  return firstRelated ? (
                    <Link
                      to={`/biblia/${bookSlug}/${firstRelated.chapter}`}
                      className="text-primary hover:underline"
                    >
                      Ver {exploreBook.name} {firstRelated.chapter}
                    </Link>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Outras passagens do livro */}
        {relatedChapters.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-3 shadow-golden">
                <Book className="w-3.5 h-3.5 mr-2" />
                Continue explorando
              </Badge>
              <h2 className="text-display text-lg sm:text-2xl font-bold">
                Outras passagens de {exploreBook.name} com arte
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {relatedChapters.map((rc) => (
                <Link
                  key={rc.chapter}
                  to={`/explorar/${bookSlug}/${rc.chapter}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-2 pr-4 hover:border-accent/40 hover:bg-muted/70 transition-colors"
                >
                  {rc.coverImageUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/60 bg-muted flex-shrink-0">
                      <img
                        src={rc.coverImageUrl}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {exploreBook.name} {rc.chapter}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {rc.chapterCount} {rc.chapterCount === 1 ? 'obra' : 'obras'}
                    </span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-accent rotate-180 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
}
