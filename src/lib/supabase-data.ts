import { supabase, handleSupabaseError } from './supabase'
import type { ArtworkWithReferences, BibleBookRow } from '@/types/supabase'
import type { Artwork, BibleBook } from '@/types'
import { artworks as staticArtworks } from '@/data/artworks'
import { bibleBooks as staticBibleBooks } from '@/data/bibleStructure'

// Transform Supabase data to match our existing interfaces
function transformArtwork(artwork: ArtworkWithReferences): Artwork {
  return {
    id: artwork.id,
    title: artwork.title,
    artistOrDirector: artwork.artist_or_director,
    year: artwork.year || undefined,
    category: artwork.category,
    mediumOrGenre: artwork.medium_or_genre || undefined,
    description: artwork.description,
    imageUrl: artwork.image_url || undefined,
    embedUrl: artwork.embed_url || undefined,
    sourceUrl: artwork.source_url || undefined,
    dimensionsOrDuration: artwork.dimensions_or_duration || undefined,
    references: artwork.bible_references.map(ref => ({
      book: ref.book,
      bookSlug: ref.book_slug,
      chapter: ref.chapter,
      verses: ref.verses || undefined,
    })),
  }
}

function transformBibleBook(book: BibleBookRow): BibleBook {
  return {
    name: book.name,
    slug: book.slug,
    chapters: book.chapters,
    testament: book.testament,
  }
}

export async function getBibleBooks(): Promise<BibleBook[]> {
  try {
    const { data, error } = await supabase
      .from('bible_books')
      .select('*')
      .order('testament', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data')
        return staticBibleBooks
      }
      console.error('Error fetching bible books:', error)
      throw new Error(handleSupabaseError(error))
    }

    // If database is empty, use fallback data
    if (!data || data.length === 0) {
      console.warn('Bible books table is empty, using fallback data')
      return staticBibleBooks
    }

    return data.map(transformBibleBook)
  } catch (error) {
    console.error('getBibleBooks error, using fallback:', error)
    return staticBibleBooks
  }
}

export async function getBibleBookBySlug(slug: string): Promise<BibleBook | undefined> {
  try {
    const { data, error } = await supabase
      .from('bible_books')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found - try fallback
        console.warn('Bible book not found in database, using fallback data')
        return staticBibleBooks.find(book => book.slug === slug)
      }
      if (error.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data')
        return staticBibleBooks.find(book => book.slug === slug)
      }
      console.error('Error fetching bible book:', error)
      throw new Error(handleSupabaseError(error))
    }

    // If no data returned (empty table), use fallback
    if (!data) {
      console.warn('Bible book data is empty, using fallback data')
      return staticBibleBooks.find(book => book.slug === slug)
    }

    return transformBibleBook(data)
  } catch (error) {
    console.error('getBibleBookBySlug error, using fallback:', error)
    return staticBibleBooks.find(book => book.slug === slug)
  }
}

export async function getArtworks(): Promise<Artwork[]> {
  try {
    // First, try to get all artworks
    const { data: artworks, error: artworksError } = await supabase
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false })

    if (artworksError) {
      if (artworksError.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data')
        return staticArtworks
      }
      console.error('Error fetching artworks:', artworksError)
      throw new Error(handleSupabaseError(artworksError))
    }

    // Then get all bible references
    const { data: references, error: referencesError } = await supabase
      .from('bible_references')
      .select('*')

    if (referencesError) {
      console.warn('Error fetching references:', referencesError)
    }

    // If database is empty, use fallback data
    if (!artworks || artworks.length === 0) {
      console.warn('Database tables are empty, using fallback data')
      return staticArtworks
    }

    // Combine artworks with their references
    const artworksWithReferences = artworks.map(artwork => ({
      ...artwork,
      bible_references: (references || []).filter(ref => ref.artwork_id === artwork.id)
    }))

    return artworksWithReferences.map(transformArtwork)
  } catch (error) {
    console.error('getArtworks error, using fallback:', error)
    return staticArtworks
  }
}

export async function getArtworkById(id: string): Promise<Artwork | undefined> {
  try {
    const { data: artwork, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined
      }
      if (error.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data')
        return staticArtworks.find(artwork => artwork.id === id)
      }
      console.error('Error fetching artwork:', error)
      throw new Error(handleSupabaseError(error))
    }

    // Get bible references for this artwork
    const { data: references, error: refError } = await supabase
      .from('bible_references')
      .select('*')
      .eq('artwork_id', id)

    if (refError) {
      console.warn('Error fetching references for artwork:', refError)
    }

    // Combine artwork with its references
    const artworkWithReferences = {
      ...artwork,
      bible_references: references || []
    }

    return transformArtwork(artworkWithReferences)
  } catch (error) {
    console.error('getArtworkById error, using fallback:', error)
    return staticArtworks.find(artwork => artwork.id === id)
  }
}

export async function getArtworksByCategory(category: string): Promise<Artwork[]> {
  try {
    const { data: artworks, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data')
        return staticArtworks.filter(artwork => artwork.category === category)
      }
      console.error('Error fetching artworks by category:', error)
      throw new Error(handleSupabaseError(error))
    }

    // If database is empty, use fallback data
    if (!artworks || artworks.length === 0) {
      console.warn(`Category ${category} table is empty, using fallback data`)
      return staticArtworks.filter(artwork => artwork.category === category)
    }

    // Get bible references for these artworks
    const artworkIds = artworks.map(artwork => artwork.id)
    const { data: references, error: refError } = await supabase
      .from('bible_references')
      .select('*')
      .in('artwork_id', artworkIds)

    if (refError) {
      console.warn('Error fetching references for category artworks:', refError)
    }

    // Group references by artwork_id
    const referencesByArtwork = (references || []).reduce((acc, ref) => {
      if (!acc[ref.artwork_id]) {
        acc[ref.artwork_id] = []
      }
      acc[ref.artwork_id].push(ref)
      return acc
    }, {} as Record<string, any[]>)

    // Combine artworks with their references
    const artworksWithReferences = artworks.map(artwork => ({
      ...artwork,
      bible_references: referencesByArtwork[artwork.id] || []
    }))

    return artworksWithReferences.map(transformArtwork)
  } catch (error) {
    console.error('getArtworksByCategory error, using fallback:', error)
    return staticArtworks.filter(artwork => artwork.category === category)
  }
}

export async function getArtworksByBibleReference(
  bookSlug: string,
  chapterNum?: number,
  verses?: string
): Promise<Artwork[]> {
  try {
    let query = supabase
      .from('artworks')
      .select(`
        *,
        bible_references!inner(
          id, book, book_slug, chapter, verses
        )
      `)
      .eq('bible_references.book_slug', bookSlug)

    if (chapterNum !== undefined) {
      query = query.eq('bible_references.chapter', chapterNum)
    }

    if (verses !== undefined) {
      query = query.eq('bible_references.verses', verses)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data for bible reference')
        return staticArtworks.filter(artwork => 
          artwork.references.some(ref => 
            ref.bookSlug === bookSlug &&
            (chapterNum === undefined || ref.chapter === chapterNum) &&
            (verses === undefined || ref.verses === verses)
          )
        )
      }
      console.error('Error fetching artworks by bible reference:', error)
      throw new Error(handleSupabaseError(error))
    }

    // If database is empty, use fallback data
    if (!data || data.length === 0) {
      console.warn(`Bible reference ${bookSlug} table is empty, using fallback data`)
      return staticArtworks.filter(artwork => 
        artwork.references.some(ref => 
          ref.bookSlug === bookSlug &&
          (chapterNum === undefined || ref.chapter === chapterNum) &&
          (verses === undefined || ref.verses === verses)
        )
      )
    }

    // Transform the data to match our expected format
    const transformedData = data.map(artwork => ({
      ...artwork,
      bible_references: artwork.bible_references || []
    }))

    return transformedData.map(transformArtwork)
  } catch (error) {
    console.error('getArtworksByBibleReference error, using fallback:', error)
    return staticArtworks.filter(artwork => 
      artwork.references.some(ref => 
        ref.bookSlug === bookSlug &&
        (chapterNum === undefined || ref.chapter === chapterNum) &&
        (verses === undefined || ref.verses === verses)
      )
    )
  }
}

export async function searchArtworks(query: string): Promise<Artwork[]> {
  if (!query.trim()) {
    return []
  }

  try {
    // Use the custom search function for better results
    const { data, error } = await supabase
      .rpc('search_artworks', { search_query: query })

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST202') {
        console.warn('Database search function not found, using fallback data')
        const lowerQuery = query.toLowerCase()
        return staticArtworks.filter(artwork => 
          artwork.title.toLowerCase().includes(lowerQuery) ||
          artwork.artistOrDirector.toLowerCase().includes(lowerQuery) ||
          artwork.description.toLowerCase().includes(lowerQuery) ||
          (artwork.mediumOrGenre && artwork.mediumOrGenre.toLowerCase().includes(lowerQuery))
        )
      }
      console.error('Error searching artworks:', error)
      throw new Error(handleSupabaseError(error))
    }

    // Get bible references for each artwork
    const artworkIds = data.map(artwork => artwork.id)
    
    const { data: references, error: refError } = await supabase
      .from('bible_references')
      .select('*')
      .in('artwork_id', artworkIds)

    if (refError) {
      console.warn('Error fetching references for search results:', refError)
    }

    // Group references by artwork_id
    const referencesByArtwork = (references || []).reduce((acc, ref) => {
      if (!acc[ref.artwork_id]) {
        acc[ref.artwork_id] = []
      }
      acc[ref.artwork_id].push(ref)
      return acc
    }, {} as Record<string, any[]>)

    // Combine artwork data with references
    const artworksWithReferences = data.map(artwork => ({
      ...artwork,
      bible_references: referencesByArtwork[artwork.id] || []
    }))

    return artworksWithReferences.map(transformArtwork)
  } catch (error) {
    console.error('searchArtworks error, using fallback:', error)
    const lowerQuery = query.toLowerCase()
    return staticArtworks.filter(artwork => 
      artwork.title.toLowerCase().includes(lowerQuery) ||
      artwork.artistOrDirector.toLowerCase().includes(lowerQuery) ||
      artwork.description.toLowerCase().includes(lowerQuery) ||
      (artwork.mediumOrGenre && artwork.mediumOrGenre.toLowerCase().includes(lowerQuery))
    )
  }
}

export async function getOldTestamentBooks(): Promise<BibleBook[]> {
  try {
    const { data, error } = await supabase
      .from('bible_books')
      .select('*')
      .eq('testament', 'old')
      .order('name', { ascending: true })

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data')
        return staticBibleBooks.filter(book => book.testament === 'old')
      }
      console.error('Error fetching old testament books:', error)
      throw new Error(handleSupabaseError(error))
    }

    // If database is empty, use fallback data
    if (!data || data.length === 0) {
      console.warn('Old testament books table is empty, using fallback data')
      return staticBibleBooks.filter(book => book.testament === 'old')
    }

    return data.map(transformBibleBook)
  } catch (error) {
    console.error('getOldTestamentBooks error, using fallback:', error)
    return staticBibleBooks.filter(book => book.testament === 'old')
  }
}

export async function getNewTestamentBooks(): Promise<BibleBook[]> {
  try {
    const { data, error } = await supabase
      .from('bible_books')
      .select('*')
      .eq('testament', 'new')
      .order('name', { ascending: true })

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data')
        return staticBibleBooks.filter(book => book.testament === 'new')
      }
      console.error('Error fetching new testament books:', error)
      throw new Error(handleSupabaseError(error))
    }

    // If database is empty, use fallback data
    if (!data || data.length === 0) {
      console.warn('New testament books table is empty, using fallback data')
      return staticBibleBooks.filter(book => book.testament === 'new')
    }

    return data.map(transformBibleBook)
  } catch (error) {
    console.error('getNewTestamentBooks error, using fallback:', error)
    return staticBibleBooks.filter(book => book.testament === 'new')
  }
}

// Helper function for client-side search when database is not available
function performClientSideSearch(query: string, filters: SearchFilters): Artwork[] {
  let results = [...staticArtworks]
  
  // Apply text search if query provided
  if (query.trim()) {
    const lowerQuery = query.toLowerCase()
    results = results.filter(artwork => 
      artwork.title.toLowerCase().includes(lowerQuery) ||
      artwork.artistOrDirector.toLowerCase().includes(lowerQuery) ||
      artwork.description.toLowerCase().includes(lowerQuery) ||
      (artwork.mediumOrGenre && artwork.mediumOrGenre.toLowerCase().includes(lowerQuery))
    )
  }
  
  // Apply filters
  if (filters.category) {
    results = results.filter(artwork => artwork.category === filters.category)
  }

  if (filters.artist) {
    const lowerArtist = filters.artist.toLowerCase()
    results = results.filter(artwork => 
      artwork.artistOrDirector.toLowerCase().includes(lowerArtist)
    )
  }

  // Client-side filtering for testament
  if (filters.testament) {
    const testamentBooks = staticBibleBooks
      .filter(book => book.testament === filters.testament)
      .map(book => book.slug)
    
    results = results.filter(artwork =>
      artwork.references.some(ref => testamentBooks.includes(ref.bookSlug))
    )
  }

  return results.slice(0, 50) // Reasonable limit
}

// Advanced search with filters
export interface SearchFilters {
  category?: string
  testament?: 'old' | 'new'
  artist?: string
  yearFrom?: number
  yearTo?: number
}

export async function searchArtworksAdvanced(
  query: string,
  filters: SearchFilters = {}
): Promise<Artwork[]> {
  try {
    let dbQuery = supabase
      .from('artworks')
      .select('*')

    // Apply text search if query provided
    if (query.trim()) {
      dbQuery = dbQuery.textSearch('title', query, { type: 'websearch' })
    }

    // Apply filters
    if (filters.category) {
      dbQuery = dbQuery.eq('category', filters.category)
    }

    if (filters.artist) {
      dbQuery = dbQuery.ilike('artist_or_director', `%${filters.artist}%`)
    }

    const { data: artworks, error } = await dbQuery
      .order('created_at', { ascending: false })
      .limit(50) // Reasonable limit

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Database tables not found, using fallback data for advanced search')
        return performClientSideSearch(query, filters)
      }
      console.error('Error in advanced search:', error)
      throw new Error(handleSupabaseError(error))
    }

    // If database is empty, use fallback data
    if (!artworks || artworks.length === 0) {
      console.warn('Advanced search table is empty, using fallback data')
      return performClientSideSearch(query, filters)
    }

    // Get bible references for these artworks
    const artworkIds = artworks.map(artwork => artwork.id)
    const { data: references, error: refError } = await supabase
      .from('bible_references')
      .select('*')
      .in('artwork_id', artworkIds)

    if (refError) {
      console.warn('Error fetching references for search results:', refError)
    }

    // Group references by artwork_id
    const referencesByArtwork = (references || []).reduce((acc, ref) => {
      if (!acc[ref.artwork_id]) {
        acc[ref.artwork_id] = []
      }
      acc[ref.artwork_id].push(ref)
      return acc
    }, {} as Record<string, any[]>)

    // Combine artworks with their references
    const artworksWithReferences = artworks.map(artwork => ({
      ...artwork,
      bible_references: referencesByArtwork[artwork.id] || []
    }))

    let results = artworksWithReferences.map(transformArtwork)

    // Client-side filtering for testament (temporary solution)
    if (filters.testament) {
      const testamentBooks = await (filters.testament === 'old' 
        ? getOldTestamentBooks() 
        : getNewTestamentBooks())
      const testamentSlugs = testamentBooks.map(book => book.slug)
      
      results = results.filter(artwork =>
        artwork.references.some(ref => testamentSlugs.includes(ref.bookSlug))
      )
    }

    return results
  } catch (error) {
    console.error('searchArtworksAdvanced error, using fallback:', error)
    return performClientSideSearch(query, filters)
  }
}

// Statistics and analytics
export async function getArtworkStats() {
  try {
    const { data: artworks, error: artworkError } = await supabase
      .from('artworks')
      .select('category')

    const { data: references, error: refError } = await supabase
      .from('bible_references')
      .select('id')

    if (artworkError || refError) {
      throw new Error('Error fetching stats')
    }

    const categoryStats = artworks.reduce((acc, artwork) => {
      acc[artwork.category] = (acc[artwork.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalArtworks: artworks.length,
      totalReferences: references.length,
      byCategory: categoryStats,
    }
  } catch (error) {
    console.error('getArtworkStats error:', error)
    throw error
  }
}