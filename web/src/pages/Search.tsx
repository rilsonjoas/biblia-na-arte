import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
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
  ChevronRight,
  X
} from 'lucide-react';
import { useArtworkSearchAdvanced, useArtists, useThemes, usePeriods } from '@/hooks/use-artworks';
import { useBibleBooks } from '@/hooks/use-bible-books';
import type { SearchFilters } from '@/lib/api-data';
import { CATEGORIES, getCategoryMeta } from '@/lib/categories';
import { toRomanNumeral, toRomanBookName, sortByTitleAz } from '@/lib/utils';

const PAGE_SIZE = 24;

// "Século XVII" = anos 1600-1699 (intuição de busca por década inicial,
// não a convenção estrita 1601-1700 usada por historiadores) — mesma
// convenção usada em `listPeriods()` no backend (server/src/db/queries.ts),
// então o número de século que vem de `/periods` mapeia direto pra um
// intervalo aqui, sem precisar de tabela: século N = anos [(N-1)*100,
// (N-1)*100+99].
//
// Achado 2026-09-02 (Rilson): a lista de séculos aqui era hardcoded (só
// IX/XV/XVI/XVII/XVIII) e tinha ficado obsoleta — faltavam IV, XII-XIV,
// XIX (quase metade do acervo, todo o Doré), XX e XXI, e "século IX" não
// tinha nenhuma obra. Agora a lista de opções vem de `usePeriods()`
// (calculada ao vivo no backend), só o cálculo do intervalo fica aqui.
function centuryToRange(century: number): { from: number; to: number } {
  const from = (century - 1) * 100;
  return { from, to: from + 99 };
}

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
  // Multiselect de livro (achado 2026-09-02, Rilson: substitui o antigo
  // Select de Testamento — livro já informa o testamento, e é bem mais
  // útil pra filtrar). Mesma semântica "ou" de Artista/Tema.
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [selectedCentury, setSelectedCentury] = useState<string>('');
  // Multiselect (roadmap 2026-09-01, pedido do Rilson) — "ou" entre os
  // artistas escolhidos, "e" com os outros filtros. Ver MultiSelect em
  // components/ui/multi-select.tsx.
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  // Multiselect de tema (roadmap, Passo 3, 2026-09-02) — mesma semântica.
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  // Ordenação alfabética (pedido 2026-09-14, Rilson) — a página de
  // pinturas buscava tudo e paginava no cliente, mas sem controle de
  // ordenação (vinha sempre "mais recentes" do server). Mesmo padrão de
  // toggle da estante (BibleBooks.tsx): "Mais Recentes" preserva o
  // comportamento de hoje, "A–Z" ordena por título.
  const [sortBy, setSortBy] = useState<'recent' | 'az'>('recent');

  // Hooks para dados
  const { data: artists = [] } = useArtists();
  const { data: themes = [] } = useThemes();
  const { data: periods = [] } = usePeriods();
  const { data: bibleBooks = [] } = useBibleBooks();

  // Build search filters
  const centuryRange = selectedCentury ? centuryToRange(Number(selectedCentury)) : undefined;
  const searchFilters: SearchFilters = {
    ...(selectedCategory && { category: selectedCategory }),
    ...(selectedBooks.length > 0 && { books: selectedBooks }),
    ...(selectedArtists.length > 0 && { artists: selectedArtists }),
    ...(selectedThemes.length > 0 && { themes: selectedThemes }),
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

  // Ordenação alfabética (pedido 2026-09-14, Rilson): "Mais Recentes"
  // preserva a ordem do server (padrão de sempre); "A–Z" ordena por
  // título no cliente via sortByTitleAz (não muta o array do hook).
  const sortedResults = sortBy === 'az' ? sortByTitleAz(searchResults) : searchResults;

  // Lista de séculos vem de /periods (ao vivo, ver `usePeriods` acima) —
  // já chega ordenada cronologicamente do backend; só falta o rótulo em
  // algarismo romano.
  const centuries = periods.map((period) => ({
    value: String(period.century),
    label: `Século ${toRomanNumeral(period.century)}`,
  }));

  // Livro (achado 2026-09-02: substitui Testamento) — só livros com obra
  // de verdade aparecem aqui, mesmo princípio de honestidade já aplicado
  // em Categoria (`hasContent`, ver categories.ts): um filtro que lista
  // opção sem nenhum resultado possível é promessa vazia.
  const bookOptions = bibleBooks
    .filter((book) => book.artworkCount > 0)
    .map((book) => ({ value: book.slug, label: toRomanBookName(book.name) }));

  // Obter lista única de artistas do endpoint agregado (não baixa o
  // catálogo inteiro só pra extrair nomes)
  const artistNames = artists.map(artist => artist.name);
  // Temas já vêm ordenados por frequência do /themes (mesma lógica do
  // roadmap: os mais citados aparecem primeiro na busca do combobox).
  const themeOptions = themes.map((theme) => ({ value: theme.slug, label: theme.name }));

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
  }, [query, selectedCategory, selectedBooks, selectedCentury, selectedArtists, selectedThemes, sortBy]);

  const handleSearch = () => {
    if (query.trim()) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBooks([]);
    setSelectedCentury('');
    setSelectedArtists([]);
    setSelectedThemes([]);
  };

  const hasActiveFilters =
    selectedCategory || selectedBooks.length > 0 || selectedCentury || selectedArtists.length > 0 || selectedThemes.length > 0;

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
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar obra, artista, livro bíblico ou tema..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-11 text-base w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={handleSearch} 
                  size="lg"
                  className="flex-1 sm:flex-none px-6 h-11 shadow-classical"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <SearchIcon className="w-4 h-4 mr-2" />
                  )}
                  Buscar
                </Button>
                <Button 
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="lg"
                  className="flex-1 sm:flex-none px-4 h-11"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                {/* Ordenação alfabética (pedido 2026-09-14, Rilson) —
                    mesmo padrão de toggle da estante (BibleBooks.tsx).
                    "Mais Recentes" é o comportamento de sempre (ordem do
                    servidor); "A–Z" ordena por título no cliente, já que
                    o acervo todo já vem carregado aqui. */}
                <div className="inline-flex rounded-md shadow-card border border-border p-1 bg-muted/40 h-11">
                  <button
                    type="button"
                    onClick={() => setSortBy('recent')}
                    aria-pressed={sortBy === 'recent'}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${sortBy === 'recent' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Mais Recentes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('az')}
                    aria-pressed={sortBy === 'az'}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${sortBy === 'az' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    A–Z
                  </button>
                </div>
              </div>
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
              {/* xl:grid-cols-5 pra caber Categoria/Livro/Período/
                  Artista/Tema numa linha só em telas grandes — em telas
                  médias (lg) 3 colunas evita cada caixa ficar apertada
                  demais só pra forçar as 5 numa linha (achado 2026-09-02,
                  ao adicionar o filtro de tema). */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {/* Achado 2026-09-02 (Rilson): "Músicas"/"Filmes" não
                          tinham nenhuma obra ainda — oferecer como opção
                          igual às outras, sem indicar isso, lia como
                          promessa vazia. `/arte` continua mostrando as 3
                          com "✦ Em breve" honesto; aqui só entra categoria
                          com conteúdo de verdade (ver `hasContent` em
                          categories.ts). */}
                      {CATEGORIES.filter((category) => category.hasContent).map(category => (
                        <SelectItem key={category.slug} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Livro</label>
                  <MultiSelect
                    options={bookOptions}
                    selected={selectedBooks}
                    onChange={setSelectedBooks}
                    placeholder="Todos os livros"
                    searchPlaceholder="Buscar livro..."
                    emptyText="Nenhum livro encontrado."
                  />
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
                  <MultiSelect
                    options={artistNames.map((artist) => ({ value: artist, label: artist }))}
                    selected={selectedArtists}
                    onChange={setSelectedArtists}
                    placeholder="Todos os artistas"
                    searchPlaceholder="Buscar artista..."
                    emptyText="Nenhum artista encontrado."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tema</label>
                  <MultiSelect
                    options={themeOptions}
                    selected={selectedThemes}
                    onChange={setSelectedThemes}
                    placeholder="Todos os temas"
                    searchPlaceholder="Buscar tema..."
                    emptyText="Nenhum tema encontrado."
                  />
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
                  {/* 1 badge removível por livro selecionado — mesmo padrão
                      de Artista/Tema abaixo. */}
                  {selectedBooks.map((slug) => {
                    const label = bookOptions.find((b) => b.value === slug)?.label ?? slug;
                    return (
                      <Badge key={slug} variant="outline" className="gap-1 pr-1">
                        <BookOpen className="w-3 h-3" />
                        {label}
                        <button
                          type="button"
                          onClick={() => setSelectedBooks((prev) => prev.filter((s) => s !== slug))}
                          aria-label={`Remover filtro de livro: ${label}`}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                  {selectedCentury && (
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      {centuries.find(c => c.value === selectedCentury)?.label}
                    </Badge>
                  )}
                  {/* 1 badge removível por artista selecionado — melhor que
                      um badge só "N artistas" pra quem quer tirar 1 sem
                      reabrir o combobox e desmarcar na mão. */}
                  {selectedArtists.map((artist) => (
                    <Badge key={artist} variant="outline" className="gap-1 pr-1">
                      <User className="w-3 h-3" />
                      {artist}
                      <button
                        type="button"
                        onClick={() => setSelectedArtists((prev) => prev.filter((a) => a !== artist))}
                        aria-label={`Remover filtro de artista: ${artist}`}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedThemes.map((slug) => {
                    const label = themeOptions.find((t) => t.value === slug)?.label ?? slug;
                    return (
                      <Badge key={slug} variant="outline" className="gap-1 pr-1">
                        <Tag className="w-3 h-3" />
                        {label}
                        <button
                          type="button"
                          onClick={() => setSelectedThemes((prev) => prev.filter((s) => s !== slug))}
                          aria-label={`Remover filtro de tema: ${label}`}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
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
                    {/* Mesmo achado do Index.tsx (2026-09-11, Rilson):
                        "Ver Todas as Obras" promete obras, não um menu
                        de categorias com "em breve" à mostra. */}
                    <Button asChild>
                      <Link to="/arte/painting">Ver Todas as Obras</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : searchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                  {sortedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {Math.ceil(sortedResults.length / PAGE_SIZE) > 1 && (
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
                      Página <strong className="text-foreground">{page}</strong> de {Math.ceil(sortedResults.length / PAGE_SIZE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPage((p) => Math.min(p + 1, Math.ceil(sortedResults.length / PAGE_SIZE)));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page >= Math.ceil(sortedResults.length / PAGE_SIZE)}
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