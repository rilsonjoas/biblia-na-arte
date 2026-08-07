import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArtworkCard from '@/components/ArtworkCard';
import { LoadingGrid, Loading } from '@/components/ui/loading';
import { ErrorCard } from '@/components/ui/error-display';
import { 
  Search as SearchIcon, 
  Filter, 
  BookOpen, 
  Palette, 
  Music, 
  Film, 
  Calendar,
  User,
  Tag,
  RefreshCcw
} from 'lucide-react';
import { useArtworkSearchAdvanced, useArtworks } from '@/hooks/use-artworks';
import { useBibleBooks } from '@/hooks/use-bible-books';
import { Artwork, ArtworkCategory } from '@/types';
import type { SearchFilters } from '@/lib/api-data';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros avançados
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTestament, setSelectedTestament] = useState<string>('');
  const [selectedCentury, setSelectedCentury] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<string>('');

  // Hooks para dados
  const { data: allArtworks = [] } = useArtworks();
  const { data: bibleBooks = [] } = useBibleBooks();
  
  // Build search filters
  const searchFilters: SearchFilters = {
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedTestament && { testament: selectedTestament as 'old' | 'new' }),
    ...(selectedArtist && { artist: selectedArtist }),
  };

  // Search hook
  const { 
    data: searchResults = [], 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useArtworkSearchAdvanced(query, searchFilters);

  const categories = [
    { value: 'painting', label: 'Pinturas', icon: Palette },
    { value: 'music', label: 'Músicas', icon: Music },
    { value: 'film', label: 'Filmes', icon: Film }
  ];

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

  // Obter lista única de artistas dos dados carregados
  const artists = Array.from(new Set(allArtworks.map(artwork => artwork.artistOrDirector))).sort();

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery && searchQuery !== query) {
      setQuery(searchQuery);
    }
  }, [searchParams]);

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
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <SearchIcon className="w-4 h-4 mr-2" />
            Pesquisa Avançada
          </Badge>
          
          <h1 className="text-display text-3xl md:text-4xl font-bold mb-6">
            Encontre Obras de Arte Bíblica
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Use nossa ferramenta de pesquisa avançada para descobrir obras específicas, 
            filtrar por categoria, período histórico ou referência bíblica.
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
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Testamento</label>
                  <Select value={selectedTestament} onValueChange={setSelectedTestament}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os testamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os testamentos</SelectItem>
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
                  <Select value={selectedCentury} onValueChange={setSelectedCentury}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os períodos</SelectItem>
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
                  <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os artistas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os artistas</SelectItem>
                      {artists.map(artist => (
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
        {query && (
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
                    Resultados para "{query}" 
                    <Badge variant="secondary" className="ml-2">
                      {searchResults.length} {searchResults.length === 1 ? 'obra encontrada' : 'obras encontradas'}
                    </Badge>
                  </>
                )}
              </h2>
              
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategory && (
                    <Badge variant="outline">
                      <Palette className="w-3 h-3 mr-1" />
                      {categories.find(c => c.value === selectedCategory)?.label}
                    </Badge>
                  )}
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
              <LoadingGrid count={6} />
            ) : isError ? (
              <ErrorCard 
                error={error} 
                onRetry={refetch}
                title="Erro na busca" 
                className="mb-8"
              />
            ) : searchResults.length === 0 && query ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {searchResults.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} />
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Search Tips */}
        {!query && (
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