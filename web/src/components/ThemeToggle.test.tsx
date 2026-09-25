import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from 'next-themes';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeToggle', () => {
  const setThemeMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: setThemeMock,
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
      resolvedTheme: 'light',
    });
  });

  it('renderiza o botão com acessibilidade correta', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /alternar tema/i });
    expect(button).toBeInTheDocument();
  });

  it('permite alternar entre temas ao interagir', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /alternar tema/i });
    await user.click(button);

    const darkOption = await screen.findByRole('menuitem', { name: /escuro/i });
    expect(darkOption).toBeInTheDocument();

    await user.click(darkOption);
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });
});
