import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Collections from './Collections';
import { useCollections } from '@/hooks/use-collections';

vi.mock('@/hooks/use-collections', () => ({
  useCollections: vi.fn(),
}));

describe('Collections Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza título e lista de coleções temáticas', () => {
    vi.mocked(useCollections).mockReturnValue({
      data: [
        {
          slug: 'vida-de-cristo',
          title: 'A Vida de Cristo',
          subtitle: 'Dos Evangelhos à Glória',
          description: 'Uma jornada visual e contemplativa...',
          coverImage: '/images/rembrandt.webp',
          artworkCount: 35,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as never);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Collections />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Coleções Temáticas' })).toBeInTheDocument();
    expect(screen.getByText('A Vida de Cristo')).toBeInTheDocument();
    expect(screen.getByText(/35 obras na trilha/i)).toBeInTheDocument();
  });
});
