import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ArtworkCard from './ArtworkCard';
import type { Artwork } from '@/types';

const artwork: Artwork = {
  id: 'abc-123',
  title: 'O bom samaritano',
  artistOrDirector: 'Aimé Morot',
  year: 1880,
  category: 'painting',
  description: 'Uma pintura sobre compaixão.',
  imageUrl: 'http://example.com/img.jpg',
  references: [{ book: 'Lucas', bookSlug: 'luke', chapter: 10, verses: '34' }],
  licenseType: 'public-domain',
};

function renderCard(overrides?: Partial<Artwork>, showReferences = true) {
  return render(
    <MemoryRouter>
      <ArtworkCard artwork={{ ...artwork, ...overrides }} showReferences={showReferences} />
    </MemoryRouter>,
  );
}

describe('ArtworkCard', () => {
  it('mostra título, artista, ano e referência bíblica', () => {
    renderCard();
    expect(screen.getByText('O bom samaritano')).toBeInTheDocument();
    expect(screen.getByText('Aimé Morot')).toBeInTheDocument();
    expect(screen.getByText('1880')).toBeInTheDocument();
    expect(screen.getByText('Lucas 10:34')).toBeInTheDocument();
  });

  it('linka pra página da obra', () => {
    renderCard();
    const link = screen.getByRole('link', { name: /O bom samaritano/ });
    expect(link).toHaveAttribute('href', '/obra/abc-123');
  });

  it('exibe "Pintura" como categoria', () => {
    renderCard();
    expect(screen.getByText('Pintura')).toBeInTheDocument();
  });

  it('não mostra referências quando showReferences=false', () => {
    renderCard({}, false);
    expect(screen.queryByText(/Referências Bíblicas/i)).not.toBeInTheDocument();
  });

  it('funciona sem imagem e sem ano', () => {
    renderCard({ imageUrl: undefined, year: undefined });
    expect(screen.getByText('O bom samaritano')).toBeInTheDocument();
    expect(screen.queryByText('1880')).not.toBeInTheDocument();
  });
});
