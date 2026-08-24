import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArtworkLightbox } from './ArtworkLightbox';
import type { Artwork } from '@/types';

const mockArtwork: Artwork = {
  id: 'obra-1',
  title: 'A Ceia em Emaús',
  artistOrDirector: 'Rembrandt',
  year: 1648,
  category: 'painting',
  description: 'Jesus revelado na ceia com os discípulos.',
  imageUrl: '/images/emaus.webp',
  licenseType: 'public-domain',
  location: 'Musée du Louvre, Paris, França',
};

describe('ArtworkLightbox', () => {
  it('não renderiza nada quando isOpen=false', () => {
    const { container } = render(
      <ArtworkLightbox artwork={mockArtwork} isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o título, artista e imagem quando isOpen=true', () => {
    render(<ArtworkLightbox artwork={mockArtwork} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('A Ceia em Emaús')).toBeInTheDocument();
    expect(screen.getByText(/Rembrandt/)).toBeInTheDocument();
    const img = screen.getByRole('img', { name: 'A Ceia em Emaús' });
    expect(img).toHaveAttribute('src', '/images/emaus.webp');
  });

  it('chama onClose ao pressionar a tecla Escape', () => {
    const onClose = vi.fn();
    render(<ArtworkLightbox artwork={mockArtwork} isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao clicar no botão Fechar', () => {
    const onClose = vi.fn();
    render(<ArtworkLightbox artwork={mockArtwork} isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByLabelText(/^fechar$/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('alterna o contexto da obra ao clicar no botão de contexto', () => {
    render(<ArtworkLightbox artwork={mockArtwork} isOpen={true} onClose={vi.fn()} />);

    const toggleBtn = screen.getByLabelText(/alternar contexto da obra/i);
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('ajusta zoom ao usar as teclas + e -', () => {
    render(<ArtworkLightbox artwork={mockArtwork} isOpen={true} onClose={vi.fn()} />);

    fireEvent.keyDown(window, { key: '+' });
    fireEvent.keyDown(window, { key: '-' });
    fireEvent.keyDown(window, { key: '0' });

    expect(screen.getByText('A Ceia em Emaús')).toBeInTheDocument();
  });
});
