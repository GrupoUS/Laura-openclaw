-- Hybrid Search Function with RRF Fusion
-- Combines BM25 and vector search using Reciprocal Rank Fusion

-- ============================================
-- Hybrid Search Function
-- ============================================
CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT,
    query_embedding vector(768),  -- Gemini 768d with MRL
    top_n INT DEFAULT 20,
    rrf_k INT DEFAULT 60,
    path_prefix TEXT DEFAULT NULL,
    mime_types TEXT[] DEFAULT NULL,
    modified_after TIMESTAMPTZ DEFAULT NULL,
    modified_before TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    file_id UUID,
    drive_file_id TEXT,
    file_name TEXT,
    file_path TEXT,
    content TEXT,
    heading TEXT,
    bm25_score FLOAT,
    vector_score FLOAT,
    rrf_score FLOAT
) AS $$
WITH
-- Apply file filters first
filtered_chunks AS (
    SELECT c.id, c.file_id, c.content, c.heading, c.embedding, f.file_id AS drive_file_id, f.name, f.path
    FROM chunks c
    JOIN files f ON c.file_id = f.id
    WHERE f.trashed = FALSE
        AND (path_prefix IS NULL OR f.path LIKE path_prefix || '%')
        AND (mime_types IS NULL OR f.mime_type = ANY(mime_types))
        AND (modified_after IS NULL OR f.modified_time >= modified_after)
        AND (modified_before IS NULL OR f.modified_time <= modified_before)
),
-- BM25 search using pg_textsearch <@> operator
-- Note: <@> returns NEGATIVE scores (lower = better match)
bm25_results AS (
    SELECT
        id AS chunk_id,
        file_id,
        drive_file_id,
        name AS file_name,
        path AS file_path,
        content,
        heading,
        -(content <@> to_bm25query(query_text, 'idx_chunks_bm25')) AS bm25_score,
        ROW_NUMBER() OVER (ORDER BY content <@> to_bm25query(query_text, 'idx_chunks_bm25')) AS bm25_rank
    FROM filtered_chunks
    WHERE content <@> to_bm25query(query_text, 'idx_chunks_bm25') < 0
    ORDER BY content <@> to_bm25query(query_text, 'idx_chunks_bm25')
    LIMIT top_n * 2
),
-- Vector similarity search using pgvector
vector_results AS (
    SELECT
        id AS chunk_id,
        file_id,
        drive_file_id,
        name AS file_name,
        path AS file_path,
        content,
        heading,
        1 - (embedding <=> query_embedding) AS vector_score,  -- Cosine similarity
        ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) AS vector_rank
    FROM filtered_chunks
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> query_embedding
    LIMIT top_n * 2
),
-- Combine with RRF fusion
combined AS (
    SELECT
        COALESCE(b.chunk_id, v.chunk_id) AS chunk_id,
        COALESCE(b.file_id, v.file_id) AS file_id,
        COALESCE(b.drive_file_id, v.drive_file_id) AS drive_file_id,
        COALESCE(b.file_name, v.file_name) AS file_name,
        COALESCE(b.file_path, v.file_path) AS file_path,
        COALESCE(b.content, v.content) AS content,
        COALESCE(b.heading, v.heading) AS heading,
        COALESCE(b.bm25_score, 0) AS bm25_score,
        COALESCE(v.vector_score, 0) AS vector_score,
        -- RRF formula: 1/(k + rank)
        COALESCE(1.0 / (rrf_k + b.bm25_rank), 0) +
        COALESCE(1.0 / (rrf_k + v.vector_rank), 0) AS rrf_score
    FROM bm25_results b
    FULL OUTER JOIN vector_results v ON b.chunk_id = v.chunk_id
)
SELECT
    chunk_id,
    file_id,
    drive_file_id,
    file_name,
    file_path,
    content,
    heading,
    bm25_score,
    vector_score,
    rrf_score
FROM combined
ORDER BY rrf_score DESC
LIMIT top_n;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- BM25-only search (for keyword queries)
-- ============================================
CREATE OR REPLACE FUNCTION bm25_search(
    query_text TEXT,
    top_n INT DEFAULT 20,
    path_prefix TEXT DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    file_id UUID,
    content TEXT,
    score FLOAT
) AS $$
SELECT
    c.id AS chunk_id,
    c.file_id,
    c.content,
    -(c.content <@> to_bm25query(query_text, 'idx_chunks_bm25')) AS score
FROM chunks c
JOIN files f ON c.file_id = f.id
WHERE f.trashed = FALSE
    AND c.content <@> to_bm25query(query_text, 'idx_chunks_bm25') < 0
    AND (path_prefix IS NULL OR f.path LIKE path_prefix || '%')
ORDER BY c.content <@> to_bm25query(query_text, 'idx_chunks_bm25')
LIMIT top_n;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Vector-only search (for semantic queries)
-- ============================================
CREATE OR REPLACE FUNCTION vector_search(
    query_embedding vector(768),  -- Gemini 768d with MRL
    top_n INT DEFAULT 20,
    path_prefix TEXT DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    file_id UUID,
    content TEXT,
    similarity FLOAT
) AS $$
SELECT
    c.id AS chunk_id,
    c.file_id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
FROM chunks c
JOIN files f ON c.file_id = f.id
WHERE f.trashed = FALSE
    AND c.embedding IS NOT NULL
    AND (path_prefix IS NULL OR f.path LIKE path_prefix || '%')
ORDER BY c.embedding <=> query_embedding
LIMIT top_n;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- Log successful migration
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 002_hybrid_search.sql completed successfully';
END $$;
