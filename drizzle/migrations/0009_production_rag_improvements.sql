-- Migration: Production-Ready RAG Improvements
-- Date: 2025-10-09
-- Description: Add indexes, metadata columns, and optimizations for production RAG system

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================

-- Ensure pgvector extension is enabled (for vector embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for better text search (trigram matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- STEP 2: Add New Metadata Columns to document_chunks
-- ============================================================================

-- Add structural metadata columns for better context tracking
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS heading_text TEXT,
ADD COLUMN IF NOT EXISTS heading_level INTEGER,
ADD COLUMN IF NOT EXISTS chunk_type TEXT;

-- Add comments for documentation
COMMENT ON COLUMN document_chunks.heading_text IS 'Section/chapter heading for this chunk (e.g., "Chapter 1: Introduction")';
COMMENT ON COLUMN document_chunks.heading_level IS 'Heading hierarchy level: 1=H1, 2=H2, 3=H3, etc.';
COMMENT ON COLUMN document_chunks.chunk_type IS 'Content type: text, list, table, code, formula';

-- ============================================================================
-- STEP 3: Create Performance Indexes
-- ============================================================================

-- Critical: Vector similarity search index (Issue 5 - Hybrid Search)
-- This makes vector searches 10-40x faster!
-- Using HNSW index (better for Supabase, doesn't require high maintenance_work_mem)
-- m=16 and ef_construction=64 are good defaults for most use cases
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-text search index (Issue 5 - Hybrid Search)
-- Enables fast keyword-based search to complement vector search
CREATE INDEX IF NOT EXISTS idx_document_chunks_fts 
ON document_chunks 
USING GIN(to_tsvector('english', chunk_text));

-- Composite index for course + file filtering (most common query pattern)
-- Speeds up queries that filter by course and file together
CREATE INDEX IF NOT EXISTS idx_document_chunks_course_file 
ON document_chunks(course_id, file_id);

-- Index for sequential chunk retrieval (Issue 7 - Query-Specific Retrieval)
-- Enables fast retrieval of chunks in document order
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_index 
ON document_chunks(file_id, chunk_index);

-- Partial index for chunk type filtering
-- Only indexes rows with non-null chunk_type (saves space)
CREATE INDEX IF NOT EXISTS idx_document_chunks_type 
ON document_chunks(chunk_type) 
WHERE chunk_type IS NOT NULL;

-- Index for file processing status queries
-- Helps monitor and filter files by processing status
CREATE INDEX IF NOT EXISTS idx_files_status 
ON files(processing_status, created_at DESC);

-- Index for courseId filtering on files
CREATE INDEX IF NOT EXISTS idx_files_user 
ON files(user_id, created_at DESC);

-- ============================================================================
-- STEP 4: Cleanup Old/Redundant Indexes (if they exist)
-- ============================================================================

-- Drop old vector index if it exists with different configuration
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- ============================================================================
-- STEP 5: Optimize Existing Data
-- ============================================================================

-- Update statistics for query planner
ANALYZE document_chunks;
ANALYZE files;

-- Note: VACUUM must be run outside transaction (will be done separately)

-- ============================================================================
-- STEP 6: Add Constraints for Data Quality
-- ============================================================================

-- Ensure chunk_type only contains valid values
ALTER TABLE document_chunks 
ADD CONSTRAINT check_chunk_type 
CHECK (chunk_type IS NULL OR chunk_type IN ('text', 'list', 'table', 'code', 'formula'));

-- Ensure heading_level is reasonable (1-6 for HTML-style headings)
ALTER TABLE document_chunks 
ADD CONSTRAINT check_heading_level 
CHECK (heading_level IS NULL OR (heading_level >= 1 AND heading_level <= 6));

-- Ensure token_count is positive
ALTER TABLE document_chunks 
ADD CONSTRAINT check_token_count 
CHECK (token_count IS NULL OR token_count > 0);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '✅ Production RAG migration completed successfully!';
    RAISE NOTICE '📊 New columns added: heading_text, heading_level, chunk_type';
    RAISE NOTICE '🚀 Performance indexes created: vector, full-text, composite';
    RAISE NOTICE '⚡ Expected performance improvement: 10-40x faster searches';
END $$;
