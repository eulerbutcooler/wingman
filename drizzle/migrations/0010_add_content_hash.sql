-- Add content_hash column for duplicate detection
ALTER TABLE "document_chunks" ADD COLUMN "content_hash" text;

-- Create index on content_hash for fast duplicate lookups
CREATE INDEX idx_document_chunks_content_hash ON "document_chunks"("content_hash") WHERE "content_hash" IS NOT NULL;

-- Create unique index to prevent exact duplicates within same course
CREATE UNIQUE INDEX idx_document_chunks_unique_content ON "document_chunks"("course_id", "content_hash") WHERE "content_hash" IS NOT NULL;