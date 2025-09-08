import { supabase, handleSupabaseError } from './supabase'
import type { ArtworkWithReferences, BibleBookRow } from '@/types/supabase'
import type { Artwork, BibleBook } from '@/types'

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
  const { data, error } = await supabase
    .from('bible_books')
    .select('*')
    .order('testament', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching bible books:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!data) {
    throw new Error('No bible books found in database')
  }

  return data.map(transformBibleBook)
}

export async function getBibleBookBySlug(slug: string): Promise<BibleBook | undefined> {
  const { data, error } = await supabase
    .from('bible_books')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found
      return undefined
    }
    console.error('Error fetching bible book:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!data) {
    return undefined
  }

  return transformBibleBook(data)
}

export async function getArtworks(): Promise<Artwork[]> {
  // Get all artworks
  const { data: artworks, error: artworksError } = await supabase
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false })

  if (artworksError) {
    console.error('Error fetching artworks:', artworksError)
    throw new Error(handleSupabaseError(artworksError))
  }

  // Get all bible references
  const { data: references, error: referencesError } = await supabase
    .from('bible_references')
    .select('*')

  if (referencesError) {
    console.error('Error fetching references:', referencesError)
    throw new Error(handleSupabaseError(referencesError))
  }

  if (!artworks) {
    return []
  }

  // Combine artworks with their references
  const artworksWithReferences = artworks.map(artwork => ({
    ...artwork,
    bible_references: (references || []).filter(ref => ref.artwork_id === artwork.id)
  }))

  return artworksWithReferences.map(transformArtwork)
}

export async function getArtworkById(id: string): Promise<Artwork | undefined> {
  const { data: artwork, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return undefined
    }
    console.error('Error fetching artwork:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!artwork) {
    return undefined
  }

  // Get bible references for this artwork
  const { data: references, error: refError } = await supabase
    .from('bible_references')
    .select('*')
    .eq('artwork_id', id)

  if (refError) {
    console.error('Error fetching references for artwork:', refError)
    throw new Error(handleSupabaseError(refError))
  }

  // Combine artwork with its references
  const artworkWithReferences = {
    ...artwork,
    bible_references: references || []
  }

  return transformArtwork(artworkWithReferences)
}

export async function getArtworksByCategory(category: string): Promise<Artwork[]> {
  const { data: artworks, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching artworks by category:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!artworks) {
    return []
  }

  // Get bible references for these artworks
  const artworkIds = artworks.map(artwork => artwork.id)
  const { data: references, error: refError } = await supabase
    .from('bible_references')
    .select('*')
    .in('artwork_id', artworkIds)

  if (refError) {
    console.error('Error fetching references for category artworks:', refError)
    throw new Error(handleSupabaseError(refError))
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
}

export async function getArtworksByBibleReference(
  bookSlug: string,
  chapterNum?: number,
  verses?: string
): Promise<Artwork[]> {
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
    console.error('Error fetching artworks by bible reference:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!data) {
    return []
  }

  // Transform the data to match our expected format
  const transformedData = data.map(artwork => ({
    ...artwork,
    bible_references: artwork.bible_references || []
  }))

  return transformedData.map(transformArtwork)
}

export async function searchArtworks(query: string): Promise<Artwork[]> {
  if (!query.trim()) {
    return []
  }

  // Use the custom search function for better results
  const { data, error } = await supabase
    .rpc('search_artworks', { search_query: query })

  if (error) {
    console.error('Error searching artworks:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!data) {
    return []
  }

  // Get bible references for each artwork
  const artworkIds = data.map(artwork => artwork.id)
  
  const { data: references, error: refError } = await supabase
    .from('bible_references')
    .select('*')
    .in('artwork_id', artworkIds)

  if (refError) {
    console.error('Error fetching references for search results:', refError)
    throw new Error(handleSupabaseError(refError))
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
}

export async function getOldTestamentBooks(): Promise<BibleBook[]> {
  const { data, error } = await supabase
    .from('bible_books')
    .select('*')
    .eq('testament', 'old')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching old testament books:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!data) {
    return []
  }

  return data.map(transformBibleBook)
}

export async function getNewTestamentBooks(): Promise<BibleBook[]> {
  const { data, error } = await supabase
    .from('bible_books')
    .select('*')
    .eq('testament', 'new')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching new testament books:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!data) {
    return []
  }

  return data.map(transformBibleBook)
}

// Advanced search with filters

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
    console.error('Error in advanced search:', error)
    throw new Error(handleSupabaseError(error))
  }

  if (!artworks) {
    return []
  }

  // Get bible references for these artworks
  const artworkIds = artworks.map(artwork => artwork.id)
  const { data: references, error: refError } = await supabase
    .from('bible_references')
    .select('*')
    .in('artwork_id', artworkIds)

  if (refError) {
    console.error('Error fetching references for search results:', refError)
    throw new Error(handleSupabaseError(refError))
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

  // Client-side filtering for testament
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
}

// Update an artwork and its references
export async function updateArtwork(artwork: Artwork): Promise<void> {
  try {

    // First, update the artwork itself
    const { error: artworkError } = await supabase
      .from('artworks')
      .update({
        title: artwork.title,
        artist_or_director: artwork.artistOrDirector,
        year: artwork.year || null,
        category: artwork.category,
        medium_or_genre: artwork.mediumOrGenre || null,
        description: artwork.description,
        image_url: artwork.imageUrl || null,
        embed_url: artwork.embedUrl || null,
        source_url: artwork.sourceUrl || null,
        dimensions_or_duration: artwork.dimensionsOrDuration || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', artwork.id)

    if (artworkError) {
      console.error('Error updating artwork:', artworkError)
      throw new Error(handleSupabaseError(artworkError))
    }

    // Delete existing bible references
    const { error: deleteRefError } = await supabase
      .from('bible_references')
      .delete()
      .eq('artwork_id', artwork.id)

    if (deleteRefError) {
      console.error('Error deleting old bible references:', deleteRefError)
      throw new Error(handleSupabaseError(deleteRefError))
    }

    // Insert new bible references if any
    if (artwork.references.length > 0) {
      const referencesToInsert = artwork.references.map(ref => ({
        artwork_id: artwork.id,
        book: ref.book,
        book_slug: ref.bookSlug,
        chapter: ref.chapter,
        verses: ref.verses || null,
      }))

      const { error: insertRefError } = await supabase
        .from('bible_references')
        .insert(referencesToInsert)

      if (insertRefError) {
        console.error('Error inserting new bible references:', insertRefError)
        throw new Error(handleSupabaseError(insertRefError))
      }
    }

    console.log(`Artwork ${artwork.id} updated successfully`)
  } catch (error) {
    console.error('updateArtwork error:', error)
    throw error
  }
}

// Delete an artwork and its references
export async function deleteArtwork(id: string): Promise<void> {
  try {

    // First, delete all bible references for this artwork
    const { error: refError } = await supabase
      .from('bible_references')
      .delete()
      .eq('artwork_id', id)

    if (refError) {
      console.error('Error deleting bible references:', refError)
      throw new Error(handleSupabaseError(refError))
    }

    // Then delete the artwork itself
    const { error: artworkError } = await supabase
      .from('artworks')
      .delete()
      .eq('id', id)

    if (artworkError) {
      console.error('Error deleting artwork:', artworkError)
      throw new Error(handleSupabaseError(artworkError))
    }

    console.log(`Artwork ${id} deleted successfully`)
  } catch (error) {
    console.error('deleteArtwork error:', error)
    throw error
  }
}

// Create a new artwork with references
export async function createArtwork(artwork: Omit<Artwork, 'id'>): Promise<Artwork> {
  try {
    // First, create the artwork
    const { data: artworkData, error: artworkError } = await supabase
      .from('artworks')
      .insert({
        title: artwork.title,
        artist_or_director: artwork.artistOrDirector,
        year: artwork.year || null,
        category: artwork.category,
        medium_or_genre: artwork.mediumOrGenre || null,
        description: artwork.description,
        image_url: artwork.imageUrl || null,
        embed_url: artwork.embedUrl || null,
        source_url: artwork.sourceUrl || null,
        dimensions_or_duration: artwork.dimensionsOrDuration || null,
      })
      .select()
      .single()

    if (artworkError) {
      console.error('Error creating artwork:', artworkError)
      throw new Error(handleSupabaseError(artworkError))
    }

    if (!artworkData) {
      throw new Error('No artwork data returned after creation')
    }

    // Insert bible references if any
    if (artwork.references.length > 0) {
      const referencesToInsert = artwork.references.map(ref => ({
        artwork_id: artworkData.id,
        book: ref.book,
        book_slug: ref.bookSlug,
        chapter: ref.chapter,
        verses: ref.verses || null,
      }))

      const { error: insertRefError } = await supabase
        .from('bible_references')
        .insert(referencesToInsert)

      if (insertRefError) {
        console.error('Error inserting bible references:', insertRefError)
        throw new Error(handleSupabaseError(insertRefError))
      }
    }

    // Return the created artwork with references
    const createdArtwork: Artwork = {
      id: artworkData.id,
      title: artworkData.title,
      artistOrDirector: artworkData.artist_or_director,
      year: artworkData.year || undefined,
      category: artworkData.category,
      mediumOrGenre: artworkData.medium_or_genre || undefined,
      description: artworkData.description,
      imageUrl: artworkData.image_url || undefined,
      embedUrl: artworkData.embed_url || undefined,
      sourceUrl: artworkData.source_url || undefined,
      dimensionsOrDuration: artworkData.dimensions_or_duration || undefined,
      references: artwork.references,
    }

    console.log(`Artwork ${createdArtwork.id} created successfully`)
    return createdArtwork
  } catch (error) {
    console.error('createArtwork error:', error)
    throw error
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