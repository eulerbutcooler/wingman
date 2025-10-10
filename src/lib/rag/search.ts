import { db } from "@/services/db/drizzle";
import { documentChunks } from "@/services/db/schema/courses";
import { generateEmbedding } from "./embeddings";
import { eq, sql } from "drizzle-orm";

export interface SearchResult {
  chunkId: string;
  chunkText: string;
  chunkIndex: number;
  similarity: number;
  fileId: string;
  courseId: string;
  keywordScore?: number;  // For hybrid search
  hybridScore?: number;   // Combined vector + keyword score
}

export interface SearchResultWithSources {
  chunkId: string;
  chunkText: string;
  chunkIndex: number;
  similarity: number;
  source: {
    fileId: string;
    fileName: string;
    pageNumber: number | null;
    startPosition: number | null;
    endPosition: number | null;
  };
  keywordScore?: number;
  hybridScore?: number;
}

/**
 * Search for relevant document chunks using vector similarity with source information
 */
export async function searchSimilarChunksWithSources(
  query: string,
  courseId: string,
  topK: number = 5,
  similarityThreshold: number = 0.3
): Promise<SearchResultWithSources[]> {
  try {
    console.log(
      `🔍 Searching for chunks with sources in course ${courseId} with query: "${query}"`
    );

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    console.log("🧠 Generated query embedding");

    // Convert embedding to string format for SQL
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Search for similar chunks with file information using JOIN
    const results = await db.execute(sql`
      SELECT 
        dc.id as chunk_id,
        dc.chunk_text,
        dc.chunk_index,
        dc.page_number,
        dc.start_position,
        dc.end_position,
        f.id as file_id,
        f.original_name as file_name,
        1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
      FROM document_chunks dc
      INNER JOIN files f ON dc.file_id = f.id
      WHERE dc.course_id = ${courseId}
        AND dc.embedding IS NOT NULL
        AND 1 - (dc.embedding <=> ${embeddingStr}::vector) > ${similarityThreshold}
      ORDER BY dc.embedding <=> ${embeddingStr}::vector
      LIMIT ${topK}
    `);

    const searchResults: SearchResultWithSources[] = results.map(
      (row: Record<string, unknown>) => ({
        chunkId: row.chunk_id as string,
        chunkText: row.chunk_text as string,
        chunkIndex: row.chunk_index as number,
        similarity: parseFloat(row.similarity as string),
        source: {
          fileId: row.file_id as string,
          fileName: row.file_name as string,
          pageNumber: row.page_number as number | null,
          startPosition: row.start_position as number | null,
          endPosition: row.end_position as number | null,
        },
      })
    );

    console.log(`📊 Found ${searchResults.length} similar chunks with sources`);

    return searchResults;
  } catch (error) {
    console.error("❌ Error searching similar chunks with sources:", error);
    throw new Error(
      `Failed to search similar chunks with sources: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Search for relevant document chunks using vector similarity (original function)
 */
export async function searchSimilarChunks(
  query: string,
  courseId: string,
  topK: number = 5,
  similarityThreshold: number = 0.3
): Promise<SearchResult[]> {
  try {
    console.log(
      `🔍 Searching for chunks in course ${courseId} with query: "${query}"`
    );

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    console.log("🧠 Generated query embedding");

    // Convert embedding to string format for SQL
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

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

    const searchResults: SearchResult[] = results.map(
      (row: Record<string, unknown>) => ({
        chunkId: row.chunk_id as string,
        chunkText: row.chunk_text as string,
        chunkIndex: row.chunk_index as number,
        similarity: parseFloat(row.similarity as string),
        fileId: row.file_id as string,
        courseId: row.course_id as string,
      })
    );

    console.log(`📊 Found ${searchResults.length} similar chunks`);

    return searchResults;
  } catch (error) {
    console.error("❌ Error searching similar chunks:", error);
    throw new Error(
      `Failed to search similar chunks: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get chunks by file ID (for debugging/testing)
 */
export async function getChunksByFileId(
  fileId: string
): Promise<SearchResult[]> {
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

    return results.map((row) => ({
      ...row,
      similarity: 1.0, // Not applicable for direct fetch
    }));
  } catch (error) {
    console.error("❌ Error getting chunks by file ID:", error);
    throw new Error(
      `Failed to get chunks: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
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

    return (
      stats[0] || {
        indexed_files: 0,
        total_chunks: 0,
        avg_chunk_tokens: 0,
        first_indexed: null,
        last_indexed: null,
      }
    );
  } catch (error) {
    console.error("❌ Error getting course index stats:", error);
    throw new Error(
      `Failed to get course stats: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Hybrid Search: Combines vector similarity with keyword matching (Issue 5)
 * 
 * This function implements a two-phase search strategy:
 * 1. Vector similarity search (semantic understanding)
 * 2. Full-text keyword search (exact term matching)
 * 3. Combines scores with configurable weights
 * 
 * Benefits:
 * - Catches items that vector search might miss
 * - Better for queries with specific terminology
 * - More comprehensive results for "list all" queries
 */
export async function hybridSearchWithSources(
  query: string,
  courseId: string,
  options: {
    topK?: number;
    similarityThreshold?: number;
    vectorWeight?: number;  // 0-1, how much to weight vector similarity
    keywordWeight?: number; // 0-1, how much to weight keyword matching
    minKeywordScore?: number; // Minimum keyword relevance score
  } = {}
): Promise<SearchResultWithSources[]> {
  const {
    topK = 10,
    similarityThreshold = 0.4,
    vectorWeight = 0.7,
    keywordWeight = 0.3,
    minKeywordScore = 0.1,
  } = options;

  try {
    console.log(`🔍 Hybrid search in course ${courseId} with query: "${query}"`);
    console.log(`⚙️  Settings: topK=${topK}, threshold=${similarityThreshold}, vector=${vectorWeight}, keyword=${keywordWeight}`);

    // Generate embedding for vector search
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Prepare keywords for full-text search (remove common stop words)
    const keywords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2)  // Remove very short words
      .join(' | ');  // OR operator for PostgreSQL

    console.log(`🔑 Extracted keywords: "${keywords}"`);

    // Hybrid search query combining vector and full-text search
    // Uses RRF (Reciprocal Rank Fusion) inspired scoring
    const results = await db.execute(sql`
      WITH vector_search AS (
        SELECT 
          dc.id,
          dc.chunk_text,
          dc.chunk_index,
          dc.page_number,
          dc.start_position,
          dc.end_position,
          dc.file_id,
          1 - (dc.embedding <=> ${embeddingStr}::vector) as vector_similarity
        FROM document_chunks dc
        WHERE dc.course_id = ${courseId}
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> ${embeddingStr}::vector
        LIMIT ${topK * 2}  -- Get more candidates for fusion
      ),
      keyword_search AS (
        SELECT 
          dc.id,
          dc.chunk_text,
          dc.chunk_index,
          dc.page_number,
          dc.start_position,
          dc.end_position,
          dc.file_id,
          ts_rank_cd(
            to_tsvector('english', dc.chunk_text),
            to_tsquery('english', ${keywords})
          ) as keyword_score
        FROM document_chunks dc
        WHERE dc.course_id = ${courseId}
          AND to_tsvector('english', dc.chunk_text) @@ to_tsquery('english', ${keywords})
        ORDER BY keyword_score DESC
        LIMIT ${topK * 2}
      ),
      combined AS (
        SELECT 
          COALESCE(vs.id, ks.id) as chunk_id,
          COALESCE(vs.chunk_text, ks.chunk_text) as chunk_text,
          COALESCE(vs.chunk_index, ks.chunk_index) as chunk_index,
          COALESCE(vs.page_number, ks.page_number) as page_number,
          COALESCE(vs.start_position, ks.start_position) as start_position,
          COALESCE(vs.end_position, ks.end_position) as end_position,
          COALESCE(vs.file_id, ks.file_id) as file_id,
          COALESCE(vs.vector_similarity, 0) as vector_similarity,
          COALESCE(ks.keyword_score, 0) as keyword_score,
          -- Hybrid score: weighted combination
          (
            COALESCE(vs.vector_similarity, 0) * ${vectorWeight} +
            COALESCE(ks.keyword_score, 0) * ${keywordWeight}
          ) as hybrid_score
        FROM vector_search vs
        FULL OUTER JOIN keyword_search ks ON vs.id = ks.id
      )
      SELECT 
        c.*,
        f.original_name as file_name
      FROM combined c
      INNER JOIN files f ON c.file_id = f.id
      WHERE 
        c.vector_similarity >= ${similarityThreshold}
        OR c.keyword_score >= ${minKeywordScore}
      ORDER BY c.hybrid_score DESC
      LIMIT ${topK}
    `);

    const searchResults: SearchResultWithSources[] = results.map(
      (row: Record<string, unknown>) => ({
        chunkId: row.chunk_id as string,
        chunkText: row.chunk_text as string,
        chunkIndex: row.chunk_index as number,
        similarity: parseFloat(row.vector_similarity as string),
        keywordScore: parseFloat(row.keyword_score as string),
        hybridScore: parseFloat(row.hybrid_score as string),
        source: {
          fileId: row.file_id as string,
          fileName: row.file_name as string,
          pageNumber: row.page_number as number | null,
          startPosition: row.start_position as number | null,
          endPosition: row.end_position as number | null,
        },
      })
    );

    console.log(`📊 Hybrid search found ${searchResults.length} chunks`);
    console.log(`📈 Top 3 scores:`, searchResults.slice(0, 3).map(r => ({
      hybrid: r.hybridScore?.toFixed(3),
      vector: r.similarity.toFixed(3),
      keyword: r.keywordScore?.toFixed(3),
    })));

    return searchResults;
  } catch (error) {
    console.error("❌ Error in hybrid search:", error);
    
    // Fallback to pure vector search
    console.log("⚠️  Falling back to vector-only search...");
    return searchSimilarChunksWithSources(query, courseId, topK, similarityThreshold);
  }
}
