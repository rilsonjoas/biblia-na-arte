import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyButton } from './copy-button';

const toastMock = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

describe('CopyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      vibrate: vi.fn(),
    });
  });

  it('copia texto para o clipboard e emite feedback visual rápido e haptic', async () => {
    render(<CopyButton text="Gênesis 1:1" label="Copiar passagem" />);
    const button = screen.getByRole('button', { name: /copiar passagem/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Gênesis 1:1');
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Copiado com sucesso!',
        }),
      );
      expect(screen.getByText(/copiado!/i)).toBeInTheDocument();
    });
  });
});
