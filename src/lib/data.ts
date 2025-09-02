// Legacy data imports (fallback)
import { artworks as staticArtworks } from '@/data/artworks';
import { bibleBooks as staticBibleBooks } from '@/data/bibleStructure';
import { Artwork, BibleBook } from '@/types';

// Supabase data functions (primary)
import * as supabaseData from '@/lib/supabase-data';

// Environment check for data source
const USE_SUPABASE = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

// Wrapper functions that try Supabase first, fall back to static data
export async function getBibleBooks(): Promise<BibleBook[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.getBibleBooks();
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  return staticBibleBooks;
}

export async function getBibleBookBySlug(slug: string): Promise<BibleBook | undefined> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.getBibleBookBySlug(slug);
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  return staticBibleBooks.find(book => book.slug === slug);
}

export async function getArtworks(): Promise<Artwork[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.getArtworks();
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  return staticArtworks;
}

export async function getArtworkById(id: string): Promise<Artwork | undefined> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.getArtworkById(id);
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  return staticArtworks.find(artwork => artwork.id === id);
}

export async function getArtworksByCategory(category: string): Promise<Artwork[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.getArtworksByCategory(category);
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  return staticArtworks.filter(artwork => artwork.category === category);
}

export async function getArtworksByBibleReference(
  bookSlug: string, 
  chapterNum?: number, 
  verses?: string
): Promise<Artwork[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.getArtworksByBibleReference(bookSlug, chapterNum, verses);
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  
  return staticArtworks.filter(artwork => 
    artwork.references.some(ref => {
      if (ref.bookSlug !== bookSlug) return false;
      if (chapterNum && ref.chapter !== chapterNum) return false;
      if (verses && ref.verses && ref.verses !== verses) return false;
      return true;
    })
  );
}

export async function searchArtworks(query: string): Promise<Artwork[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.searchArtworks(query);
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  
  const lowercaseQuery = query.toLowerCase();
  return staticArtworks.filter(artwork =>
    artwork.title.toLowerCase().includes(lowercaseQuery) ||
    artwork.artistOrDirector.toLowerCase().includes(lowercaseQuery) ||
    artwork.description.toLowerCase().includes(lowercaseQuery) ||
    artwork.references.some(ref => 
      ref.book.toLowerCase().includes(lowercaseQuery)
    )
  );
}

export async function getOldTestamentBooks(): Promise<BibleBook[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.getOldTestamentBooks();
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  return staticBibleBooks.filter(book => book.testament === 'old');
}

export async function getNewTestamentBooks(): Promise<BibleBook[]> {
  if (USE_SUPABASE) {
    try {
      return await supabaseData.getNewTestamentBooks();
    } catch (error) {
      console.warn('Supabase error, falling back to static data:', error);
    }
  }
  return staticBibleBooks.filter(book => book.testament === 'new');
}

// Synchronous functions for backward compatibility (will be deprecated)
export function getBibleBooksSync(): BibleBook[] {
  console.warn('getBibleBooksSync is deprecated. Use getBibleBooks() with await or React hooks.');
  return staticBibleBooks;
}

export function getArtworksSync(): Artwork[] {
  console.warn('getArtworksSync is deprecated. Use getArtworks() with await or React hooks.');
  return staticArtworks;
}