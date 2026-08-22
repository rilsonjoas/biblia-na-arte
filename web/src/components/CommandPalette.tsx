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

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
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
                onSelect={() => handleSelect(() => navigate(`/obra/${art.id}`))}
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
        <CommandGroup heading="Livros Bíblicos">
          {bibleBooks.map((book) => (
            <CommandItem
              key={book.slug}
              value={`${book.name} ${book.slug} ${book.testament === 'old' ? 'Antigo Testamento AT' : 'Novo Testamento NT'}`}
              onSelect={() => handleSelect(() => navigate(`/biblia/${book.slug}`))}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-primary/80" />
                <span>{book.name}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {book.chapters} cap. ({book.testament === 'old' ? 'AT' : 'NT'})
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Navigation Links */}
        <CommandGroup heading="Navegação Rápida">
          <CommandItem
            value="galeria pinturas obras arte catalogo"
            onSelect={() => handleSelect(() => navigate('/arte/painting'))}
            className="cursor-pointer"
          >
            <Layers className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" />
            <span>Galeria Completa de Pinturas</span>
          </CommandItem>
          <CommandItem
            value="antigo testamento genesis salmos isaias"
            onSelect={() => handleSelect(() => navigate('/biblia?testament=old'))}
            className="cursor-pointer"
          >
            <BookOpen className="w-4 h-4 mr-2 text-primary" />
            <span>Antigo Testamento</span>
          </CommandItem>
          <CommandItem
            value="novo testamento evangelhos mateus marcos lucas joao"
            onSelect={() => handleSelect(() => navigate('/biblia?testament=new'))}
            className="cursor-pointer"
          >
            <BookOpen className="w-4 h-4 mr-2 text-primary" />
            <span>Novo Testamento</span>
          </CommandItem>
          <CommandItem
            value="busca avancada pesquisar filtro"
            onSelect={() => handleSelect(() => navigate(query.trim() ? `/busca?q=${encodeURIComponent(query)}` : '/busca'))}
            className="cursor-pointer"
          >
            <Search className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>Página de Busca Avançada</span>
          </CommandItem>
          <CommandItem
            value="sobre o projeto biblia na arte missao"
            onSelect={() => handleSelect(() => navigate('/sobre'))}
            className="cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
            <span>Sobre o Projeto Bíblia na Arte</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Theme switching */}
        <CommandGroup heading="Aparência / Tema">
          <CommandItem
            value="tema claro light mode dia"
            onSelect={() => handleSelect(() => setTheme('light'))}
            className="cursor-pointer"
          >
            <Sun className="w-4 h-4 mr-2 text-amber-600" />
            <span>Mudar para Tema Claro</span>
          </CommandItem>
          <CommandItem
            value="tema escuro dark mode noite"
            onSelect={() => handleSelect(() => setTheme('dark'))}
            className="cursor-pointer"
          >
            <Moon className="w-4 h-4 mr-2 text-amber-400" />
            <span>Mudar para Tema Escuro</span>
          </CommandItem>
          <CommandItem
            value="tema sistema automatico os"
            onSelect={() => handleSelect(() => setTheme('system'))}
            className="cursor-pointer"
          >
            <Laptop className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>Usar Tema do Sistema</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
