import { db } from "@/services/db/drizzle";
import { documentChunks, files, courses } from "@/services/db/schema/courses";
import { eq, desc, sql } from "drizzle-orm";
import { generateEmbedding, cosineSimilarity } from "./embeddings";

export interface SearchResult {
  chunkId: string;
  chunkText: string;
  chunkIndex: number;
  fileId: string;
  fileName: string;
  courseId: string;
  courseTitle: string;
  similarity: number;
  pageNumber?: number | null;
  startPosition?: number | null;
  endPosition?: number | null;
}

/**
 * Search across ALL courses globally (not user-specific)
 */
export async function searchAllCourses(
  query: string,
  maxResults: number = 5,
  similarityThreshold: number = 0.4
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 Searching ALL courses globally for: "${query}"`);

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    console.log("✅ Generated query embedding");

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
        pageNumber: documentChunks.pageNumber,
        startPosition: documentChunks.startPosition,
        endPosition: documentChunks.endPosition,
      })
      .from(documentChunks)
      .innerJoin(files, eq(documentChunks.fileId, files.id))
      .innerJoin(courses, eq(documentChunks.courseId, courses.id))
      .orderBy(desc(documentChunks.createdAt));

    console.log(`📚 Found ${allChunks.length} total chunks across all courses`);

    if (allChunks.length === 0) {
      console.log("📭 No document chunks found in any course");
      return [];
    }

    // Calculate similarities and filter
    const results: SearchResult[] = [];

    for (const chunk of allChunks) {
      if (chunk.embedding) {
        const similarity = cosineSimilarity(
          queryEmbedding,
          chunk.embedding as number[]
        );

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
            pageNumber: chunk.pageNumber,
            startPosition: chunk.startPosition,
            endPosition: chunk.endPosition,
          });
        }
      }
    }

    // Sort by similarity and limit results
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, maxResults);

    console.log(
      `🎯 Found ${topResults.length} relevant chunks (similarity > ${similarityThreshold})`
    );

    return topResults;
  } catch (error) {
    console.error("❌ Error searching all courses:", error);
    throw new Error(
      `Failed to search courses: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * IMPROVED: Hybrid search across ALL courses with query classification
 * Uses database indexes for better performance (10-40x faster)
 */
export async function searchAllCoursesHybrid(
  query: string,
  options: {
    maxResults?: number;
    similarityThreshold?: number;
    vectorWeight?: number;
    keywordWeight?: number;
  } = {}
): Promise<SearchResult[]> {
  const {
    maxResults = 10,
    similarityThreshold = 0.4, // LOWERED to 0.4 to catch more relevant results
    vectorWeight = 0.7,
    keywordWeight = 0.3,
  } = options;

  try {
    console.log(`🔍 Hybrid search ALL courses for: "${query}"`);
    console.log(`⚙️  Settings: max=${maxResults}, threshold=${similarityThreshold}`);

    // Detect if user is asking about a specific course (multiple patterns)
    let targetCourseName: string | null = null;
    
    // Pattern 1: "course X", "from course X", "in course X"
    let courseNameMatch = query.match(/(?:course|from course|in course)\s+["']?(\w+)["']?/i);
    if (courseNameMatch) {
      targetCourseName = courseNameMatch[1].toLowerCase();
    }
    
    // Pattern 2: "for the X", "for X course", "of X", "of the X"
    if (!targetCourseName) {
      courseNameMatch = query.match(/(?:for|of)\s+(?:the\s+)?["']?(\w+)["']?(?:\s+course)?/i);
      if (courseNameMatch) {
        targetCourseName = courseNameMatch[1].toLowerCase();
      }
    }
    
    // Pattern 3: "X lesson plan", "X's lesson", to catch "air lesson plan"
    if (!targetCourseName) {
      courseNameMatch = query.match(/\b(\w+)(?:'s)?\s+lesson/i);
      if (courseNameMatch && courseNameMatch[1].toLowerCase() !== 'all') {
        targetCourseName = courseNameMatch[1].toLowerCase();
      }
    }
    
    if (targetCourseName) {
      console.log(`🎯 Detected target course name: "${targetCourseName}"`);
      console.log(`🔒 Filtering results to ONLY show content from course matching: "${targetCourseName}"`);
    }

    // Generate embedding for vector search
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Prepare keywords for full-text search
    const keywords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .join(' | ');

    console.log(`🔑 Keywords: "${keywords}"`);

    // Hybrid search query (vector + keyword across all courses)
    // If a specific course is detected, filter to that course ONLY
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
          dc.course_id,
          1 - (dc.embedding <=> ${embeddingStr}::vector) as vector_similarity
        FROM document_chunks dc
        ${targetCourseName ? sql`
          INNER JOIN courses target_course ON dc.course_id = target_course.id
          WHERE LOWER(target_course.title) LIKE ${`%${targetCourseName}%`}
            AND dc.embedding IS NOT NULL
        ` : sql`WHERE dc.embedding IS NOT NULL`}
        ORDER BY dc.embedding <=> ${embeddingStr}::vector
        LIMIT ${maxResults * 2}
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
          dc.course_id,
          ts_rank_cd(
            to_tsvector('english', dc.chunk_text || ' ' || COALESCE(c.title, '') || ' ' || COALESCE(f.original_name, '')),
            to_tsquery('english', ${keywords})
          ) as keyword_score
        FROM document_chunks dc
        INNER JOIN courses c ON dc.course_id = c.id
        INNER JOIN files f ON dc.file_id = f.id
        WHERE to_tsvector('english', dc.chunk_text || ' ' || COALESCE(c.title, '') || ' ' || COALESCE(f.original_name, '')) @@ to_tsquery('english', ${keywords})
        ${targetCourseName ? sql`AND LOWER(c.title) LIKE ${`%${targetCourseName}%`}` : sql``}
        ORDER BY keyword_score DESC
        LIMIT ${maxResults * 2}
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
          COALESCE(vs.course_id, ks.course_id) as course_id,
          COALESCE(vs.vector_similarity, 0) as vector_similarity,
          COALESCE(ks.keyword_score, 0) as keyword_score
        FROM vector_search vs
        FULL OUTER JOIN keyword_search ks ON vs.id = ks.id
      )
      SELECT 
        c.*,
        f.original_name as file_name,
        co.title as course_title,
        -- Standard hybrid scoring (no boost needed since we filter by course directly)
        (c.vector_similarity * ${vectorWeight} + c.keyword_score * ${keywordWeight}) as hybrid_score
      FROM combined c
      INNER JOIN files f ON c.file_id = f.id
      INNER JOIN courses co ON c.course_id = co.id
      WHERE (c.vector_similarity >= ${similarityThreshold} OR c.keyword_score >= 0.05)
      ORDER BY hybrid_score DESC
      LIMIT ${maxResults}
    `);

    const searchResults: SearchResult[] = results.map(
      (row: Record<string, unknown>) => ({
        chunkId: row.chunk_id as string,
        chunkText: row.chunk_text as string,
        chunkIndex: row.chunk_index as number,
        fileId: row.file_id as string,
        fileName: row.file_name as string,
        courseId: row.course_id as string,
        courseTitle: row.course_title as string,
        similarity: parseFloat(row.vector_similarity as string),
        pageNumber: row.page_number as number | null,
        startPosition: row.start_position as number | null,
        endPosition: row.end_position as number | null,
      })
    );

    console.log(`📊 Hybrid search found ${searchResults.length} chunks`);
    return searchResults;
  } catch (error) {
    console.error("❌ Hybrid search failed, falling back to standard search:", error);
    // Fallback to original search
    return searchAllCourses(query, maxResults, similarityThreshold);
  }
}

/**
 * Format search results for AI context
 */
export function formatContextForWingman(searchResults: SearchResult[]): string {
  if (searchResults.length === 0) {
    return "";
  }

  return searchResults
    .map((result, index) => {
      const pageRef = result.pageNumber ? `, Page ${result.pageNumber}` : "";
      return `[Source ${index + 1}: ${result.fileName} from Course: "${result.courseTitle}"${pageRef}]
${result.chunkText}`;
    })
    .join("\n\n---\n\n");
}

/**
 * Get unique courses from search results for better context
 */
export function getCourseSummary(searchResults: SearchResult[]): string {
  if (searchResults.length === 0) {
    return "No courses found in the search results.";
  }

  // Group by course
  const courseMap = new Map<string, { title: string; count: number; files: Set<string> }>();
  
  for (const result of searchResults) {
    if (!courseMap.has(result.courseId)) {
      courseMap.set(result.courseId, {
        title: result.courseTitle,
        count: 0,
        files: new Set()
      });
    }
    const course = courseMap.get(result.courseId)!;
    course.count++;
    course.files.add(result.fileName);
  }

  // Format summary
  const courses = Array.from(courseMap.values());
  const summary = courses.map(c => 
    `- "${c.title}" (${c.count} chunks from ${c.files.size} file${c.files.size > 1 ? 's' : ''})`
  ).join('\n');

  return `Sources found from ${courses.length} course${courses.length > 1 ? 's' : ''}:\n${summary}`;
}
