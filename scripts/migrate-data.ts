import { createClient } from '@supabase/supabase-js'
import { artworks } from '../src/data/artworks'
import { bibleBooks } from '../src/data/bibleStructure'
import type { Database } from '../src/types/supabase'
import fs from 'fs'
import path from 'path'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

async function runSchema() {
  console.log('📋 Running database schema...')
  
  try {
    const schemaPath = path.join(process.cwd(), 'supabase/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split schema into individual statements and execute them
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql' as any, { sql: statement + ';' })
      if (error && !error.message.includes('already exists')) {
        console.warn('⚠️ Schema warning:', error.message)
      }
    }
    
    console.log('✅ Schema setup completed')
  } catch (error) {
    console.log('📝 Note: Schema should be run in Supabase SQL editor')
  }
}

async function migrateBibleBooks() {
  console.log('📖 Migrating bible books...')
  
  // Clear existing data
  const { error: clearError } = await supabase
    .from('bible_books')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
  if (clearError && !clearError.message.includes('No rows found')) {
    console.warn('⚠️ Warning clearing bible books:', clearError.message)
  }

  const booksToInsert = bibleBooks.map(book => ({
    name: book.name,
    slug: book.slug,
    chapters: book.chapters,
    testament: book.testament as 'old' | 'new'
  }))

  const { data, error } = await supabase
    .from('bible_books')
    .insert(booksToInsert)
    .select()

  if (error) {
    console.error('❌ Error inserting bible books:', error)
    return false
  }

  console.log(`✅ Inserted ${data.length} bible books`)
  return true
}

async function migrateArtworks() {
  console.log('🎨 Migrating artworks...')
  
  // Clear existing data
  const { error: clearError } = await supabase
    .from('artworks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
  if (clearError && !clearError.message.includes('No rows found')) {
    console.warn('⚠️ Warning clearing artworks:', clearError.message)
  }

  for (const artwork of artworks) {
    // Insert artwork
    const { data: artworkData, error: artworkError } = await supabase
      .from('artworks')
      .insert({
        title: artwork.title,
        artist_or_director: artwork.artistOrDirector,
        year: artwork.year?.toString() || null,
        category: artwork.category as 'painting' | 'music' | 'film',
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
      console.error(`❌ Error inserting artwork "${artwork.title}":`, artworkError)
      continue
    }

    // Insert bible references
    const referencesToInsert = artwork.references.map(ref => ({
      artwork_id: artworkData.id,
      book: ref.book,
      book_slug: ref.bookSlug,
      chapter: ref.chapter,
      verses: ref.verses || null,
    }))

    const { error: referencesError } = await supabase
      .from('bible_references')
      .insert(referencesToInsert)

    if (referencesError) {
      console.error(`❌ Error inserting references for "${artwork.title}":`, referencesError)
      continue
    }

    console.log(`✅ Migrated "${artwork.title}" with ${artwork.references.length} references`)
  }

  console.log(`🎉 Migration completed! Total artworks: ${artworks.length}`)
}

async function testConnection() {
  console.log('🔗 Testing connection and checking tables...')
  
  const { data, error } = await supabase
    .from('artworks')
    .select('count', { count: 'exact', head: true })

  if (error) {
    if (error.code === 'PGRST205') {
      console.error('❌ Database tables do not exist!')
      console.log('\n🏗️  Database setup required:')
      console.log('1. Go to: https://supabase.com/dashboard/projects')
      console.log('2. Find your project and open SQL Editor')
      console.log('3. Copy the entire contents of: supabase/schema.sql')
      console.log('4. Paste and execute in SQL Editor')
      console.log('5. Then run this migration again: npm run db:migrate')
      return false
    }
    console.error('❌ Connection failed:', error)
    return false
  }

  console.log('✅ Connection and tables verified!')
  return true
}

async function main() {
  console.log('🚀 Starting BiblianaArte.com data migration...')
  console.log('📍 Supabase URL:', supabaseUrl)
  
  // Test connection
  const connected = await testConnection()
  if (!connected) {
    console.error('❌ Cannot connect to database')
    process.exit(1)
  }

  try {
    // Run migrations
    await migrateBibleBooks()
    await migrateArtworks()
    
    console.log('\n🎊 Migration completed successfully!')
    console.log('📊 Summary:')
    console.log(`   - ${bibleBooks.length} bible books`)
    console.log(`   - ${artworks.length} artworks`)
    console.log(`   - ${artworks.reduce((total, a) => total + a.references.length, 0)} bible references`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}