-- ==============================================================================
-- Seniors' Wisdom / Senior Signal Exchange
-- PostgreSQL + pgvector Schema for Storing Tips with Semantic Embeddings
-- ==============================================================================

-- 1. Enable pgvector extension (and uuid extension for primary keys)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing table if recreating (uncomment if needed)
-- DROP TABLE IF EXISTS tips CASCADE;

-- 3. Create tips table
-- Contains category, contextual fields (course name/code, professor, company),
-- author batch, anonymity option, and pgvector embedding.
-- NOTE: As requested, 'upvotes' and 'status' columns have been excluded.
CREATE TABLE IF NOT EXISTS tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,            -- 'course', 'professor', 'company', 'general'
    course_code VARCHAR(100),                 -- e.g. 'OS', 'DBMS', 'CS301'
    course_name VARCHAR(255),                 -- e.g. 'Operating Systems'
    professor VARCHAR(255),                   -- e.g. 'Prof. Meera Iyer'
    company VARCHAR(255),                     -- e.g. 'Amazon', 'Google'
    author_batch VARCHAR(50),                 -- e.g. '2023 batch', '2025 batch'
    anonymous BOOLEAN NOT NULL DEFAULT false, -- Option to be anonymous or verified
    embedding vector(1536),                   -- 1536-dimensional embedding vector (e.g. OpenAI text-embedding-3-small)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. Indexes
-- ==============================================================================

-- High-performance HNSW index for cosine distance vector search (<=> operator)
CREATE INDEX IF NOT EXISTS tips_embedding_hnsw_idx 
ON tips 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- B-tree indexes for fast filtering and sorting
CREATE INDEX IF NOT EXISTS tips_category_idx ON tips(category);
CREATE INDEX IF NOT EXISTS tips_course_code_idx ON tips(course_code);
CREATE INDEX IF NOT EXISTS tips_course_name_idx ON tips(course_name);
CREATE INDEX IF NOT EXISTS tips_professor_idx ON tips(professor);
CREATE INDEX IF NOT EXISTS tips_company_idx ON tips(company);
CREATE INDEX IF NOT EXISTS tips_created_at_idx ON tips(created_at DESC);
CREATE INDEX IF NOT EXISTS tips_author_id_idx ON tips(author_id);

-- ==============================================================================
-- 5. Helper Functions
-- ==============================================================================

-- A. Format composite text representation for embedding generation
-- Formats (tip, category, course name, professor, company) into a single standard string.
CREATE OR REPLACE FUNCTION format_tip_for_embedding(
    p_category VARCHAR,
    p_course_name VARCHAR,
    p_course_code VARCHAR,
    p_professor VARCHAR,
    p_company VARCHAR,
    p_text TEXT
)
RETURNS TEXT
IMMUTABLE
LANGUAGE sql
AS $$
    SELECT CONCAT_WS(' | ',
        'Category: ' || COALESCE(NULLIF(p_category, ''), 'general'),
        CASE 
            WHEN p_course_name IS NOT NULL AND p_course_code IS NOT NULL AND p_course_name <> p_course_code 
                THEN 'Course: ' || p_course_name || ' (' || p_course_code || ')'
            WHEN p_course_name IS NOT NULL THEN 'Course: ' || p_course_name
            WHEN p_course_code IS NOT NULL THEN 'Course: ' || p_course_code
            ELSE NULL 
        END,
        CASE WHEN p_professor IS NOT NULL AND p_professor <> '' THEN 'Professor: ' || p_professor ELSE NULL END,
        CASE WHEN p_company IS NOT NULL AND p_company <> '' THEN 'Company: ' || p_company ELSE NULL END,
        'Tip: ' || COALESCE(p_text, '')
    );
$$;

-- B. Semantic Similarity Search Function using pgvector cosine distance (<=>)
CREATE OR REPLACE FUNCTION match_tips(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 10,
    filter_category varchar(50) DEFAULT NULL,
    filter_course varchar(100) DEFAULT NULL,
    filter_company varchar(150) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    text TEXT,
    category VARCHAR(50),
    course_code VARCHAR(100),
    course_name VARCHAR(255),
    professor VARCHAR(255),
    company VARCHAR(255),
    author_batch VARCHAR(50),
    anonymous BOOLEAN,
    similarity FLOAT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.author_id,
        t.text,
        t.category,
        t.course_code,
        t.course_name,
        t.professor,
        t.company,
        t.author_batch,
        t.anonymous,
        ROUND((1 - (t.embedding <=> query_embedding))::numeric, 4)::float AS similarity,
        t.created_at
    FROM tips t
    WHERE 
        t.embedding IS NOT NULL
        AND (filter_category IS NULL OR t.category = filter_category)
        AND (filter_course IS NULL OR t.course_code = filter_course OR t.course_name = filter_course)
        AND (filter_company IS NULL OR t.company = filter_company)
        AND (1 - (t.embedding <=> query_embedding)) > match_threshold
    ORDER BY t.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ==============================================================================
-- 6. Sample Data (Matching the Claude screenshot example)
-- ==============================================================================

-- Example 1: Course tip (OS xv6 labs, anonymous: true, 2023 batch)
INSERT INTO tips (
    id,
    author_id,
    text,
    category,
    course_code,
    course_name,
    professor,
    company,
    author_batch,
    anonymous,
    created_at
) VALUES (
    '9b1c4e7a-e490-449e-b9e7-78921a2c1d34',
    '3f2a8742-cbf1-4ef8-a53d-82d2c129e841',
    'Do all the xv6 labs, they''re half the exam',
    'course',
    'OS',
    'Operating Systems',
    NULL,
    NULL,
    '2023 batch',
    true,
    '2026-11-15 10:42:00+00'
) ON CONFLICT (id) DO NOTHING;

-- Example 2: Professor tip
INSERT INTO tips (
    id,
    author_id,
    text,
    category,
    course_code,
    course_name,
    professor,
    company,
    author_batch,
    anonymous,
    created_at
) VALUES (
    'a1b2c3d4-1111-2222-3333-444455556666',
    '8f7e6d5c-9999-8888-7777-666655554444',
    'Prof. Iyer frames end-sem questions straight from textbook end-of-chapter exercises, especially deadlock and paging numericals.',
    'professor',
    'OS',
    'Operating Systems',
    'Prof. Meera Iyer',
    NULL,
    '2024 batch',
    false,
    now()
) ON CONFLICT (id) DO NOTHING;

-- Example 3: Company placement tip
INSERT INTO tips (
    id,
    author_id,
    text,
    category,
    course_code,
    course_name,
    professor,
    company,
    author_batch,
    anonymous,
    created_at
) VALUES (
    'b2c3d4e5-2222-3333-4444-555566667777',
    '7e6d5c4b-8888-7777-6666-555544443333',
    'Amazon online assessment focuses heavily on 2 Medium LeetCode problems and the Work Style simulation. Be thorough with STAR format for leadership principles.',
    'company',
    NULL,
    NULL,
    NULL,
    'Amazon',
    '2025 batch',
    true,
    now()
) ON CONFLICT (id) DO NOTHING;
