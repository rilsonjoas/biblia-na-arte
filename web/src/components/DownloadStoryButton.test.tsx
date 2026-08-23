import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
const toBlobMock = vi.fn((cb: (b: Blob | null) => void) => cb(new Blob(['fake'], { type: 'image/png' })));
const html2canvasMock = vi.fn(async () => ({ toDataURL: toDataURLMock, toBlob: toBlobMock }));

vi.mock('html2canvas', () => ({ default: () => html2canvasMock() }));

describe('DownloadStoryButton', () => {
  beforeEach(() => {
    html2canvasMock.mockClear();
    toDataURLMock.mockClear();
    toBlobMock.mockClear();
  });

  it('sem Web Share API (padrão do jsdom, como desktop) — cai no <a download>', async () => {
    render(<DownloadStoryButton artwork={artwork} />);

    fireEvent.click(screen.getByRole('button', { name: /baixar story/i }));

    await waitFor(() => expect(html2canvasMock).toHaveBeenCalled());
    await waitFor(() => expect(toDataURLMock).toHaveBeenCalledWith('image/png'));
  });

  it('com Web Share API disponível (mobile) — usa navigator.share em vez de download', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const canShareMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...navigator, share: shareMock, canShare: canShareMock });

    render(<DownloadStoryButton artwork={artwork} />);
    fireEvent.click(screen.getByRole('button', { name: /baixar story/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalled());
    expect(toDataURLMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('ignora AbortError (pessoa fechou a folha de compartilhamento sem escolher nada)', async () => {
    const abortError = Object.assign(new Error('cancelado'), { name: 'AbortError' });
    const shareMock = vi.fn().mockRejectedValue(abortError);
    vi.stubGlobal('navigator', { ...navigator, share: shareMock, canShare: () => true });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<DownloadStoryButton artwork={artwork} />);
    fireEvent.click(screen.getByRole('button', { name: /baixar story/i }));

    await waitFor(() => expect(shareMock).toHaveBeenCalled());
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    vi.unstubAllGlobals();
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

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
