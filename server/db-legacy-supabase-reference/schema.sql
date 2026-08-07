-- BiblianaArte.com Database Schema
-- Create tables for artworks, bible references, and bible books

-- Create custom types
CREATE TYPE artwork_category AS ENUM ('painting', 'music', 'film');
CREATE TYPE testament_type AS ENUM ('old', 'new');

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Bible Books Table
CREATE TABLE IF NOT EXISTS bible_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    chapters INTEGER NOT NULL CHECK (chapters > 0),
    testament testament_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artworks Table
CREATE TABLE IF NOT EXISTS artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_or_director TEXT NOT NULL,
    year TEXT,
    category artwork_category NOT NULL,
    medium_or_genre TEXT,
    description TEXT NOT NULL,
    image_url TEXT,
    embed_url TEXT,
    source_url TEXT,
    dimensions_or_duration TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bible References Table (junction table)
CREATE TABLE IF NOT EXISTS bible_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    book TEXT NOT NULL,
    book_slug TEXT NOT NULL,
    chapter INTEGER NOT NULL CHECK (chapter > 0),
    verses TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_artworks_category ON artworks(category);
CREATE INDEX IF NOT EXISTS idx_artworks_artist ON artworks(artist_or_director);
CREATE INDEX IF NOT EXISTS idx_artworks_year ON artworks(year);
CREATE INDEX IF NOT EXISTS idx_artworks_created_at ON artworks(created_at);

-- Full-text search indexes (Portuguese)
CREATE INDEX IF NOT EXISTS idx_artworks_search_title 
ON artworks USING gin(to_tsvector('portuguese', title));

CREATE INDEX IF NOT EXISTS idx_artworks_search_description 
ON artworks USING gin(to_tsvector('portuguese', description));

CREATE INDEX IF NOT EXISTS idx_artworks_search_artist 
ON artworks USING gin(to_tsvector('portuguese', artist_or_director));

-- Combined search index
CREATE INDEX IF NOT EXISTS idx_artworks_search_all 
ON artworks USING gin(
    to_tsvector('portuguese', 
        coalesce(title, '') || ' ' || 
        coalesce(description, '') || ' ' || 
        coalesce(artist_or_director, '')
    )
);

-- Bible references indexes
CREATE INDEX IF NOT EXISTS idx_bible_references_artwork_id ON bible_references(artwork_id);
CREATE INDEX IF NOT EXISTS idx_bible_references_book_slug ON bible_references(book_slug);
CREATE INDEX IF NOT EXISTS idx_bible_references_chapter ON bible_references(chapter);

-- Bible books indexes
CREATE INDEX IF NOT EXISTS idx_bible_books_slug ON bible_books(slug);
CREATE INDEX IF NOT EXISTS idx_bible_books_testament ON bible_books(testament);

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_artworks_updated_at 
    BEFORE UPDATE ON artworks 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Function for advanced search
CREATE OR REPLACE FUNCTION search_artworks(search_query TEXT)
RETURNS TABLE(
    id UUID,
    title TEXT,
    artist_or_director TEXT,
    year TEXT,
    category artwork_category,
    medium_or_genre TEXT,
    description TEXT,
    image_url TEXT,
    embed_url TEXT,
    source_url TEXT,
    dimensions_or_duration TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.artist_or_director,
        a.year,
        a.category,
        a.medium_or_genre,
        a.description,
        a.image_url,
        a.embed_url,
        a.source_url,
        a.dimensions_or_duration,
        a.created_at,
        a.updated_at,
        ts_rank(
            to_tsvector('portuguese', 
                coalesce(a.title, '') || ' ' || 
                coalesce(a.description, '') || ' ' || 
                coalesce(a.artist_or_director, '')
            ),
            plainto_tsquery('portuguese', search_query)
        ) as rank
    FROM artworks a
    WHERE to_tsvector('portuguese', 
        coalesce(a.title, '') || ' ' || 
        coalesce(a.description, '') || ' ' || 
        coalesce(a.artist_or_director, '')
    ) @@ plainto_tsquery('portuguese', search_query)
    ORDER BY rank DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_books ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow read access to artworks" ON artworks
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to bible_references" ON bible_references
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to bible_books" ON bible_books
    FOR SELECT USING (true);

-- Insert/Update/Delete policies can be added later for admin functionality

-- Create a view for artworks with their bible references
CREATE OR REPLACE VIEW artworks_with_references
WITH (security_invoker = true) AS
SELECT 
    a.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', br.id,
                'book', br.book,
                'book_slug', br.book_slug,
                'chapter', br.chapter,
                'verses', br.verses
            )
        ) FILTER (WHERE br.id IS NOT NULL),
        '[]'::json
    ) as bible_references
FROM artworks a
LEFT JOIN bible_references br ON a.id = br.artwork_id
GROUP BY a.id, a.title, a.artist_or_director, a.year, a.category, 
         a.medium_or_genre, a.description, a.image_url, a.embed_url, 
         a.source_url, a.dimensions_or_duration, a.created_at, a.updated_at;

-- Grant permissions for the view
GRANT SELECT ON artworks_with_references TO anon;
GRANT SELECT ON artworks_with_references TO authenticated;