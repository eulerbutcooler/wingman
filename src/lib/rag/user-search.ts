import { db } from '@/lib/db/drizzle';
import { documentChunks, files, courses } from '@/lib/db/schema/courses';
import { eq, sql, desc } from 'drizzle-orm';
import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface SearchResult {
  chunkId: string;
  chunkText: string;
  chunkIndex: number;
  fileId: string;
  fileName: string;
  courseId: string;
  courseTitle: string;
  similarity: number;
}

/**
 * Search across ALL courses globally (not user-specific)
 */
export async function searchAllCourses(
  query: string,
  maxResults: number = 5,
  similarityThreshold: number = 0.7
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Searching ALL courses globally for: "${query}"`);
    
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    console.log('✅ Generated query embedding');

    // Get all document chunks with their associated file and course info
    const allChunks = await db
      .select({
        chunkId: documentChunks.id,
        chunkText: documentChunks.chunkText,
        chunkIndex: documentChunks.chunkIndex,
        embedding: documentChunks.embedding,
        fileId: documentChunks.fileId,
        fileName: files.originalName,
        courseId: documentChunks.courseId,
        courseTitle: courses.title,
      })
      .from(documentChunks)
      .innerJoin(files, eq(documentChunks.fileId, files.id))
      .innerJoin(courses, eq(documentChunks.courseId, courses.id))
      .orderBy(desc(documentChunks.createdAt));

    console.log(`📚 Found ${allChunks.length} total chunks across all courses`);

    if (allChunks.length === 0) {
      console.log('📭 No document chunks found in any course');
      return [];
    }

    // Calculate similarities and filter
    const results: SearchResult[] = [];
    
    for (const chunk of allChunks) {
      if (chunk.embedding) {
        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding as number[]);
        
        if (similarity >= similarityThreshold) {
          results.push({
            chunkId: chunk.chunkId,
            chunkText: chunk.chunkText,
            chunkIndex: chunk.chunkIndex,
            fileId: chunk.fileId,
            fileName: chunk.fileName,
            courseId: chunk.courseId,
            courseTitle: chunk.courseTitle,
            similarity,
          });
        }
      }
    }

    // Sort by similarity and limit results
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, maxResults);

    console.log(`🎯 Found ${topResults.length} relevant chunks (similarity > ${similarityThreshold})`);
    
    return topResults;
    
  } catch (error) {
    console.error('❌ Error searching all courses:', error);
    throw new Error(`Failed to search courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format search results for AI context
 */
export function formatContextForWingman(searchResults: SearchResult[]): string {
  if (searchResults.length === 0) {
    return '';
  }

  return searchResults
    .map((result, index) => {
      return `[Source ${index + 1}: ${result.fileName} from ${result.courseTitle}]
${result.chunkText}`;
    })
    .join('\n\n---\n\n');
}
