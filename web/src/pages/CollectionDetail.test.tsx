import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CollectionDetail from './CollectionDetail';
import { useCollection } from '@/hooks/use-collections';
import type { Artwork } from '@/types';

vi.mock('@/hooks/use-collections', () => ({
  useCollection: vi.fn(),
}));

const mockArtwork: Artwork = {
  id: 'obra-1',
  title: 'O Bom Samaritano',
  artistOrDirector: 'Aimé Morot',
  year: 1880,
  category: 'painting',
  description: 'Uma pintura sobre compaixão.',
  imageUrl: '/images/morot.webp',
  licenseType: 'public-domain',
  references: [{ book: 'Lucas', bookSlug: 'luke', chapter: 10, verses: '34' }],
};

describe('CollectionDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o cabeçalho e as obras da coleção temática', () => {
    vi.mocked(useCollection).mockReturnValue({
      data: {
        slug: 'parabolas-de-jesus',
        title: 'As Parábolas de Jesus',
        subtitle: 'O Reino de Deus em Imagens',
        description: 'Explore como grandes mestres da arte retrataram as parábolas...',
        coverImage: '/images/morot.webp',
        artworks: [mockArtwork],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/colecoes/parabolas-de-jesus']}>
          <Routes>
            <Route path="/colecoes/:slug" element={<CollectionDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'As Parábolas de Jesus' })).toBeInTheDocument();
    expect(screen.getByText('O Reino de Deus em Imagens')).toBeInTheDocument();
    expect(screen.getByText('O Bom Samaritano')).toBeInTheDocument();
  });
});
