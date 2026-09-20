import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Book,
  BookOpen,
  Image as ImageIcon,
  Moon,
  Search,
  Sun,
  Laptop,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useQuery } from '@tanstack/react-query';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { getBibleBooks, searchArtworks } from '@/lib/api-data';
import { artworkHref } from '@/lib/utils';

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (val: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  // Listen to ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Pre-fetch bible books for instant navigation
  const { data: bibleBooks = [] } = useQuery({
    queryKey: ['bible-books-palette'],
    queryFn: getBibleBooks,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Search artworks when query has at least 2 characters
  const { data: artworkResults = [], isFetching: isSearchingArtworks } = useQuery({
    queryKey: ['palette-search-artworks', query],
    queryFn: () => searchArtworks(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  const handleSelect = (action: () => void) => {
    setIsOpen(false);
    setQuery('');
    action();
  };

  // Filtro manual — cmdk teria filtro embutido, mas os resultados de obra já
  // vêm filtrados pelo servidor (busca full-text por descrição/referência,
  // não só título). Se deixar o filtro embutido do cmdk ligado (no
  // <Command> raiz, via CommandDialog), ele filtra de novo no cliente
  // contra o texto digitado e derruba resultado válido sempre que o
  // termo buscado não aparece literal no título da obra — achado real
  // 2026-08-22 ("busca por livro funciona, por obra não"). Solução:
  // shouldFilter={false} no CommandDialog (repassado pro <Command> raiz,
  // ver ui/command.tsx) + filtro manual abaixo, aplicado igual pros itens
  // estáticos (que antes dependiam do filtro embutido do cmdk).
  const q = query.trim().toLowerCase();
  const matches = (text: string) => q === '' || text.toLowerCase().includes(q);
  const filteredBooks = bibleBooks.filter((book) =>
    matches(`${book.name} ${book.slug} ${book.testament === 'old' ? 'antigo testamento at' : 'novo testamento nt'}`)
  );

  // Ícones com `group-data-[selected=true]:text-accent-foreground` —
  // achado 2026-09-02 (Rilson): sem isso, ícone dourado (text-primary/
  // text-amber-*) some contra a linha selecionada (bg-accent), porque os
  // dois tokens têm o mesmo matiz dourado no tema escuro. `group` mora no
  // CommandItem (ver ui/command.tsx) — cada ícone só precisa da variante.
  const quickNavItems = [
    {
      value: 'galeria pinturas obras arte catalogo',
      onSelect: () => handleSelect(() => navigate('/arte/painting')),
      icon: <Layers className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400 group-data-[selected=true]:text-accent-foreground" />,
      label: 'Galeria Completa de Pinturas',
    },
    {
      value: 'antigo testamento genesis salmos isaias',
      onSelect: () => handleSelect(() => navigate('/biblia?testament=old')),
      icon: <BookOpen className="w-4 h-4 mr-2 text-primary group-data-[selected=true]:text-accent-foreground" />,
      label: 'Antigo Testamento',
    },
    {
      value: 'novo testamento evangelhos mateus marcos lucas joao',
      onSelect: () => handleSelect(() => navigate('/biblia?testament=new')),
      icon: <BookOpen className="w-4 h-4 mr-2 text-primary group-data-[selected=true]:text-accent-foreground" />,
      label: 'Novo Testamento',
    },
    {
      value: 'busca avancada pesquisar filtro',
      onSelect: () => handleSelect(() => navigate(query.trim() ? `/busca?q=${encodeURIComponent(query)}` : '/busca')),
      icon: <Search className="w-4 h-4 mr-2 text-muted-foreground" />,
      label: 'Página de Busca Avançada',
    },
    {
      value: 'sobre o projeto biblia na arte missao',
      onSelect: () => handleSelect(() => navigate('/sobre')),
      icon: <Sparkles className="w-4 h-4 mr-2 text-amber-500 group-data-[selected=true]:text-accent-foreground" />,
      label: 'Sobre o Projeto Bíblia na Arte',
    },
  ].filter((item) => matches(`${item.value} ${item.label}`));

  const themeItems = [
    {
      value: 'tema claro light mode dia',
      onSelect: () => handleSelect(() => setTheme('light')),
      icon: <Sun className="w-4 h-4 mr-2 text-amber-600" />,
      label: 'Mudar para Tema Claro',
    },
    {
      value: 'tema escuro dark mode noite',
      onSelect: () => handleSelect(() => setTheme('dark')),
      icon: <Moon className="w-4 h-4 mr-2 text-amber-400" />,
      label: 'Mudar para Tema Escuro',
    },
    {
      value: 'tema sistema automatico os',
      onSelect: () => handleSelect(() => setTheme('system')),
      icon: <Laptop className="w-4 h-4 mr-2 text-muted-foreground" />,
      label: 'Usar Tema do Sistema',
    },
  ].filter((item) => matches(`${item.value} ${item.label}`));

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Buscar livros bíblicos, pinturas, artistas ou atalhos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[350px]">
        <CommandEmpty>
          {isSearchingArtworks ? 'Buscando obras de arte...' : 'Nenhum resultado encontrado.'}
        </CommandEmpty>

        {/* Artworks search results if searching */}
        {artworkResults.length > 0 && (
          <CommandGroup heading="Obras de Arte Encontradas">
            {artworkResults.slice(0, 6).map((art) => (
              <CommandItem
                key={art.id}
                value={`${art.title} ${art.artistOrDirector}`}
                onSelect={() => handleSelect(() => navigate(artworkHref(art)))}
                className="flex items-center justify-between cursor-pointer py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted/60 flex items-center justify-center overflow-hidden shrink-0">
                    <ImageIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{art.title}</div>
                    <div className="text-xs text-muted-foreground">{art.artistOrDirector} {art.year ? `(${art.year})` : ''}</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Ver obra</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Bible Books */}
        {filteredBooks.length > 0 && (
          <CommandGroup heading="Livros Bíblicos">
            {filteredBooks.map((book) => (
              <CommandItem
                key={book.slug}
                value={`${book.name} ${book.slug} ${book.testament === 'old' ? 'Antigo Testamento AT' : 'Novo Testamento NT'}`}
                onSelect={() => handleSelect(() => navigate(`/biblia/${book.slug}`))}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4 text-primary/80 group-data-[selected=true]:text-accent-foreground" />
                  <span>{book.name}</span>
                </div>
                {/* numeral-classico, não font-mono — achado 2026-09-02
                    (Rilson): mono lê como terminal de código e destoa da
                    identidade manuscrita do site (mesmo achado já corrigido
                    em ArtworkCard/ArtworkDetail/PassageTimeline pro badge
                    de ano, ver docs/ROADMAP.md — esta ocorrência tinha
                    ficado de fora daquela varredura). */}
                <span className="numeral-classico text-xs text-muted-foreground">
                  {book.chapters} cap. ({book.testament === 'old' ? 'AT' : 'NT'})
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredBooks.length > 0 && quickNavItems.length > 0 && <CommandSeparator />}

        {/* Quick Navigation Links */}
        {quickNavItems.length > 0 && (
          <CommandGroup heading="Navegação Rápida">
            {quickNavItems.map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={item.onSelect}
                className="cursor-pointer"
              >
                {item.icon}
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {quickNavItems.length > 0 && themeItems.length > 0 && <CommandSeparator />}

        {/* Theme switching */}
        {themeItems.length > 0 && (
          <CommandGroup heading="Aparência / Tema">
            {themeItems.map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={item.onSelect}
                className="cursor-pointer"
              >
                {item.icon}
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
