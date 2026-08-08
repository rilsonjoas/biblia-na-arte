-- Funções e triggers que não são expressáveis no schema DSL do Drizzle.
-- Idempotente de propósito (CREATE OR REPLACE + DROP...IF EXISTS) — seguro
-- rodar de novo a cada deploy, via migrate.ts, depois das migrations
-- geradas pelo drizzle-kit.

-- Mantém updated_at em dia automaticamente em qualquer UPDATE.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_artworks_updated_at ON artworks;
CREATE TRIGGER update_artworks_updated_at
    BEFORE UPDATE ON artworks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Busca full-text em português com ranking, mesma lógica do schema.sql
-- original do Supabase (copiada 1:1 — é Postgres puro, nada específico
-- de PostgREST).
DROP FUNCTION IF EXISTS search_artworks(TEXT);
CREATE OR REPLACE FUNCTION search_artworks(search_query TEXT)
RETURNS TABLE(
    id UUID,
    title TEXT,
    subtitle TEXT,
    artist_or_director TEXT,
    year TEXT,
    category artwork_category,
    medium_or_genre TEXT,
    description TEXT,
    image_url TEXT,
    embed_url TEXT,
    source_url TEXT,
    dimensions_or_duration TEXT,
    license_type TEXT,
    attribution_text TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id, a.title, a.subtitle, a.artist_or_director, a.year, a.category,
        a.medium_or_genre, a.description, a.image_url, a.embed_url,
        a.source_url, a.dimensions_or_duration, a.license_type,
        a.attribution_text, a.created_at, a.updated_at,
        ts_rank(
            to_tsvector('portuguese',
                coalesce(a.title, '') || ' ' ||
                coalesce(a.subtitle, '') || ' ' ||
                coalesce(a.description, '') || ' ' ||
                coalesce(a.artist_or_director, '')
            ),
            plainto_tsquery('portuguese', search_query)
        ) as rank
    FROM artworks a
    WHERE to_tsvector('portuguese',
        coalesce(a.title, '') || ' ' ||
        coalesce(a.subtitle, '') || ' ' ||
        coalesce(a.description, '') || ' ' ||
        coalesce(a.artist_or_director, '')
    ) @@ plainto_tsquery('portuguese', search_query)
    ORDER BY rank DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql;
