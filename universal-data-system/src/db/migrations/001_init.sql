-- Universal Data System - Database Schema
-- PostgreSQL 17 with pgvector and pg_textsearch extensions

-- ============================================
-- Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_textsearch;

-- ============================================
-- Drive Accounts (OAuth tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS drive_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMPTZ NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_drive_accounts_email ON drive_accounts(user_email);

-- ============================================
-- Drive Channels (Webhook channels)
-- ============================================
CREATE TABLE IF NOT EXISTS drive_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES drive_accounts(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL UNIQUE,
    resource_id TEXT NOT NULL,
    token TEXT NOT NULL,  -- Validation token
    expiration TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for expiration-based renewal queries
CREATE INDEX IF NOT EXISTS idx_drive_channels_expiration ON drive_channels(expiration);
CREATE INDEX IF NOT EXISTS idx_drive_channels_account ON drive_channels(account_id);

-- ============================================
-- Drive State (Sync state per account)
-- ============================================
CREATE TABLE IF NOT EXISTS drive_state (
    account_id UUID PRIMARY KEY REFERENCES drive_accounts(id) ON DELETE CASCADE,
    start_page_token TEXT NOT NULL,
    last_page_token TEXT NOT NULL,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Files (Indexed Drive files)
-- ============================================
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES drive_accounts(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL,  -- Google Drive file ID
    name TEXT NOT NULL,
    path TEXT NOT NULL,  -- Full path in Drive
    mime_type TEXT NOT NULL,
    modified_time TIMESTAMPTZ NOT NULL,
    content_hash TEXT,  -- MD5 hash for change detection
    owners TEXT[] DEFAULT '{}',
    size_bytes BIGINT,
    is_oversized BOOLEAN NOT NULL DEFAULT FALSE,
    trashed BOOLEAN NOT NULL DEFAULT FALSE,
    extraction_error TEXT,  -- Last extraction error if any
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(account_id, file_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_files_account ON files(account_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_modified ON files(modified_time DESC);
CREATE INDEX IF NOT EXISTS idx_files_mime ON files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_trashed ON files(trashed) WHERE trashed = FALSE;

-- ============================================
-- Chunks (Text chunks with embeddings)
-- ============================================
CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    start_offset INT,
    end_offset INT,
    heading TEXT,  -- Preserve document structure
    content_hash TEXT NOT NULL,  -- For embedding cache
    embedding vector(768),  -- Gemini text-embedding-004 with MRL  -- OpenAI dimensions
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(file_id, chunk_index)
);

-- Index for file lookup
CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_id);

-- HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 128);

-- BM25 index for full-text search
CREATE INDEX IF NOT EXISTS idx_chunks_bm25 ON chunks
    USING bm25(content)
    WITH (text_config = 'portuguese');

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE OR REPLACE TRIGGER update_drive_accounts_updated_at
    BEFORE UPDATE ON drive_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_drive_state_updated_at
    BEFORE UPDATE ON drive_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Log successful migration
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 001_init.sql completed successfully';
END $$;
