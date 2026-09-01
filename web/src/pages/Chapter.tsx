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
import type { Artwork } from '@/types';

/** Quais números de versículo deste capítulo têm pelo menos 1 obra —
 *  pra destacar na leitura do texto (pedido do Rilson 2026-09-01).
 *  `verses` na referência vem como "5", "27-30" ou "5,7" (múltiplos
 *  trechos); sem `verses` = obra cobre o capítulo inteiro (não marca
 *  versículo nenhum individualmente, seria destacar tudo). */
function collectVersesWithArt(artworks: Artwork[], bookSlug: string, chapterNum: number): Set<number> {
  const verses = new Set<number>();
  for (const artwork of artworks) {
    for (const ref of artwork.references) {
      if (ref.bookSlug !== bookSlug || ref.chapter !== chapterNum || !ref.verses) continue;
      for (const part of ref.verses.split(',')) {
        const bounds = part.trim().split('-').map(Number);
        const start = bounds[0];
        const end = bounds[1];
        if (start === undefined || !Number.isFinite(start)) continue;
        const last = end !== undefined && Number.isFinite(end) ? end : start;
        for (let v = start; v <= last; v++) verses.add(v);
      }
    }
  }
  return verses;
}

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
  const versesWithArt = collectVersesWithArt(artworks, bookSlug, chapterNum);

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
        <div className="relative mb-10 sm:mb-16">
          <div className="gradient-hero rounded-2xl p-0.5 sm:p-1">
            <Card className="border-0 bg-background/95 backdrop-blur">
              <CardContent className="p-4 sm:p-8 md:p-12">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-3 sm:mb-6 shadow-golden text-xs sm:text-sm">
                    <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {book.testament === 'old' ? 'Antigo Testamento' : 'Novo Testamento'}
                  </Badge>

                  <h1 className="text-display text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-5 tracking-tight gradient-text">
                    {book.name} {chapterNum}
                  </h1>

                  <div className="flex items-center justify-center space-x-2 text-xs sm:text-base text-muted-foreground mb-5 sm:mb-8">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span>{artworks.length} {artworks.length === 1 ? 'obra de arte sobre este capítulo' : 'obras de arte sobre este capítulo'}</span>
                  </div>

                  {/* Chapter Navigation Bar */}
                  <div className="flex items-center justify-between max-w-xs sm:max-w-md mx-auto gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/40">
                    {prevChapter ? (
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                        <Link to={`/biblia/${book.slug}/${prevChapter}`} aria-label={`Capítulo ${prevChapter}`}>
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          <span>Cap. {prevChapter}</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled className="h-8 px-2 sm:px-3 text-xs sm:text-sm opacity-40">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        <span>Anterior</span>
                      </Button>
                    )}

                    <span className="text-xs sm:text-sm font-semibold text-foreground px-2 whitespace-nowrap">
                      {chapterNum} / {book.chapters}
                    </span>

                    {nextChapter ? (
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                        <Link to={`/biblia/${book.slug}/${nextChapter}`} aria-label={`Capítulo ${nextChapter}`}>
                          <span>Cap. {nextChapter}</span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" disabled className="h-8 px-2 sm:px-3 text-xs sm:text-sm opacity-40">
                        <span>Próximo</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Artworks Section — antes do texto de propósito (pedido do
            Rilson 2026-09-01): o foco do site é arte, faz mais sentido
            mostrar as obras logo depois do título do que enterrá-las
            depois do texto corrido do capítulo. */}
        <div className="mb-10 sm:mb-16">
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

        {/* Passage Text */}
        <div className="mb-16">
          <div className="gradient-hero rounded-2xl p-0.5 sm:p-1">
            <Card className="border-0 bg-background/95 backdrop-blur">
              <CardContent className="p-4 sm:p-8 md:p-12">
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
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                      <h2 className="text-display text-lg sm:text-2xl font-bold">
                        {passage.reference}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {passage.translation} · domínio público
                      </span>
                    </div>
                    {versesWithArt.size > 0 && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                        <Palette className="w-3.5 h-3.5 text-primary" />
                        Versículos com <Palette className="w-3 h-3 inline text-primary" /> têm obra de arte associada
                      </p>
                    )}
                    <div className="space-y-3 sm:space-y-4">
                      {passage.verses.map((verse) => {
                        const hasArt = versesWithArt.has(verse.verse);
                        return (
                          <p
                            key={verse.verse}
                            className={`text-sm sm:text-base leading-relaxed text-foreground/90 ${hasArt ? 'bg-primary/5 -mx-2 px-2 py-1 rounded-lg' : ''}`}
                          >
                            <span className="text-primary font-bold mr-2 text-xs sm:text-sm inline-block min-w-[1.25rem]">
                              {verse.verse}
                            </span>
                            {verse.text}
                            {hasArt && (
                              <Palette className="w-3.5 h-3.5 text-primary inline ml-2 mb-0.5" aria-label="Há obra de arte sobre este versículo" />
                            )}
                          </p>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
