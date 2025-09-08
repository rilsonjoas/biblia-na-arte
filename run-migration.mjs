import { createClient } from '@supabase/supabase-js';
import { artworks } from './src/data/artworks.js';
import { bibleBooks } from './src/data/bibleStructure.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateBibleBooks() {
  console.log('📖 Migrating bible books...');
  
  // Clear existing data
  const { error: clearError } = await supabase
    .from('bible_books')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  if (clearError && !clearError.message.includes('No rows found')) {
    console.warn('⚠️ Warning clearing bible books:', clearError.message);
  }

  const booksToInsert = bibleBooks.map(book => ({
    name: book.name,
    slug: book.slug,
    chapters: book.chapters,
    testament: book.testament
  }));

  const { data, error } = await supabase
    .from('bible_books')
    .insert(booksToInsert)
    .select();

  if (error) {
    console.error('❌ Error inserting bible books:', error);
    return false;
  }

  console.log(`✅ Inserted ${data.length} bible books`);
  return true;
}

async function migrateArtworks() {
  console.log(`🎨 Migrating ${artworks.length} artworks...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < artworks.length; i++) {
    const artwork = artworks[i];
    
    if (i % 100 === 0) {
      console.log(`📊 Progress: ${i}/${artworks.length} (${Math.round((i/artworks.length)*100)}%)`);
    }
    
    try {
      // Insert artwork
      const { data: artworkData, error: artworkError } = await supabase
        .from('artworks')
        .insert({
          title: artwork.title,
          artist_or_director: artwork.artistOrDirector,
          year: artwork.year?.toString() || null,
          category: artwork.category,
          medium_or_genre: artwork.mediumOrGenre || null,
          description: artwork.description,
          image_url: artwork.imageUrl || null,
          embed_url: artwork.embedUrl || null,
          source_url: artwork.sourceUrl || null,
          dimensions_or_duration: artwork.dimensionsOrDuration || null,
        })
        .select()
        .single();

      if (artworkError) {
        console.error(`❌ Error inserting artwork "${artwork.title}":`, artworkError.message);
        errorCount++;
        continue;
      }

      // Insert bible references if any
      if (artwork.references && artwork.references.length > 0) {
        const referencesToInsert = artwork.references.map(ref => ({
          artwork_id: artworkData.id,
          book: ref.book,
          book_slug: ref.bookSlug,
          chapter: ref.chapter,
          verses: ref.verses || null,
        }));

        const { error: referencesError } = await supabase
          .from('bible_references')
          .insert(referencesToInsert);

        if (referencesError) {
          console.error(`❌ Error inserting references for "${artwork.title}":`, referencesError.message);
        }
      }

      successCount++;
    } catch (error) {
      console.error(`❌ Unexpected error with "${artwork.title}":`, error.message);
      errorCount++;
    }
  }

  console.log(`🎉 Migration completed! Success: ${successCount}, Errors: ${errorCount}`);
}

async function main() {
  console.log('🚀 Starting BiblianaArte.com data migration...');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('📊 Total artworks to migrate:', artworks.length);
  
  try {
    await migrateBibleBooks();
    await migrateArtworks();
    
    console.log('🎊 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();