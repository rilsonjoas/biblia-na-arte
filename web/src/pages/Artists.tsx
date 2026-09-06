import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LoadingGrid } from '@/components/ui/loading';
import { ErrorCard } from '@/components/ui/error-display';
import { useArtists } from '@/hooks/use-artworks';
import { Palette, Search as SearchIcon, X } from 'lucide-react';
import { slugifyArtistName, normalizeForSearch } from '@/lib/utils';

/** Diretório de pintores (roadmap, pedido do Rilson 2026-09-05) —
 *  faltava um jeito de navegar do "quero ver quem pintou" sem passar
 *  por uma obra específica primeiro. `/artista/:slug` já existia,
 *  só não tinha índice nenhum apontando pra lá. Mesmo padrão de
 *  BibleBooks.tsx: grade compacta + filtro por nome, ordem alfabética
 *  (é um diretório, não um ranking). */
export default function Artists() {
  const [nameFilter, setNameFilter] = useState('');
  const { data: artists = [], isLoading, isError, error, refetch } = useArtists();

  const normalizedFilter = normalizeForSearch(nameFilter.trim());
  const sorted = [...artists].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const filtered = normalizedFilter
    ? sorted.filter((a) => normalizeForSearch(a.name).includes(normalizedFilter))
    : sorted;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pintores"
        description={`Navegue por ${artists.length || 'todos os'} pintores cujas obras inspiradas na Bíblia fazem parte do acervo.`}
      />
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <Palette className="w-4 h-4 mr-2" />
            Diretório de Artistas
          </Badge>

          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Pintores
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {artists.length > 0
              ? `${artists.length} pintores com obras no acervo, de mestres renascentistas a artistas contemporâneos.`
              : 'Navegue pelos pintores com obras no acervo.'}
          </p>

          <div className="max-w-md mx-auto text-left">
            <label htmlFor="artist-name-filter" className="text-sm font-medium mb-2 block">
              Filtrar pintor por nome
            </label>
            <div className="relative">
              <SearchIcon
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4"
                aria-hidden="true"
              />
              <Input
                id="artist-name-filter"
                placeholder="Ex.: Rembrandt, Caravaggio..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-10 pr-10 h-11"
                aria-describedby="artist-name-filter-status"
              />
              {nameFilter && (
                <button
                  type="button"
                  onClick={() => setNameFilter('')}
                  aria-label="Limpar filtro por nome"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p
              id="artist-name-filter-status"
              role="status"
              aria-live="polite"
              className="text-xs text-muted-foreground mt-2 min-h-[1em]"
            >
              {normalizedFilter
                ? `${filtered.length} ${filtered.length === 1 ? 'pintor encontrado' : 'pintores encontrados'}`
                : ''}
            </p>
          </div>
        </div>

        {isLoading && <LoadingGrid count={12} />}

        {isError && !isLoading && (
          <ErrorCard error={error} onRetry={refetch} title="Erro ao carregar pintores" />
        )}

        {!isLoading && !isError && (
          <>
            {normalizedFilter && filtered.length === 0 && (
              <Card className="gradient-card border border-border/60 text-center py-12">
                <CardContent>
                  <SearchIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum pintor encontrado para "{nameFilter.trim()}".
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filtered.map((artist) => (
                <Card
                  key={artist.name}
                  className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border border-border/60 hover:border-accent/40"
                >
                  <Link to={`/artista/${slugifyArtistName(artist.name)}`} className="block">
                    <CardHeader className="text-center p-2.5 sm:p-3 pb-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto gradient-hero rounded-lg flex items-center justify-center mb-2 group-hover:shadow-golden transition-all duration-300">
                        <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <CardTitle className="text-display text-sm sm:text-base font-semibold group-hover:text-primary transition-colors leading-tight">
                        {artist.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 pt-0 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {artist.artworkCount} {artist.artworkCount === 1 ? 'obra' : 'obras'}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
