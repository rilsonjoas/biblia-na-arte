export interface BibleReference {
  book: string;
  bookSlug: string;
  chapter: number;
  verses?: string;
}

export type ArtworkCategory = 'painting' | 'music' | 'film';

export interface Artwork {
  id: string;
  title: string;
  artistOrDirector: string;
  year?: number | string;
  category: ArtworkCategory;
  mediumOrGenre?: string;
  description: string;
  imageUrl?: string;
  embedUrl?: string;
  sourceUrl?: string;
  dimensionsOrDuration?: string;
  references: BibleReference[];
}

export interface BibleBook {
  name: string;
  slug: string;
  chapters: number;
  testament: 'old' | 'new';
}