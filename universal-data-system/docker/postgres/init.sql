-- PostgreSQL initialization script
-- Creates extensions and base schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_textsearch;

-- Log successful extension creation
DO $$
BEGIN
    RAISE NOTICE 'Extensions created: vector, pg_textsearch';
END $$;
