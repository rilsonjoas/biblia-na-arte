import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Search from './Search';
import { useArtworkSearchAdvanced, useArtists, useThemes, usePeriods } from '@/hooks/use-artworks';
import { useBibleBooks } from '@/hooks/use-bible-books';

vi.mock('@/hooks/use-artworks', () => ({
  useArtworkSearchAdvanced: vi.fn(),
  useArtists: vi.fn(),
  useThemes: vi.fn(),
  usePeriods: vi.fn(),
}));

vi.mock('@/hooks/use-bible-books', () => ({
  useBibleBooks: vi.fn(),
}));

const advancedMock = vi.mocked(useArtworkSearchAdvanced);
const themesMock = vi.mocked(useThemes);
const artistsMock = vi.mocked(useArtists);
const periodsMock = vi.mocked(usePeriods);
const bibleBooksMock = vi.mocked(useBibleBooks);

function renderAt(url: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <Search />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Search — parâmetros de URL (cluster "A Biblioteca")', () => {
  beforeEach(() => {
    // Resultado default: acervo vazio, sem erro, sem loading.
    advancedMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);
    themesMock.mockReturnValue({ data: [
      { slug: 'criacao', name: 'Criação', artworkCount: 12 },
      { slug: 'perdao', name: 'Perdão', artworkCount: 8 },
    ] } as never);
    artistsMock.mockReturnValue({ data: [{ name: 'Rembrandt', artworkCount: 40 }] } as never);
    periodsMock.mockReturnValue({ data: [{ century: 17, artworkCount: 300 }] } as never);
    bibleBooksMock.mockReturnValue({ data: [
      { name: 'Gênesis', slug: 'genesis', chapters: 50, artworkCount: 40, testament: 'old', coverImageUrl: null },
    ] } as never);
  });

  it('aplica ?themes= como filtro de tema (1 tema)', () => {
    renderAt('/busca?themes=criacao');

    expect(advancedMock).toHaveBeenCalledWith('', expect.objectContaining({ themes: ['criacao'] }));
    // badge removível do tema aplicado
    expect(screen.getByText('Criação')).toBeInTheDocument();
  });

  it('aplica ?themes= multi com vírgula (semântica "ou")', () => {
    renderAt('/busca?themes=criacao,perdao');

    expect(advancedMock).toHaveBeenCalledWith('', expect.objectContaining({ themes: ['criacao', 'perdao'] }));
    expect(screen.getByText('Criação')).toBeInTheDocument();
    expect(screen.getByText('Perdão')).toBeInTheDocument();
  });

  it('mantém ?q= (busca por texto) como sempre foi', () => {
    renderAt('/busca?q=adoração');

    expect(advancedMock).toHaveBeenCalledWith('adoração', expect.objectContaining({}));
  });

  it('aplica ?bookSlug= como filtro de livro', () => {
    renderAt('/busca?bookSlug=genesis');

    expect(advancedMock).toHaveBeenCalledWith('', expect.objectContaining({ books: ['genesis'] }));
    expect(screen.getByText('Gênesis')).toBeInTheDocument();
  });

  it('/busca sem parâmetros segue sem filtro (regressão)', () => {
    renderAt('/busca');

    expect(advancedMock).toHaveBeenCalledWith('', expect.objectContaining({}));
  });
});