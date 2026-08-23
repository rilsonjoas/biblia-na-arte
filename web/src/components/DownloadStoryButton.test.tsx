import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DownloadStoryButton } from './DownloadStoryButton';
import type { Artwork } from '@/types';

const artwork: Artwork = {
  id: 'abc-123',
  title: 'O bom samaritano',
  artistOrDirector: 'Alexandre Gabriel Decamps',
  year: 1842,
  category: 'painting',
  description: 'Uma pintura sobre compaixão.',
  imageUrl: 'http://example.com/img.webp',
  references: [{ book: 'Lucas', bookSlug: 'luke', chapter: 10, verses: '33-34' }],
  licenseType: 'public-domain',
};

const toDataURLMock = vi.fn(() => 'data:image/png;base64,fake');
const html2canvasMock = vi.fn(async () => ({ toDataURL: toDataURLMock }));

vi.mock('html2canvas', () => ({ default: (...args: unknown[]) => html2canvasMock(...args) }));

describe('DownloadStoryButton', () => {
  beforeEach(() => {
    html2canvasMock.mockClear();
    toDataURLMock.mockClear();
  });

  it('gera e baixa a imagem ao clicar', async () => {
    render(<DownloadStoryButton artwork={artwork} />);

    fireEvent.click(screen.getByRole('button', { name: /baixar story/i }));

    await waitFor(() => expect(html2canvasMock).toHaveBeenCalled());
    expect(toDataURLMock).toHaveBeenCalledWith('image/png');
  });

  it('renderiza o card escondido fora da tela com os dados da obra', () => {
    render(<DownloadStoryButton artwork={artwork} />);
    expect(screen.getByText('O bom samaritano')).toBeInTheDocument();
    expect(screen.getByText(/Decamps/)).toBeInTheDocument();
    expect(screen.getByText('Lucas 10:33-34')).toBeInTheDocument();
  });

  it('não quebra se html2canvas falhar', async () => {
    html2canvasMock.mockRejectedValueOnce(new Error('falha de captura'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<DownloadStoryButton artwork={artwork} />);
    fireEvent.click(screen.getByRole('button', { name: /baixar story/i }));

    await waitFor(() => expect(warnSpy).toHaveBeenCalled());
    warnSpy.mockRestore();
  });
});
