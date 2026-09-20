import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard from '@/components/ArtworkCard';
import { ArtworkLightbox } from '@/components/ArtworkLightbox';
import { AdUnit } from '@/components/AdUnit';
import { SEO } from '@/components/SEO';
import { ErrorCard, NotFoundError } from '@/components/ui/error-display';
import { Markdown } from '@/components/ui/markdown';
import { CopyButton, CopyImageButton } from '@/components/ui/copy-button';
import { DownloadStoryButton } from '@/components/DownloadStoryButton';
import { DownloadArtworkButton } from '@/components/DownloadArtworkButton';
import { FavoriteButton } from '@/components/FavoriteButton';
import { cn, stripMarkdown, slugifyArtistName, artworkHref } from '@/lib/utils';
import { useArtwork, useArtworksByBibleReference, useArtworks } from '@/hooks/use-artworks';
import {
  Music,
  Film,
  Palette,
  ExternalLink,
  Calendar,
  User,
  Ruler,
  Info,
  Maximize2,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Quote,
  Network,
} from 'lucide-react';

export default function ArtworkDetail() {
  const { artworkId } = useParams<{ artworkId: string }>();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { data: artwork, isLoading, isError, error, refetch } = useArtwork(artworkId);

  // Fetch related artworks by first Bible reference
  const firstRef = artwork?.references?.[0];
  const { data: chapterArtworks = [] } = useArtworksByBibleReference(
    firstRef?.bookSlug,
    firstRef?.chapter
  );

  // Fetch other works by same artist
  const { data: allArtworks = [] } = useArtworks();
  const artistArtworks = artwork
    ? allArtworks.filter(
        (a) =>
          a.id !== artwork.id &&
          a.artistOrDirector.toLowerCase() === artwork.artistOrDirector.toLowerCase()
      )
    : [];

  const relatedArtworks = (
    chapterArtworks.filter((a) => a.id !== artwork?.id).length > 0
      ? chapterArtworks.filter((a) => a.id !== artwork?.id)
      : artistArtworks
  ).slice(0, 4);

  if (!artworkId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-12 flex-1">
          <ErrorCard error={new Error('ID da obra não fornecido')} title="Erro de Navegação" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          {/* Skeleton Breadcrumb */}
          <div className="flex items-center space-x-2 mb-8">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            <div className="lg:col-span-7">
              <AspectRatio ratio={4 / 3}>
                <Skeleton className="w-full h-full rounded-xl" />
              </AspectRatio>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
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
          <ErrorCard error={error} onRetry={refetch} title="Erro ao carregar obra" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-12 flex-1">
          <NotFoundError />
        </main>
        <Footer />
      </div>
    );
  }

  const getCategoryIcon = () => {
    switch (artwork.category) {
      case 'painting':
        return <Palette className="w-4 h-4" />;
      case 'music':
        return <Music className="w-4 h-4" />;
      case 'film':
        return <Film className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = () => {
    switch (artwork.category) {
      case 'painting':
        return 'Pintura';
      case 'music':
        return 'Música';
      case 'film':
        return 'Filme';
      default:
        return 'Arte';
    }
  };

  const imageUrl = artwork.imageUrl;

  const artworkSchema = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    alternateName: artwork.subtitle,
    creator: {
      '@type': 'Person',
      name: artwork.artistOrDirector,
    },
    dateCreated: artwork.year ? String(artwork.year) : undefined,
    artMedium: artwork.mediumOrGenre || 'Pintura',
    artform: 'Painting',
    image: imageUrl,
    description: stripMarkdown(artwork.description),
    license: artwork.licenseType === 'public-domain' ? 'https://creativecommons.org/publicdomain/mark/1.0/' : undefined,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={`${artwork.title} — ${artwork.artistOrDirector}`}
        description={stripMarkdown(artwork.description).slice(0, 160)}
        image={imageUrl}
        type="article"
        schema={artworkSchema}
        // Canonical sempre no slug (URL amigável, roadmap 2026-09-19),
        // mesmo quando quem visitou entrou pelo link antigo com UUID —
        // consolida o sinal de SEO num só endereço sem precisar de
        // redirect, o antigo continua respondendo 200 normalmente.
        url={typeof window !== 'undefined' ? `${window.location.origin}${artworkHref(artwork)}` : undefined}
      />
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs md:text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Link to="/arte" className="hover:text-primary transition-colors">
            Arte
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <Link to={`/arte/${artwork.category}`} className="hover:text-primary transition-colors">
            {getCategoryLabel()}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-md">
            {artwork.title}
          </span>
        </nav>

        {/* Main Artwork Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12 items-start">
          {/* Image / Media Column */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative group rounded-xl overflow-hidden bg-muted/40 border border-border/70 shadow-lg gallery-frame">
              <AspectRatio ratio={4 / 3}>
                {artwork.embedUrl ? (
                  <iframe
                    src={artwork.embedUrl}
                    title={artwork.title}
                    className="w-full h-full rounded-xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : imageUrl ? (
                  <>
                    {!imageLoaded && (
                      <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
                    )}
                    <img
                      src={imageUrl}
                      alt={artwork.title}
                      onLoad={() => setImageLoaded(true)}
                      className={`w-full h-full object-contain bg-black/5 dark:bg-black/40 rounded-xl transition-all duration-300 [transition-timing-function:var(--ease-liturgico)] group-hover:scale-[1.02] cursor-pointer ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onClick={() => setLightboxOpen(true)}
                    />
                    {/* Hover Zoom Overlay Badge */}
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/75 hover:bg-black/90 text-white backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium shadow-lg transition-transform group-hover:scale-105"
                      title="Clique para ampliar em alta resolução"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ampliar Obra (HD)</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
                    {getCategoryIcon()}
                  </div>
                )}
              </AspectRatio>
            </div>

            {/* Quick action bar below image — achado 2026-08-23 (Rilson
                testando no celular): 3 ações + o texto do meio num só
                "flex justify-between" em 12px virava parede de texto no
                mobile. Empilha (coluna) até sm, uma linha só a partir
                daí; rótulos dos botões viram só ícone no mobile
                (title=""/aria-label seguram a acessibilidade). */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground px-1">
              <span className="italic">{artwork.mediumOrGenre || 'Óleo sobre tela'}</span>
              {!artwork.embedUrl && imageUrl && (
                <div className="flex items-center gap-4 flex-wrap">
                  <CopyImageButton
                    url={imageUrl}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  />
                  {/* "Baixar obra" separado de "Compartilhar como Story"
                      (achado 2026-08-24, roadmap "Honestidade de produto/
                      UX"): antes só existia o download do render com
                      moldura+logo pro Instagram — quem queria a pintura
                      limpa (aula, sermão, impressão) recebia outra coisa
                      sem pedir. Extensão herdada da própria imageUrl
                      (sempre .webp no pipeline atual, mas não hardcoded). */}
                  <DownloadArtworkButton
                    url={imageUrl}
                    filename={`biblia-na-arte-${artwork.id}.${imageUrl.split('.').pop() || 'webp'}`}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  />
                  <DownloadStoryButton
                    artwork={artwork}
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  />
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="hover:text-primary transition-colors flex items-center gap-1 underline underline-offset-4"
                    title="Inspecionar detalhes da pintura"
                  >
                    <Maximize2 className="w-3 h-3 sm:hidden" />
                    <span className="hidden sm:inline">Inspecionar detalhes da pintura</span>
                    <span className="sm:hidden">Detalhes</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Artwork Info & Metadata Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs">
                  {getCategoryIcon()}
                  <span>{getCategoryLabel()}</span>
                </Badge>

                {artwork.licenseType === 'public-domain' ? (
                  <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs text-muted-foreground border-border bg-muted/50">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Domínio Público</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs text-muted-foreground border-border bg-muted/50">
                    <Info className="w-3.5 h-3.5" />
                    <span>Licenciado</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                  {artwork.title}
                </h1>
                <FavoriteButton artworkId={artwork.id} className="shrink-0" />
              </div>

              {artwork.subtitle && (
                <p className="signature-italic text-lg md:text-xl mb-4">
                  {artwork.subtitle}
                </p>
              )}

              {/* Creator & Metadata details */}
              {/* items-start (não center) + shrink-0 no rótulo + min-w-0 no
                  valor: sem isso, um nome de artista ou dimensão longa
                  (comum — "Michelangelo Merisi da Caravaggio", "203 × 152
                  cm, óleo sobre tela") empurra o texto pra fora da borda
                  do card em vez de quebrar linha — achado real 2026-08-22
                  ("texto não respeitando o tamanho do card") */}
              <div className="p-4 rounded-xl bg-card border border-border/70 space-y-2.5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <User className="w-4 h-4 text-primary" />
                    <span>Artista:</span>
                  </div>
                  {/* "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23) —
                      aqui não há Link envolvendo o card, então basta um Link normal. */}
                  <Link
                    to={`/artista/${slugifyArtistName(artwork.artistOrDirector)}`}
                    className="font-semibold text-foreground text-right min-w-0 break-words hover:text-primary hover:underline underline-offset-2 transition-colors"
                  >
                    {artwork.artistOrDirector}
                  </Link>
                </div>

                {artwork.year && (
                  <div className="flex items-start justify-between gap-3 border-t border-border/40 pt-2">
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Ano / Datação:</span>
                    </div>
                    <span className="numeral-classico text-foreground text-right min-w-0 break-words">
                      {artwork.year}
                    </span>
                  </div>
                )}

                {artwork.dimensionsOrDuration && (
                  <div className="flex items-start justify-between gap-3 border-t border-border/40 pt-2">
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                      <Ruler className="w-4 h-4 text-primary" />
                      <span>Dimensões:</span>
                    </div>
                    <span className="text-foreground text-right min-w-0 break-words">
                      {artwork.dimensionsOrDuration}
                    </span>
                  </div>
                )}

                {artwork.location && (
                  <div className="flex items-start justify-between gap-3 border-t border-border/40 pt-2">
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Onde ver:</span>
                    </div>
                    <span className="text-foreground text-right min-w-0 break-words">
                      {artwork.location}
                      {/* Só exibe link do Google Maps quando for um museu/local físico público real (não coleções particulares, gravuras em livros ou acervos pessoais do artista) */}
                      {!/coleç|colec|acervo|gravura|particular|privada/i.test(artwork.location) && (
                        <>
                          {' '}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(artwork.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline whitespace-nowrap"
                          >
                            (ver no mapa)
                          </a>
                        </>
                      )}
                      {/* Decisão de produto formalizada 2026-09-01: o
                          link pra fonte oficial (museu/Wikidata que
                          confirma essa localização) mora AO LADO de
                          "Onde ver", não solto no fim da página — é a
                          mesma informação, essa é a referência que
                          sustenta aquela. Só aparece quando existe (fonte
                          curatorial, não toda obra tem uma verificada).
                          Virou badge clicável em vez de "(fonte oficial)"
                          em parênteses dentro do texto (achado 2026-09-01,
                          Rilson: parênteses coladas na prosa não
                          pareciam a melhor forma) — pedido aprovado pelo
                          Rilson: "Saiba mais" + ícone, em badge. */}
                      {artwork.sourceUrl && (
                        <>
                          {' '}
                          <a
                            href={artwork.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block align-middle"
                          >
                            <Badge
                              variant="outline"
                              className="gap-1 px-2 py-0.5 text-[10px] text-muted-foreground border-border hover:border-primary hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Saiba mais
                            </Badge>
                          </a>
                        </>
                      )}
                    </span>
                  </div>
                )}

                {/* Fallback raro: fonte oficial existe mas não tem
                    `location` pra ancorar do lado (obra sem localização
                    física registrada) — não deixa a fonte desaparecer. */}
                {!artwork.location && artwork.sourceUrl && (
                  <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-2">
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                      <ExternalLink className="w-4 h-4 text-primary" />
                      <span>Fonte oficial:</span>
                    </div>
                    <a href={artwork.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <Badge
                        variant="outline"
                        className="gap-1 px-2 py-0.5 text-[10px] text-muted-foreground border-border hover:border-primary hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        Saiba mais
                      </Badge>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-display text-xl font-semibold">Sobre esta Obra</h2>
                {artwork.description && (
                  <CopyButton
                    text={stripMarkdown(artwork.description)}
                    label="Copiar descrição"
                    className="shrink-0"
                  />
                )}
              </div>
              <div className="capitular text-foreground/90 text-base leading-relaxed">
                <Markdown content={artwork.description} />
              </div>
            </div>

            {/* "Vozes dos clássicos" (2026-08-23) — raro de propósito, só
                aparece onde a curadoria já confirmou fonte verificada de
                Rookmaaker/Schaeffer/Lewis comentando ESTA obra específica. */}
            {artwork.classicCommentary && (
              <div className="border-l-4 rounded-r-xl bg-muted/30 p-5" style={{ borderColor: 'var(--dourado)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="w-4 h-4 shrink-0" style={{ color: 'var(--dourado)' }} />
                  <h2 className="text-display text-lg font-semibold">
                    Na leitura de {artwork.classicCommentaryAuthor}
                  </h2>
                </div>
                <div className="text-foreground/90 text-sm leading-relaxed">
                  <Markdown content={artwork.classicCommentary} />
                </div>
              </div>
            )}

            {/* License and Attribution */}
            {artwork.attributionText && (
              <div className="flex items-start space-x-3 text-xs text-muted-foreground bg-muted/40 border border-border/60 rounded-xl p-3.5">
                <Info className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Direitos e Atribuição</p>
                  <p className="leading-snug">{artwork.attributionText}</p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Biblical References Section */}
        {artwork.references.length > 0 && (
          <Card className="border border-border/70 bg-card mb-12 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-display text-xl md:text-2xl">
                  Passagens Bíblicas Relacionadas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* 1 referência não vira grid de 2 colunas com metade vazia
                  (achado 2026-09-01) — a maioria das obras do acervo tem
                  só 1 passagem, e o card sozinho colado à esquerda com
                  espaço morto do lado direito lia como quebrado, não como
                  "design intencional". Com 1 só, o card ocupa a largura
                  toda; com 2+, mantém o grid de duas colunas de antes. */}
              <div className={cn('grid gap-4', artwork.references.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
                {artwork.references.map((ref, index) => (
                  <Card key={index} className="border border-border/60 bg-background/80 flex flex-col justify-between hover:border-accent/50 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/biblia/${ref.bookSlug}/${ref.chapter}`}
                          className="font-display text-lg font-semibold text-primary hover:underline"
                        >
                          {ref.book} {ref.chapter}
                          {ref.verses && `:${ref.verses}`}
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          Capítulo {ref.chapter}
                        </Badge>
                      </div>

                      {ref.passageText && (
                        <div className="pt-2 border-t border-border/40 text-sm md:text-base text-foreground/90 font-serif leading-relaxed bg-muted/20 p-3 rounded-lg">
                          <Markdown content={ref.passageText} />
                        </div>
                      )}

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-1">
                        {/* Achado 2026-09-01: hover:text-primary sozinho
                            some em cima do hover:bg-accent padrão do ghost
                            no tema escuro (dourado sobre dourado) — mesmo
                            fix do CopyButton. */}
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2 hover:bg-primary/10 hover:text-primary">
                          <Link to={`/biblia/${ref.bookSlug}/${ref.chapter}`}>
                            Ler capítulo completo e ver outras obras →
                          </Link>
                        </Button>
                        {/* Link de descoberta pro hub /explorar (roadmap
                            2026-09-02). Rótulo "Explorar conexões" (decisão
                            2026-09-02) — hub de conexões da passagem, não
                            mapa geográfico. */}
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2 hover:bg-primary/10 hover:text-primary">
                          <Link to={`/explorar/${ref.bookSlug}/${ref.chapter}`}>
                            <Network className="w-3 h-3 mr-1.5" />
                            Explorar conexões
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anúncio — único slot da página, numa quebra natural de conteúdo
            (depois das referências, antes das obras relacionadas), nunca
            dentro do texto de descrição/citação.
            Achado 2026-09-01: o slot antigo (4884773751) não batia com
            NENHUMA das 3 unidades manuais cadastradas no AdSense
            (SD-Ficha/SD-Catálogo/SD-Home) — provavelmente sobra de uma
            unidade já apagada. Trocado pro slot real de "SD-Ficha"
            (5170899723), nome que corresponde exatamente a esta página
            ("ficha da obra" é como o resto do código já chama essa tela).
            SD-Catálogo e SD-Home existem no AdSense mas ainda não têm
            nenhum <AdUnit> no código — ficam disponíveis pra Search/
            ArtCategories e Index quando fizer sentido adicionar. */}
        <div className="mb-12">
          <AdUnit slot="5170899723" />
        </div>

        {/* Related Artworks Section */}
        {relatedArtworks.length > 0 && (
          <section className="mb-12">
            {/* Empilha no mobile em vez de espremer título+legenda contra o
                botão (achado 2026-09-01: "Obras Relacionadas" quebrava em
                2 linhas e a legenda em 3, tudo apertado num terço da tela
                pra caber o botão do lado). */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-display text-2xl font-bold">Obras Relacionadas</h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Explore outras representações desta passagem ou do mesmo mestre da arte
                </p>
              </div>
              {firstRef && (
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                  <Link to={`/biblia/${firstRef.bookSlug}/${firstRef.chapter}`}>
                    Ver todas do capítulo
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedArtworks.map((related) => (
                <ArtworkCard key={related.id} artwork={related} showReferences={false} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Lightbox Modal */}
      <ArtworkLightbox
        artwork={artwork}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      <Footer />
    </div>
  );
}