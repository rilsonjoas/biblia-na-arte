import { artworks } from '@/data/artworks';
import { bibleBooks } from '@/data/bibleStructure';
import { Artwork, BibleBook } from '@/types';

export function getBibleBooks(): BibleBook[] {
  return bibleBooks;
}

export function getBibleBookBySlug(slug: string): BibleBook | undefined {
  return bibleBooks.find(book => book.slug === slug);
}

export function getArtworks(): Artwork[] {
  return artworks;
}

export function getArtworkById(id: string): Artwork | undefined {
  return artworks.find(artwork => artwork.id === id);
}

export function getArtworksByCategory(category: string): Artwork[] {
  return artworks.filter(artwork => artwork.category === category);
}

export function getArtworksByBibleReference(
  bookSlug: string, 
  chapterNum?: number, 
  verses?: string
): Artwork[] {
  return artworks.filter(artwork => 
    artwork.references.some(ref => {
      if (ref.bookSlug !== bookSlug) return false;
      if (chapterNum && ref.chapter !== chapterNum) return false;
      if (verses && ref.verses && ref.verses !== verses) return false;
      return true;
    })
  );
}

export function searchArtworks(query: string): Artwork[] {
  const lowercaseQuery = query.toLowerCase();
  return artworks.filter(artwork =>
    artwork.title.toLowerCase().includes(lowercaseQuery) ||
    artwork.artistOrDirector.toLowerCase().includes(lowercaseQuery) ||
    artwork.description.toLowerCase().includes(lowercaseQuery) ||
    artwork.references.some(ref => 
      ref.book.toLowerCase().includes(lowercaseQuery)
    )
  );
}

export function getOldTestamentBooks(): BibleBook[] {
  return bibleBooks.filter(book => book.testament === 'old');
}

export function getNewTestamentBooks(): BibleBook[] {
  return bibleBooks.filter(book => book.testament === 'new');
}