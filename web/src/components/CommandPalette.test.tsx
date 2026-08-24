import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommandPalette } from './CommandPalette';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function renderPalette(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CommandPalette open={true} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CommandPalette', () => {
  it('renderiza o campo de busca quando aberto', () => {
    renderPalette();
    expect(screen.getByPlaceholderText(/Buscar livros bíblicos, pinturas, artistas/i)).toBeInTheDocument();
  });

  it('alterna o estado de visibilidade via atalho Ctrl+K', () => {
    const onOpenChange = vi.fn();
    renderPalette({ open: false, onOpenChange });

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
