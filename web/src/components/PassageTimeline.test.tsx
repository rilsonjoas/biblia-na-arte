import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PassageTimeline } from './PassageTimeline';
import type { Artwork } from '@/types';

function makeArtwork(overrides: Partial<Artwork>): Artwork {
  return {
    id: 'id-1',
    title: 'Obra',
    artistOrDirector: 'Artista',
    category: 'painting',
    description: '',
    references: [],
    licenseType: 'public-domain',
    ...overrides,
  };
}

function renderTimeline(artworks: Artwork[]) {
  return render(
    <MemoryRouter>
      <PassageTimeline artworks={artworks} />
    </MemoryRouter>,
  );
}

describe('PassageTimeline', () => {
  it('não renderiza nada com menos de 2 anos distintos', () => {
    const { container } = renderTimeline([
      makeArtwork({ id: '1', year: 1648 }),
      makeArtwork({ id: '2', year: undefined }),
    ]);
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada quando todas as obras têm o mesmo ano', () => {
    const { container } = renderTimeline([
      makeArtwork({ id: '1', year: 1648 }),
      makeArtwork({ id: '2', year: 1648 }),
    ]);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra a linha do tempo em ordem cronológica com 2+ anos distintos', () => {
    renderTimeline([
      makeArtwork({ id: '1', artistOrDirector: 'Louvre', year: 1648 }),
      makeArtwork({ id: '2', artistOrDirector: 'Jacquemart-André', year: 'c. 1628' }),
    ]);

    expect(screen.getByText(/1628 a 1648/)).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/obra/2'); // 1628 vem primeiro
    expect(links[1]).toHaveAttribute('href', '/obra/1'); // 1648 depois
  });
});
