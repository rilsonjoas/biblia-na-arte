import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArtworkImage } from './ArtworkImage';

describe('ArtworkImage', () => {
  it('renderiza imagem com atributo alt correto', () => {
    render(<ArtworkImage src="/images/obra.webp" alt="O bom samaritano" />);
    const img = screen.getByRole('img', { name: 'O bom samaritano' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/obra.webp');
  });

  it('usa imagem fallback quando src não é fornecida', () => {
    render(<ArtworkImage alt="Sem fonte" />);
    const img = screen.getByRole('img', { name: 'Sem fonte' });
    expect(img).toHaveAttribute('src', '/placeholder-image.jpg');
  });

  it('troca para fallbackSrc quando ocorre erro de carregamento', () => {
    const onError = vi.fn();
    render(<ArtworkImage src="/images/broken.jpg" alt="Imagem com erro" onError={onError} />);

    const img = screen.getByRole('img', { name: 'Imagem com erro' });
    fireEvent.error(img);

    expect(onError).toHaveBeenCalled();
    expect(img).toHaveAttribute('src', '/placeholder-image.jpg');
  });

  it('chama onLoad quando a imagem é carregada com sucesso', () => {
    const onLoad = vi.fn();
    render(<ArtworkImage src="/images/obra.webp" alt="Imagem ok" onLoad={onLoad} />);

    const img = screen.getByRole('img', { name: 'Imagem ok' });
    fireEvent.load(img);

    expect(onLoad).toHaveBeenCalled();
  });
});
