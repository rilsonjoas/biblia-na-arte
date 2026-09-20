import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
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

  it('linka pra página da obra pelo id quando não tem slug ainda', () => {
    renderCard();
    const link = screen.getByRole('link', { name: /O bom samaritano/ });
    expect(link).toHaveAttribute('href', '/obra/abc-123');
  });

  // URL amigável (roadmap, 2026-09-19): assim que a obra tem slug, o link
  // do card deve preferir ele sobre o UUID — ver artworkHref em lib/utils.
  it('linka pra página da obra pelo slug quando a obra já tem um', () => {
    renderCard({ slug: 'aime-morot-o-bom-samaritano' });
    const link = screen.getByRole('link', { name: /O bom samaritano/ });
    expect(link).toHaveAttribute('href', '/obra/aime-morot-o-bom-samaritano');
  });

  // "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23) — o nome do
  // artista precisa navegar pra /artista/:slug SEM disparar a navegação
  // do card inteiro pra /obra/:id (o card inteiro é um <Link>, então o
  // nome não pode ser um <a> aninhado — ver comentário em ArtworkCard.tsx).
  it('clique no nome do artista navega pra página do artista, não da obra', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={<ArtworkCard artwork={artwork} showReferences />}
          />
          <Route path="/artista/:slug" element={<div>Página do artista</div>} />
          <Route path="/obra/:id" element={<div>Página da obra</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByText('Aimé Morot'));

    expect(screen.getByText('Página do artista')).toBeInTheDocument();
    expect(screen.queryByText('Página da obra')).not.toBeInTheDocument();
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
