import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PinturaDoDia } from './PinturaDoDia';
import { getDailyArtwork } from '@/lib/api-data';

vi.mock('@/lib/api-data', () => ({
  getDailyArtwork: vi.fn(),
}));

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PinturaDoDia />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PinturaDoDia', () => {
  beforeEach(() => {
    vi.mocked(getDailyArtwork).mockReset();
  });

  it('mostra título, artista e link pra obra do dia', async () => {
    vi.mocked(getDailyArtwork).mockResolvedValue({
      id: 'obra-do-dia',
      title: 'A Ceia em Emaús',
      artistOrDirector: 'Rembrandt van Rijn',
      year: 1628,
      description: 'Uma cena de reconhecimento.',
      category: 'painting',
      references: [{ book: 'Lucas', bookSlug: 'lucas', chapter: 24, verses: '30-31' }],
      licenseType: 'public-domain',
      imageUrl: 'https://example.com/emaus.jpg',
    } as never);

    renderWithProviders();

    await waitFor(() => expect(screen.getByText('A Ceia em Emaús')).toBeInTheDocument());
    expect(screen.getByText(/Rembrandt van Rijn/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/obra/obra-do-dia');
  });

  it('não quebra a home e não renderiza nada se a busca falhar', async () => {
    vi.mocked(getDailyArtwork).mockRejectedValue(new Error('falha de rede'));
    const { container } = renderWithProviders();

    await waitFor(() => expect(container.querySelector('section')).toBeNull());
  });
});
