import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VersiculoDoDia } from './VersiculoDoDia';
import { getVerseOfTheDay } from '@/lib/versiculo';

vi.mock('@/lib/versiculo', () => ({
  getVerseOfTheDay: vi.fn(),
  lecionarioHomeUrl: () => 'https://lecionario.narniano.com',
}));

vi.mock('@/lib/api-data', () => ({
  // use-verse.ts chama isso pra montar a query key.
  todaySaoPaulo: () => '2026-01-01',
}));

const sample = {
  date: '2026-01-01',
  verse: {
    type: 'psalm',
    reference: 'Salmo 29:1-2',
    citation: 'Salmo 29',
    text: 'Tributai ao Senhor, ó filhos dos poderosos, tributai ao Senhor glória e força.',
  },
  fallback: false,
  shifted: false,
};

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <VersiculoDoDia />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('VersiculoDoDia', () => {
  beforeEach(() => {
    vi.mocked(getVerseOfTheDay).mockReset();
  });

  it('mostra versículo, referência, data e link pro Lecionário', async () => {
    vi.mocked(getVerseOfTheDay).mockResolvedValue(sample as never);

    renderWithProviders();

    expect(await screen.findByText(sample.verse.text)).toBeInTheDocument();
    expect(screen.getByText('Salmo 29:1-2 • ARC')).toBeInTheDocument();
    expect(screen.getByText('1 de janeiro de 2026')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Ler hoje no Lecionário/ });
    expect(link).toHaveAttribute('href', 'https://lecionario.narniano.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('não quebra a home e não renderiza nada se a rota não responder', async () => {
    vi.mocked(getVerseOfTheDay).mockResolvedValue(null);

    const { container } = renderWithProviders();

    await waitFor(() => expect(container.querySelector('section')).toBeNull());
  });
});