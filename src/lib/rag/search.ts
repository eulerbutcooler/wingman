import { db } from '@/lib/db/drizzle';
import { documentChunks } from '@/lib/db/schema/courses';
import { generateEmbedding } from './embeddings';
import { eq, sql } from 'drizzle-orm';

export interface SearchResult {
  chunkId: string;
  chunkText: string;
  chunkIndex: number;
  similarity: number;
  fileId: string;
  courseId: string;
}

/**
 * Search for relevant document chunks using vector similarity
 */
export async function searchSimilarChunks(
  query: string,
  courseId: string,
  topK: number = 5,
  similarityThreshold: number = 0.3
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Searching for chunks in course ${courseId} with query: "${query}"`);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    console.log('🧠 Generated query embedding');
    
    // Convert embedding to string format for SQL
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    
    // Search for similar chunks using cosine similarity
    const results = await db.execute(sql`
      SELECT 
        id as chunk_id,
        chunk_text,
        chunk_index,
        file_id,
        course_id,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM document_chunks 
      WHERE course_id = ${courseId}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${embeddingStr}::vector) > ${similarityThreshold}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${topK}
    `);
    
    const searchResults: SearchResult[] = results.rows.map((row: Record<string, unknown>) => ({
      chunkId: row.chunk_id as string,
      chunkText: row.chunk_text as string,
      chunkIndex: row.chunk_index as number,
      similarity: parseFloat(row.similarity as string),
      fileId: row.file_id as string,
      courseId: row.course_id as string,
    }));
    
    console.log(`📊 Found ${searchResults.length} similar chunks`);
    
    return searchResults;
    
  } catch (error) {
    console.error('❌ Error searching similar chunks:', error);
    throw new Error(`Failed to search similar chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get chunks by file ID (for debugging/testing)
 */
export async function getChunksByFileId(fileId: string): Promise<SearchResult[]> {
  try {
    const results = await db
      .select({
        chunkId: documentChunks.id,
        chunkText: documentChunks.chunkText,
        chunkIndex: documentChunks.chunkIndex,
        fileId: documentChunks.fileId,
        courseId: documentChunks.courseId,
      })
      .from(documentChunks)
      .where(eq(documentChunks.fileId, fileId))
      .orderBy(documentChunks.chunkIndex);
    
    return results.map(row => ({
      ...row,
      similarity: 1.0 // Not applicable for direct fetch
    }));
    
  } catch (error) {
    console.error('❌ Error getting chunks by file ID:', error);
    throw new Error(`Failed to get chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get statistics about indexed documents in a course
 */
export async function getCourseIndexStats(courseId: string) {
  try {
    const stats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT file_id) as indexed_files,
        COUNT(*) as total_chunks,
        AVG(token_count) as avg_chunk_tokens,
        MIN(created_at) as first_indexed,
        MAX(created_at) as last_indexed
      FROM document_chunks 
      WHERE course_id = ${courseId}
    `);
    
    return stats.rows[0] || {
      indexed_files: 0,
      total_chunks: 0,
      avg_chunk_tokens: 0,
      first_indexed: null,
      last_indexed: null
    };
    
  } catch (error) {
    console.error('❌ Error getting course index stats:', error);
    throw new Error(`Failed to get course stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
