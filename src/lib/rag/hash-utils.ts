import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash for content deduplication
 * Normalizes text before hashing to catch similar content
 */
export function generateContentHash(text: string): string {
  // Normalize text: lowercase, remove extra whitespace, trim
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Generate SHA-256 hash
  return createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Generate hash for a chunk including metadata for uniqueness
 * This ensures chunks from different files/pages are not considered duplicates
 */
export function generateChunkHash(
  text: string, 
  courseId: string,
  fileId?: string
): string {
  // Include courseId and optional fileId for context-aware hashing
  const content = `${courseId}:${fileId || ''}:${text}`;
  
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  return createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Check if two text chunks are similar (for fuzzy deduplication)
 * Returns similarity score between 0 and 1
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const normalized1 = text1.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalized2 = text2.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Simple Jaccard similarity using word sets
  const words1 = new Set(normalized1.split(' '));
  const words2 = new Set(normalized2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}
