import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LoadingGrid, Loading } from '@/components/ui/loading';
import { ErrorCard } from '@/components/ui/error-display';
import { useOldTestamentBooks, useNewTestamentBooks } from '@/hooks/use-bible-books';
import { Book, BookOpen, Search as SearchIcon, X } from 'lucide-react';
import { toRomanBookName, normalizeForSearch } from '@/lib/utils';

export default function BibleBooks() {
  const [searchParams] = useSearchParams();
  const testament = searchParams.get('testament');
  const [nameFilter, setNameFilter] = useState('');

  // Bug real achado 2026-09-11 (Rilson: "Navegar pela Bíblia" carregando
  // de forma inconsistente): esta página buscava os 3 conjuntos (todos/
  // AT/NT) em TODA visita, mesmo sem filtro nenhum ativo — 3 requisições
  // concorrentes ao mesmo endpoint quando no máximo 2 são realmente
  // usadas (com filtro, só 1; sem filtro, AT+NT juntos já cobrem tudo,
  // "todos" nunca era exibido, só usado como flag de loading). Cada
  // hook agora só busca quando a visão atual realmente precisa dele.
  const needsOld = !testament || testament === 'old';
  const needsNew = !testament || testament === 'new';
  const { data: oldTestamentBooksRaw = [], isLoading: oldLoading, isError: oldError, error: oldErrorData, refetch: refetchOld } = useOldTestamentBooks({ enabled: needsOld });
  const { data: newTestamentBooksRaw = [], isLoading: newLoading, isError: newError, error: newErrorData, refetch: refetchNew } = useNewTestamentBooks({ enabled: needsNew });

  // Filtro por nome (pedido do Rilson 2026-09-01, "o mais profissional e
  // acessível possível pra usuários com dificuldade"): ordem alfabética
  // foi descartada de propósito — quebraria a ordem canônica que ajuda
  // quem já conhece a sequência bíblica de cor. Filtro por nome serve os
  // dois públicos (quem lembra o nome exato E quem só lembra um pedaço)
  // sem exigir digitar acento certo (normalizeForSearch ignora acento/caixa).
  const normalizedFilter = normalizeForSearch(nameFilter.trim());
  const oldTestamentBooks = normalizedFilter
    ? oldTestamentBooksRaw.filter((b) => normalizeForSearch(b.name).includes(normalizedFilter))
    : oldTestamentBooksRaw;
  const newTestamentBooks = normalizedFilter
    ? newTestamentBooksRaw.filter((b) => normalizeForSearch(b.name).includes(normalizedFilter))
    : newTestamentBooksRaw;
  const totalFilteredCount = oldTestamentBooks.length + newTestamentBooks.length;

  const getTitle = () => {
    if (testament === 'old') return 'Antigo Testamento';
    if (testament === 'new') return 'Novo Testamento';
    return 'Livros da Bíblia';
  };

  const getDescription = () => {
    if (testament === 'old') return 'Explore as obras de arte inspiradas nos livros do Antigo Testamento, de Gênesis a Malaquias.';
    if (testament === 'new') return 'Descubra as interpretações artísticas dos livros do Novo Testamento, de Mateus a Apocalipse.';
    return 'Navegue pelos 66 livros da Bíblia e descubra as obras de arte que cada um inspirou ao longo da história.';
  };

  // Handle loading and error states — sem filtro, precisa dos dois
  // (AT+NT) carregados antes de mostrar qualquer seção; com filtro, só
  // o lado pedido importa.
  const isLoading = testament === 'old' ? oldLoading : testament === 'new' ? newLoading : oldLoading || newLoading;
  const isError = testament === 'old' ? oldError : testament === 'new' ? newError : oldError || newError;
  const errorData = testament === 'old' ? oldErrorData : testament === 'new' ? newErrorData : (oldErrorData ?? newErrorData);
  const refetch = testament === 'old' ? refetchOld : testament === 'new' ? refetchNew : () => { refetchOld(); refetchNew(); };

  return (
    <div className="min-h-screen bg-background">
      {/* Sem <SEO>, a aba ficava com o título da última página com SEO
          visitada (document.title não reseta ao trocar de rota na SPA) —
          achado real 2026-08-22. */}
      <SEO title={getTitle()} description={getDescription()} />
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="w-4 h-4 mr-2" />
            Navegação Bíblica
          </Badge>
          
          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {getTitle()}
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            {getDescription()}
          </p>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              asChild 
              variant={!testament ? "default" : "outline"}
              className="shadow-card"
            >
              <Link to="/biblia">Todos os Livros</Link>
            </Button>
            <Button 
              asChild 
              variant={testament === 'old' ? "default" : "outline"}
              className="shadow-card"
            >
              <Link to="/biblia?testament=old">Antigo Testamento</Link>
            </Button>
            <Button 
              asChild 
              variant={testament === 'new' ? "default" : "outline"}
              className="shadow-card"
            >
              <Link to="/biblia?testament=new">Novo Testamento</Link>
            </Button>
          </div>

          {/* Filtro por nome — ver comentário acima sobre por que não é
              ordenação alfabética. Label visível (não só placeholder,
              que some ao digitar e não é substituto de rótulo pra leitor
              de tela) + aria-live anunciando quantos livros bateram, pra
              quem usa teclado/leitor de tela saber o resultado sem
              precisar "ver" a grade mudar. */}
          <div className="max-w-md mx-auto mt-6 text-left">
            <label htmlFor="book-name-filter" className="text-sm font-medium mb-2 block">
              Filtrar livro por nome
            </label>
            <div className="relative">
              <SearchIcon
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4"
                aria-hidden="true"
              />
              <Input
                id="book-name-filter"
                placeholder="Ex.: João, Salmos, Apocalipse..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-10 pr-10 h-11"
                aria-describedby="book-name-filter-status"
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
              id="book-name-filter-status"
              role="status"
              aria-live="polite"
              className="text-xs text-muted-foreground mt-2 min-h-[1em]"
            >
              {normalizedFilter
                ? `${totalFilteredCount} ${totalFilteredCount === 1 ? 'livro encontrado' : 'livros encontrados'}`
                : ''}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            <div className="text-center">
              <Loading text="Carregando livros bíblicos..." />
            </div>
            <LoadingGrid count={12} />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <ErrorCard 
            error={errorData} 
            onRetry={refetch}
            title="Erro ao carregar livros bíblicos"
          />
        )}

        {/* Content - Only show when not loading and no error */}
        {!isLoading && !isError && (
          <>
            {/* Estado vazio do filtro — sem isso, filtrar por algo que não
                bate em nenhum livro (ex.: erro de digitação) deixava a
                página em branco, sem explicar por quê nem como sair. */}
            {normalizedFilter && totalFilteredCount === 0 && (
              <Card className="gradient-card border border-border/60 text-center py-12 mb-12">
                <CardContent>
                  <SearchIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum livro encontrado para "{nameFilter.trim()}".
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setNameFilter('')}>
                    Limpar filtro
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Old Testament Section */}
            {(!testament || testament === 'old') && oldTestamentBooks.length > 0 && (
              <div className="mb-12 sm:mb-16">
                <h2 className="text-display text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
                  Antigo Testamento
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {oldTestamentBooks.map((book) => (
                    <Card key={book.slug} className="group relative overflow-hidden hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border border-border/60 hover:border-accent/40">
                      {/* "Capa" translúcida (roadmap, pedido do Rilson
                          2026-09-02: "meio que ser a capa daquele livro") —
                          1 obra do livro como plano de fundo bem clarinho,
                          decorativo (aria-hidden), sentado ATRÁS do
                          conteúdo real (que por isso ganhou relative z-10).
                          Opacidade baixa de propósito pra não brigar com o
                          contraste do texto por cima. */}
                      {book.coverImageUrl && (
                        <img
                          src={book.coverImageUrl}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover opacity-[0.14] dark:opacity-[0.10] pointer-events-none"
                        />
                      )}
                      <Link to={`/biblia/${book.slug}`} className="relative z-10 block">
                        <CardHeader className="text-center p-2.5 sm:p-3 pb-2">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto gradient-hero rounded-lg flex items-center justify-center mb-2 group-hover:shadow-golden transition-all duration-300">
                            <Book className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <CardTitle className="text-display text-sm sm:text-base font-semibold group-hover:text-primary transition-colors leading-tight">
                            {toRomanBookName(book.name)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2.5 sm:p-3 pt-0 text-center">
                          {/* Pedido do Rilson 2026-09-01: cardzinho só mostrava
                              capítulos, sem noção de cobertura do acervo —
                              agora mostra as duas contagens juntas, curto o
                              bastante pro card compacto. */}
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {book.chapters} {book.chapters === 1 ? 'cap.' : 'caps.'}
                            {' · '}
                            {book.artworkCount} {book.artworkCount === 1 ? 'obra' : 'obras'}
                          </p>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* New Testament Section */}
            {(!testament || testament === 'new') && newTestamentBooks.length > 0 && (
              <div>
                <h2 className="text-display text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
                  Novo Testamento
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {newTestamentBooks.map((book) => (
                    <Card key={book.slug} className="group relative overflow-hidden hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border border-border/60 hover:border-accent/40">
                      {/* "Capa" translúcida (roadmap, pedido do Rilson
                          2026-09-02: "meio que ser a capa daquele livro") —
                          1 obra do livro como plano de fundo bem clarinho,
                          decorativo (aria-hidden), sentado ATRÁS do
                          conteúdo real (que por isso ganhou relative z-10).
                          Opacidade baixa de propósito pra não brigar com o
                          contraste do texto por cima. */}
                      {book.coverImageUrl && (
                        <img
                          src={book.coverImageUrl}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover opacity-[0.14] dark:opacity-[0.10] pointer-events-none"
                        />
                      )}
                      <Link to={`/biblia/${book.slug}`} className="relative z-10 block">
                        <CardHeader className="text-center p-2.5 sm:p-3 pb-2">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto gradient-hero rounded-lg flex items-center justify-center mb-2 group-hover:shadow-golden transition-all duration-300">
                            <Book className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <CardTitle className="text-display text-sm sm:text-base font-semibold group-hover:text-primary transition-colors leading-tight">
                            {toRomanBookName(book.name)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2.5 sm:p-3 pt-0 text-center">
                          {/* Pedido do Rilson 2026-09-01: cardzinho só mostrava
                              capítulos, sem noção de cobertura do acervo —
                              agora mostra as duas contagens juntas, curto o
                              bastante pro card compacto. */}
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {book.chapters} {book.chapters === 1 ? 'cap.' : 'caps.'}
                            {' · '}
                            {book.artworkCount} {book.artworkCount === 1 ? 'obra' : 'obras'}
                          </p>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-display text-xl font-semibold mb-4">
              Não encontrou o que procurava?
            </h3>
            <p className="text-muted-foreground mb-6">
              Explore nossas obras de arte por categoria ou use a busca para encontrar algo específico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Mesmo padrão do Index.tsx/Search.tsx (2026-09-11,
                  Rilson): nenhum CTA genérico de "ver arte" deve levar
                  pro seletor de categorias, mesmo quando o próprio texto
                  menciona "categoria". */}
              <Button asChild variant="outline" className="shadow-card">
                <Link to="/arte/painting">Explorar por Arte</Link>
              </Button>
              <Button asChild variant="outline" className="shadow-card">
                <Link to="/busca">Busca Avançada</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}