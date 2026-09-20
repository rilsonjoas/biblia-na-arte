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

-- unaccent: pra busca ignorar acento ("genesis" achar "Gênesis") — muito
-- comum digitar sem acento no celular. Extensão builtin do Postgres,
-- idempotente (IF NOT EXISTS).
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Busca full-text em português com ranking. Reescrita 2026-08-22 —
-- versão original (schema.sql do Supabase, copiada 1:1) tinha 3
-- problemas reais reportados pelo Rilson:
--
-- 1. "Preciso digitar a palavra inteira pra achar a obra" —
--    plainto_tsquery exige o STEM da palavra completa batendo exato
--    ("lamen" nunca casava com "Lamentando", só "lamentando"/"lamento"
--    completos casariam). Trocado por to_tsquery com sufixo :* (prefix
--    match) em cada termo — padrão usado por qualquer busca
--    "conforme digita" sobre tsvector do Postgres.
-- 2. "A busca só acha por livro OU por obra, nunca os 2" — o texto
--    pesquisável não incluía as referências bíblicas da obra
--    (tabela bible_references), só título/subtítulo/descrição/artista.
--    Uma obra sobre Gênesis só aparecia buscando o que está escrito NA
--    descrição, nunca buscando "Gênesis" em si, mesmo com a referência
--    cadastrada. Agora agrega os livros referenciados (LEFT JOIN
--    LATERAL) no texto pesquisável também.
-- 3. Busca sem acento não achava nada ("genesis" não achava "Gênesis")
--    — comum digitar sem acento no celular. unaccent() nos dois lados
--    (documento indexado e query) resolve.
DROP FUNCTION IF EXISTS search_artworks(TEXT);
CREATE OR REPLACE FUNCTION search_artworks(search_query TEXT)
RETURNS TABLE(
    id UUID,
    slug TEXT,
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
    location TEXT,
    classic_commentary_author TEXT,
    classic_commentary TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    active BOOLEAN,
    rank REAL
) AS $$
DECLARE
    tsquery_text TEXT;
    parsed_query tsquery;
BEGIN
    -- Sanitiza: mantém só letras (com acento), números e espaço — remove
    -- caracteres com significado especial pro parser de tsquery
    -- (&, |, !, (, ), :, ', ") que dariam erro de sintaxe vindos de
    -- input livre do usuário.
    tsquery_text := trim(regexp_replace(unaccent(search_query), '[^[:alnum:] ]', ' ', 'g'));
    tsquery_text := trim(regexp_replace(tsquery_text, '\s+', ' ', 'g'));

    IF tsquery_text = '' THEN
        RETURN;
    END IF;

    -- Cada termo vira prefixo (:*), termos entre si em AND (&) — busca
    -- "conforme digita": query com N palavras exige as N presentes,
    -- cada uma podendo estar incompleta.
    parsed_query := to_tsquery('portuguese', regexp_replace(tsquery_text, ' ', ':* & ', 'g') || ':*');

    RETURN QUERY
    SELECT
        a.id, a.slug, a.title, a.subtitle, a.artist_or_director, a.year, a.category,
        a.medium_or_genre, a.description, a.image_url, a.embed_url,
        a.source_url, a.dimensions_or_duration, a.license_type,
        a.attribution_text, a.location, a.classic_commentary_author,
        a.classic_commentary, a.created_at, a.updated_at, a.active,
        ts_rank(
            to_tsvector('portuguese', unaccent(
                coalesce(a.title, '') || ' ' ||
                coalesce(a.subtitle, '') || ' ' ||
                coalesce(a.description, '') || ' ' ||
                coalesce(a.artist_or_director, '') || ' ' ||
                coalesce(refs.books, '')
            )),
            parsed_query
        ) as rank
    FROM artworks a
    LEFT JOIN LATERAL (
        SELECT string_agg(DISTINCT br.book, ' ') AS books
        FROM bible_references br
        WHERE br.artwork_id = a.id
    ) refs ON true
    WHERE to_tsvector('portuguese', unaccent(
        coalesce(a.title, '') || ' ' ||
        coalesce(a.subtitle, '') || ' ' ||
        coalesce(a.description, '') || ' ' ||
        coalesce(a.artist_or_director, '') || ' ' ||
        coalesce(refs.books, '')
    )) @@ parsed_query
    ORDER BY rank DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql;
