import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard, { ArtworkCardSkeleton } from '@/components/ArtworkCard';
import { SEO } from '@/components/SEO';
import { ErrorCard } from '@/components/ui/error-display';
import {
  Search as SearchIcon,
  Filter,
  BookOpen,
  Palette,
  Calendar,
  User,
  Tag,
  RefreshCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useArtworkSearchAdvanced, useArtists } from '@/hooks/use-artworks';
import type { SearchFilters } from '@/lib/api-data';
import { CATEGORIES, getCategoryMeta } from '@/lib/categories';

const PAGE_SIZE = 24;

// "Século XVII" = anos 1600-1699 (intuição de busca por década inicial,
// não a convenção estrita 1601-1700 usada por historiadores).
const CENTURY_RANGES: Record<string, { from: number; to: number }> = {
  '9th': { from: 800, to: 899 },
  '15th': { from: 1400, to: 1499 },
  '16th': { from: 1500, to: 1599 },
  '17th': { from: 1600, to: 1699 },
  '18th': { from: 1700, to: 1799 }
};

export default function Search() {
  // `category` só vem preenchido quando a rota é `/arte/:category` — em
  // `/busca` fica undefined. Mesmo componente atende as duas rotas
  // (achado 2026-08-23: unificar código sem mudar URL indexada).
  const { category: categoryParam } = useParams<{ category?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Filtros avançados
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || '');
  const [selectedTestament, setSelectedTestament] = useState<string>('');
  const [selectedCentury, setSelectedCentury] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<string>('');

  // Hooks para dados
  const { data: artists = [] } = useArtists();

  // Build search filters
  const centuryRange = selectedCentury ? CENTURY_RANGES[selectedCentury] : undefined;
  const searchFilters: SearchFilters = {
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedTestament && { testament: selectedTestament as 'old' | 'new' }),
    ...(selectedArtist && { artist: selectedArtist }),
    ...(centuryRange && { yearFrom: centuryRange.from, yearTo: centuryRange.to }),
  };

  // Search hook
  const { 
    data: searchResults = [], 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useArtworkSearchAdvanced(query, searchFilters);

  const currentCategory = getCategoryMeta(categoryParam);

  const testaments = [
    { value: 'old', label: 'Antigo Testamento' },
    { value: 'new', label: 'Novo Testamento' }
  ];

  const centuries = [
    { value: '9th', label: 'Século IX' },
    { value: '15th', label: 'Século XV' },
    { value: '16th', label: 'Século XVI' },
    { value: '17th', label: 'Século XVII' },
    { value: '18th', label: 'Século XVIII' }
  ];

  // Obter lista única de artistas do endpoint agregado (não baixa o
  // catálogo inteiro só pra extrair nomes)
  const artistNames = artists.map(artist => artist.name);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery && searchQuery !== query) {
      setQuery(searchQuery);
    }
  }, [searchParams]);

  // Sincroniza quando o param de rota muda entre navegações dentro do
  // mesmo componente (ex.: /arte/painting -> /arte/music sem remount).
  useEffect(() => {
    setSelectedCategory(categoryParam || '');
  }, [categoryParam]);

  // Trocar busca ou qualquer filtro volta pra página 1 — senão a
  // paginação antiga cai fora do alcance do resultado novo (grade vazia)
  useEffect(() => {
    setPage(1);
  }, [query, selectedCategory, selectedTestament, selectedCentury, selectedArtist]);

  const handleSearch = () => {
    if (query.trim()) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTestament('');
    setSelectedCentury('');
    setSelectedArtist('');
  };

  const hasActiveFilters = selectedCategory || selectedTestament || selectedCentury || selectedArtist;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={
          currentCategory
            ? `${currentCategory.name} Inspiradas na Bíblia`
            : query
              ? `Busca: "${query}"`
              : 'Busca Avançada de Obras de Arte Bíblica'
        }
        description={
          currentCategory
            ? currentCategory.description
            : 'Pesquise pinturas, músicas e arte sacra inspiradas na Bíblia por tema, artista, período histórico ou referências bíblicas.'
        }
      />
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <SearchIcon className="w-4 h-4 mr-2" />
            {currentCategory ? currentCategory.name : 'Pesquisa Avançada'}
          </Badge>

          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
            {currentCategory ? `${currentCategory.name} Inspiradas na Bíblia` : 'Encontre Obras de Arte Bíblica'}
          </h1>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {currentCategory
              ? currentCategory.description
              : 'Use nossa ferramenta de pesquisa avançada para descobrir obras específicas, filtrar por categoria, período histórico ou referência bíblica.'}
          </p>
        </div>

        {/* Search Bar */}
        <Card className="gradient-card border-0 mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Digite o nome da obra, artista, livro bíblico ou tema..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                size="lg"
                className="px-8 shadow-classical"
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <SearchIcon className="w-5 h-5 mr-2" />
                )}
                Buscar
              </Button>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="gradient-card border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtros Avançados
                </span>
                {hasActiveFilters && (
                  <Button 
                    onClick={clearFilters}
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCcw className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category.slug} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Testamento</label>
                  <Select value={selectedTestament || 'all'} onValueChange={(v) => setSelectedTestament(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os testamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os testamentos</SelectItem>
                      {testaments.map(testament => (
                        <SelectItem key={testament.value} value={testament.value}>
                          {testament.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select value={selectedCentury || 'all'} onValueChange={(v) => setSelectedCentury(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      {centuries.map(century => (
                        <SelectItem key={century.value} value={century.value}>
                          {century.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Artista</label>
                  <Select value={selectedArtist || 'all'} onValueChange={(v) => setSelectedArtist(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os artistas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os artistas</SelectItem>
                      {artistNames.map(artist => (
                        <SelectItem key={artist} value={artist}>
                          {artist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {(query.trim() || hasActiveFilters) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-xl font-semibold">
                {isLoading ? (
                  <span className="flex items-center">
                    <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                    Buscando...
                  </span>
                ) : (
                  <>
                    {query.trim() ? `Resultados para "${query}"` : 'Resultados filtrados'}
                    <Badge variant="secondary" className="ml-2">
                      {searchResults.length} {searchResults.length === 1 ? 'obra encontrada' : 'obras encontradas'}
                    </Badge>
                  </>
                )}
              </h2>
              
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategory && (() => {
                    const meta = getCategoryMeta(selectedCategory);
                    const CategoryIcon = meta?.icon ?? Palette;
                    return (
                      <Badge variant="outline">
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {meta?.name}
                      </Badge>
                    );
                  })()}
                  {selectedTestament && (
                    <Badge variant="outline">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {testaments.find(t => t.value === selectedTestament)?.label}
                    </Badge>
                  )}
                  {selectedCentury && (
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      {centuries.find(c => c.value === selectedCentury)?.label}
                    </Badge>
                  )}
                  {selectedArtist && (
                    <Badge variant="outline">
                      <User className="w-3 h-3 mr-1" />
                      {selectedArtist}
                    </Badge>
                  )}
                </div>
              )}
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
                title="Erro na busca" 
                className="mb-8"
              />
            ) : searchResults.length === 0 ? (
              <Card className="gradient-card border-0">
                <CardContent className="p-12 text-center">
                  <SearchIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhuma obra encontrada</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Tente usar termos diferentes ou remover alguns filtros para expandir sua pesquisa.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={clearFilters} variant="outline">
                      Limpar Filtros
                    </Button>
                    <Button asChild>
                      <Link to="/arte">Ver Todas as Obras</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : searchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                  {searchResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {Math.ceil(searchResults.length / PAGE_SIZE) > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPage((p) => Math.max(p - 1, 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page === 1}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página <strong className="text-foreground">{page}</strong> de {Math.ceil(searchResults.length / PAGE_SIZE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPage((p) => Math.min(p + 1, Math.ceil(searchResults.length / PAGE_SIZE)));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page >= Math.ceil(searchResults.length / PAGE_SIZE)}
                      className="gap-1"
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Search Tips */}
        {!query.trim() && !hasActiveFilters && (
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="text-center">
                <SearchIcon className="w-8 h-8 mx-auto mb-2" />
                Dicas de Pesquisa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                    <Tag className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="font-semibold mb-2">Por Tema</h4>
                  <p className="text-sm text-muted-foreground">
                    Tente "criação", "ressurreição", "última ceia"
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                    <User className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="font-semibold mb-2">Por Artista</h4>
                  <p className="text-sm text-muted-foreground">
                    "Michelangelo", "Da Vinci", "Bach"
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="font-semibold mb-2">Por Livro Bíblico</h4>
                  <p className="text-sm text-muted-foreground">
                    "Gênesis", "Mateus", "Apocalipse"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}