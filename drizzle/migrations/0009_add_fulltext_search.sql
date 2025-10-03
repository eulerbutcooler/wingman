-- Add tsvector column for full-text search
ALTER TABLE "document_chunks" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX idx_document_chunks_search_vector ON "document_chunks" USING GIN("search_vector");

-- Create a trigger to automatically update search_vector from chunk_text
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', COALESCE(NEW.chunk_text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_chunks_search_vector_update
  BEFORE INSERT OR UPDATE ON "document_chunks"
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();

-- Populate existing rows with search_vector
UPDATE "document_chunks" SET search_vector = to_tsvector('english', COALESCE(chunk_text, '')) WHERE search_vector IS NULL;