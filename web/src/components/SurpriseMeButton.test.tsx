import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SurpriseMeButton } from './SurpriseMeButton';
import { getRandomArtwork } from '@/lib/api-data';

const navigateMock = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/lib/api-data', () => ({
  getRandomArtwork: vi.fn(),
}));

function renderButton() {
  return render(
    <MemoryRouter>
      <SurpriseMeButton />
    </MemoryRouter>,
  );
}

describe('SurpriseMeButton', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(getRandomArtwork).mockReset();
  });

  it('busca uma obra aleatória e navega pra página dela ao clicar', async () => {
    vi.mocked(getRandomArtwork).mockResolvedValue({ id: 'random-id-123' } as never);
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: /me surpreenda/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/obra/random-id-123'));
  });

  it('não navega e não quebra se a busca falhar', async () => {
    vi.mocked(getRandomArtwork).mockRejectedValue(new Error('falha de rede'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: /me surpreenda/i }));

    await waitFor(() => expect(warnSpy).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('mostra o rótulo quando showLabel=true', () => {
    render(
      <MemoryRouter>
        <SurpriseMeButton showLabel />
      </MemoryRouter>,
    );
    expect(screen.getByText('Me surpreenda')).toBeInTheDocument();
  });
});
