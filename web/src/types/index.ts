export interface BibleReference {
  id?: string;
  book: string;
  bookSlug: string;
  chapter: number;
  verses?: string;
  passageText?: string;
}

export type ArtworkCategory = 'painting' | 'music' | 'film';

export interface Artwork {
  id: string;
  title: string;
  subtitle?: string;
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
  /** 'public-domain' | 'cc-by-sa-4.0' | ... — resultado da auditoria de
   * direitos autorais (2026-08-07). Toda obra que não é domínio público
   * simples exige attributionText visível na página, conforme a licença. */
  licenseType: string;
  attributionText?: string;
}

export interface BibleBook {
  name: string;
  slug: string;
  chapters: number;
  testament: 'old' | 'new';
}