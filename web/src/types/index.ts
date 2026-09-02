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
  /** "Onde ver pessoalmente" — museu/cidade/país, texto livre. Curadoria
   * progressiva: nem toda obra tem isso preenchido ainda. */
  location?: string;
  /** "Vozes dos clássicos" — onde Rookmaaker/Schaeffer/Lewis comentaram
   * esta obra específica (fonte verificada). Raro de propósito. */
  classicCommentaryAuthor?: string;
  classicCommentary?: string;
}

export interface BibleBook {
  name: string;
  slug: string;
  chapters: number;
  artworkCount: number;
  testament: 'old' | 'new';
  // "Capa" translúcida no cardzinho de livro (roadmap, 2026-09-02).
  coverImageUrl: string | null;
}

export interface Artist {
  name: string;
  artworkCount: number;
}

// "Filtros Avançados" (roadmap, Passo 2, 2026-09-02).
export interface Theme {
  slug: string;
  name: string;
  artworkCount: number;
}

// Filtro "Período" (achado 2026-09-02: lista de séculos hardcoded no
// front tinha ficado obsoleta). `century` é o número do século (19 =
// "século XIX") — o rótulo em algarismo romano é montado no frontend
// via `toRomanNumeral()`.
export interface Period {
  century: number;
  artworkCount: number;
}

// "Páginas de Artista Ricas" (roadmap, aprovada 2026-08-23).
export interface ArtistDetail {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  artworks: Artwork[];
}

// "Mapa de obras ↔ referências bíblicas" (/explorar, aprovada 2026-09-02).
export interface ExploreTheme {
  slug: string;
  name: string;
  artworkCount: number;
}

export interface ExploreArtwork {
  id: string;
  title: string;
  subtitle?: string;
  artistOrDirector: string;
  year?: number | string;
  category: ArtworkCategory;
  imageUrl?: string;
  themes: { slug: string; name: string }[];
  references: BibleReference[];
}

export interface ExploreRelatedChapter {
  chapter: number;
  chapterCount: number;
  coverImageUrl: string | null;
}

export interface ExploreData {
  book: {
    name: string;
    slug: string;
    testament: 'old' | 'new';
  };
  chapter: number;
  artworks: ExploreArtwork[];
  relatedChapters: ExploreRelatedChapter[];
  themes: ExploreTheme[];
}