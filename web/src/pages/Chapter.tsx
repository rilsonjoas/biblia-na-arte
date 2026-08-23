import { useParams, Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard, { ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { PassageTimeline } from '@/components/PassageTimeline';
import { SEO } from '@/components/SEO';
import { LoadingGrid, Loading } from '@/components/ui/loading';
import { ErrorCard, NotFoundError } from '@/components/ui/error-display';
import { useBibleBookBySlug } from '@/hooks/use-bible-books';
import { useBiblePassage } from '@/hooks/use-bible-passage';
import { useArtworksByBibleReference } from '@/hooks/use-artworks';
import { Book, Palette, ChevronLeft, ChevronRight, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function Chapter() {
  const { bookSlug, chapter } = useParams<{ bookSlug: string; chapter: string }>();

  const chapterNum = chapter ? Number(chapter) : NaN;
  const chapterIsValid = Number.isInteger(chapterNum) && chapterNum > 0;

  const { data: book, isLoading: bookLoading, isError: bookError, error: bookErrorData } = useBibleBookBySlug(bookSlug);
  const {
    data: artworks = [],
    isLoading: artworksLoading,
    isError: artworksError,
    error: artworksErrorData,
    refetch: refetchArtworks,
  } = useArtworksByBibleReference(bookSlug, chapterIsValid ? chapterNum : undefined);
  const {
    data: passage,
    isLoading: passageLoading,
    isError: passageError,
    refetch: refetchPassage,
  } = useBiblePassage(bookSlug, chapterIsValid ? chapterNum : undefined);

  const chapterOutOfRange = !!book && chapterIsValid && chapterNum > book.chapters;

  const renderShell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">{children}</div>
      <Footer />
    </div>
  );

  if (!bookSlug || !chapterIsValid) {
    return renderShell(
      <NotFoundError message="Capítulo inválido. Verifique o endereço e tente novamente." />
    );
  }

  if (bookLoading) {
    return renderShell(
      <>
        <div className="text-center mb-12">
          <Loading text="Carregando capítulo..." />
        </div>
        <LoadingGrid count={6} />
      </>
    );
  }

  if (bookError || !book) {
    return renderShell(
      bookError ? (
        <ErrorCard error={bookErrorData} title="Erro ao carregar livro" />
      ) : (
        <NotFoundError message="Livro bíblico não encontrado" />
      )
    );
  }

  if (chapterOutOfRange) {
    return renderShell(
      <NotFoundError message={`${book.name} tem apenas ${book.chapters} capítulos.`} />
    );
  }

  const prevChapter = chapterNum > 1 ? chapterNum - 1 : null;
  const nextChapter = chapterNum < book.chapters ? chapterNum + 1 : null;

  const chapterSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${book.name} ${chapterNum} na Arte`,
    description: `Pinturas e arte sacra retratando os eventos do capítulo ${chapterNum} do livro de ${book.name}.`,
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
        title={`${book.name} ${chapterNum} — Texto Bíblico e Obras de Arte`}
        description={`Leia o capítulo ${chapterNum} de ${book.name} na tradução Almeida e explore ${artworks.length} obras de arte inspiradas nesta passagem.`}
        schema={chapterSchema}
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
          <Link to={`/biblia/${book.slug}`} className="hover:text-foreground transition-colors">
            {book.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">Capítulo {chapterNum}</span>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Button asChild variant="outline" className="shadow-card">
            <Link to={`/biblia/${book.slug}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Livro
            </Link>
          </Button>
        </div>

        {/* Hero Section */}
        <div className="relative mb-16">
          <div className="gradient-hero rounded-2xl p-1">
            <Card className="border-0 bg-background/95 backdrop-blur">
              <CardContent className="p-12">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-6 shadow-golden">
                    <Book className="w-4 h-4 mr-2" />
                    {book.testament === 'old' ? 'Antigo Testamento' : 'Novo Testamento'}
                  </Badge>

                  <h1 className="text-display text-3xl sm:text-4xl md:text-6xl font-bold mb-6 gradient-text">
                    {book.name} {chapterNum}
                  </h1>

                  <div className="flex items-center justify-center space-x-6 text-lg text-muted-foreground mb-8">
                    <div className="flex items-center space-x-2">
                      <Palette className="w-5 h-5" />
                      <span>{artworks.length} obras sobre este capítulo</span>
                    </div>
                  </div>

                  {/* Chapter Navigation */}
                  <div className="flex items-center justify-center gap-4">
                    {prevChapter ? (
                      <Button asChild variant="outline" className="shadow-card">
                        <Link to={`/biblia/${book.slug}/${prevChapter}`}>
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Capítulo {prevChapter}
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Capítulo Anterior
                      </Button>
                    )}

                    <span className="text-muted-foreground">
                      {chapterNum} / {book.chapters}
                    </span>

                    {nextChapter ? (
                      <Button asChild variant="outline" className="shadow-card">
                        <Link to={`/biblia/${book.slug}/${nextChapter}`}>
                          Capítulo {nextChapter}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        Capítulo Seguinte
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Passage Text */}
        <div className="mb-16">
          <div className="gradient-hero rounded-2xl p-1">
            <Card className="border-0 bg-background/95 backdrop-blur">
              <CardContent className="p-8 md:p-12">
                {passageLoading && <Loading text="Carregando o texto bíblico..." />}

                {passageError && !passageLoading && (
                  <div className="flex items-start space-x-3 text-sm text-muted-foreground">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p>
                        Não foi possível carregar o texto do capítulo agora. Tente novamente em instantes.
                      </p>
                      <button
                        onClick={() => refetchPassage()}
                        className="text-primary hover:underline"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                )}

                {passage && !passageLoading && (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-display text-2xl md:text-3xl font-bold">
                        {passage.reference}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {passage.translation} · domínio público
                      </span>
                    </div>
                    <div className="space-y-4">
                      {passage.verses.map((verse) => (
                        <p key={verse.verse} className="text-lg leading-relaxed text-foreground/90">
                          <span className="text-primary font-semibold mr-2">
                            {verse.verse}
                          </span>
                          {verse.text}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Artworks Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 shadow-golden">
              <Palette className="w-4 h-4 mr-2" />
              Obras de Arte
            </Badge>

            <h2 className="text-display text-xl sm:text-2xl md:text-3xl font-bold mb-4">
              {book.name} {chapterNum} na Arte
            </h2>

            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Obras que retratam os eventos e ensinamentos deste capítulo.
            </p>
          </div>

          {artworksLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <ArtworkCardSkeleton key={index} />
              ))}
            </div>
          )}

          {artworksError && !artworksLoading && (
            <ErrorCard
              error={artworksErrorData}
              onRetry={refetchArtworks}
              title="Erro ao carregar obras de arte"
            />
          )}

          {!artworksLoading && !artworksError && (
            <>
              {artworks.length > 0 ? (
                <>
                  <PassageTimeline artworks={artworks} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {artworks.map((artwork) => (
                      <ArtworkCard key={artwork.id} artwork={artwork} />
                    ))}
                  </div>
                </>
              ) : (
                <Card className="gradient-card border-0 text-center py-16">
                  <CardContent>
                    <Book className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-display text-xl font-semibold mb-2">
                      Nenhuma obra encontrada
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Ainda não temos obras de arte para este capítulo específico.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild variant="outline" className="shadow-card">
                        <Link to={`/biblia/${book.slug}`}>
                          Ver Todas as Obras do Livro
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="shadow-card">
                        <Link to="/contribuir">
                          Sugerir uma Obra
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
