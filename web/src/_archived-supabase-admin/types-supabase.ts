export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      artworks: {
        Row: {
          id: string
          title: string
          artist_or_director: string
          year: string | null
          category: 'painting' | 'music' | 'film'
          medium_or_genre: string | null
          description: string
          image_url: string | null
          embed_url: string | null
          source_url: string | null
          dimensions_or_duration: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          artist_or_director: string
          year?: string | null
          category: 'painting' | 'music' | 'film'
          medium_or_genre?: string | null
          description: string
          image_url?: string | null
          embed_url?: string | null
          source_url?: string | null
          dimensions_or_duration?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist_or_director?: string
          year?: string | null
          category?: 'painting' | 'music' | 'film'
          medium_or_genre?: string | null
          description?: string
          image_url?: string | null
          embed_url?: string | null
          source_url?: string | null
          dimensions_or_duration?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artworks_bible_references"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "bible_references"
            referencedColumns: ["artwork_id"]
          }
        ]
      }
      bible_references: {
        Row: {
          id: string
          artwork_id: string
          book: string
          book_slug: string
          chapter: number
          verses: string | null
          created_at: string
        }
        Insert: {
          id?: string
          artwork_id: string
          book: string
          book_slug: string
          chapter: number
          verses?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          artwork_id?: string
          book?: string
          book_slug?: string
          chapter?: number
          verses?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_references_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          }
        ]
      }
      bible_books: {
        Row: {
          id: string
          name: string
          slug: string
          chapters: number
          testament: 'old' | 'new'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          chapters: number
          testament: 'old' | 'new'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          chapters?: number
          testament?: 'old' | 'new'
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_artworks: {
        Args: {
          search_query: string
        }
        Returns: {
          id: string
          title: string
          artist_or_director: string
          year: string | null
          category: 'painting' | 'music' | 'film'
          medium_or_genre: string | null
          description: string
          image_url: string | null
          embed_url: string | null
          source_url: string | null
          dimensions_or_duration: string | null
          created_at: string
          updated_at: string
          rank: number
        }[]
      }
    }
    Enums: {
      artwork_category: 'painting' | 'music' | 'film'
      testament_type: 'old' | 'new'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type ArtworkRow = Database['public']['Tables']['artworks']['Row']
export type ArtworkInsert = Database['public']['Tables']['artworks']['Insert']
export type ArtworkUpdate = Database['public']['Tables']['artworks']['Update']

export type BibleReferenceRow = Database['public']['Tables']['bible_references']['Row']
export type BibleReferenceInsert = Database['public']['Tables']['bible_references']['Insert']

export type BibleBookRow = Database['public']['Tables']['bible_books']['Row']
export type BibleBookInsert = Database['public']['Tables']['bible_books']['Insert']

// Extended types with relationships
export type ArtworkWithReferences = ArtworkRow & {
  bible_references: BibleReferenceRow[]
}