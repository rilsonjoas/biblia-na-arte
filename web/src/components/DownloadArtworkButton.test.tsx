import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DownloadArtworkButton } from './DownloadArtworkButton';

describe('DownloadArtworkButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('baixa o arquivo original via blob (não o render do Story)', async () => {
    const fakeBlob = new Blob(['fake'], { type: 'image/webp' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ blob: () => Promise.resolve(fakeBlob) }),
    );
    const createObjectURLMock = vi.fn(() => 'blob:fake-url');
    const revokeObjectURLMock = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: createObjectURLMock, revokeObjectURL: revokeObjectURLMock });

    render(<DownloadArtworkButton url="http://example.com/obra.webp" filename="obra.webp" />);
    fireEvent.click(screen.getByRole('button', { name: /baixar obra/i }));

    await waitFor(() => expect(createObjectURLMock).toHaveBeenCalledWith(fakeBlob));
    await waitFor(() => expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:fake-url'));
    expect(await screen.findByText('Baixado!')).toBeInTheDocument();
  });

  it('não quebra se o fetch falhar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede fora')));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(<DownloadArtworkButton url="http://example.com/obra.webp" filename="obra.webp" />);
    fireEvent.click(screen.getByRole('button', { name: /baixar obra/i }));

    await waitFor(() => expect(warnSpy).toHaveBeenCalled());
  });

  it('usa o rótulo customizado quando informado', () => {
    render(<DownloadArtworkButton url="http://example.com/obra.webp" filename="obra.webp" label="Baixar imagem" />);
    expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeInTheDocument();
  });
});
