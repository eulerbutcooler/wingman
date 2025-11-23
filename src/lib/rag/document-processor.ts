import { createClient } from "@supabase/supabase-js";
import { db } from "@/services/db/drizzle";
import { files, documentChunks } from "@/services/db/schema/courses";
import { extractText, PagedText } from "./text-extraction";
import { generateEmbeddings } from "./embeddings";
import { eq } from "drizzle-orm";
import { chunkTextWithStrategy } from "./recursive-chunking"; // Import the new strategy

export interface ProcessingResult {
  success: boolean;
  fileId: string;
  chunkCount: number;
  error?: string;
}

/**
 * This function now uses the more advanced recursive chunking strategy
 * to create more semantically coherent text chunks for embedding.
 */
export async function processDocument(
  fileId: string
): Promise<ProcessingResult> {
  try {
    console.log(`🔄 Starting document processing for file ${fileId}`);

    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord) {
      throw new Error("File not found in database");
    }

    await db
      .update(files)
      .set({ processingStatus: "processing", processingError: null })
      .where(eq(files.id, fileId));

    console.log(`📄 Processing file: ${fileRecord.originalName}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const storagePath = getStoragePath(fileRecord.publicUrl);

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("course_material")
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // --- OPTIMIZATION: Use the new recursive chunking strategy ---
    let chunks: Omit<import("./text-chunking").PagedTextChunk, "index">[] = [];

    if (fileRecord.mimeType === "application/pdf") {
      const { extractPagedTextFromPdf } = await import("./text-extraction");
      const pagedText: PagedText = await extractPagedTextFromPdf(buffer);

      if (!pagedText.fullText || pagedText.fullText.trim().length === 0) {
        throw new Error("No text content found in the PDF document");
      }

      // Chunk each page's text individually to preserve page context
      for (const page of pagedText.pages) {
        const pageChunks = chunkTextWithStrategy(
          page.text,
          page.pageNumber,
          page.startPosition
        );
        chunks.push(...pageChunks);
      }
      console.log(`🔪 Created ${chunks.length} chunks with new recursive strategy for PDF`);
    } else {
      const extractedText = await extractText(buffer, fileRecord.mimeType);

      if (!extractedText.text || extractedText.text.trim().length === 0) {
        throw new Error("No text content found in the document");
      }

      // Chunk the entire document's text
      chunks = chunkTextWithStrategy(extractedText.text);
      console.log(`🔪 Created ${chunks.length} chunks with new recursive strategy`);
    }

    if (chunks.length === 0) {
      throw new Error("No text chunks created from document");
    }

    const chunkTexts = chunks.map((chunk) => chunk.text);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`🧠 Generated ${embeddings.length} embeddings`);

    // Get course ID from file record or create a test course
    let courseId = null;
    const { lessons, topics, courses } = await import("@/services/db/schema/courses");
    
    // First, try to find course through lesson association
    const [lessonRecord] = await db.select({ topicId: lessons.topicId }).from(lessons).where(eq(lessons.fileId, fileRecord.id)).limit(1);
    if (lessonRecord) {
      const [topicRecord] = await db.select({ courseId: topics.courseId }).from(topics).where(eq(topics.id, lessonRecord.topicId)).limit(1);
      if (topicRecord) courseId = topicRecord.courseId;
    }
    
    // If no course association found, look for a default/test course for this user
    if (!courseId) {
      console.log(`⚠️ No direct course association found for file ${fileRecord.id}, looking for user's courses...`);
      
      // Try to find any course by this user (only if userId is not null)
      if (fileRecord.userId !== null) {
        const [userCourse] = await db
          .select({ id: courses.id })
          .from(courses)
          .where(eq(courses.userId, fileRecord.userId))
          .limit(1);
          
        if (userCourse) {
          courseId = userCourse.id;
          console.log(`✅ Using user's existing course ${courseId} for file ${fileRecord.id}`);
        }
      }
      
      if (!courseId) {
        // Create a default course for testing if none exists
        const [newCourse] = await db
          .insert(courses)
          .values({
            title: "Test Course for Document Processing",
            description: "Automatically created course for standalone file uploads",
            gendesc: "This course was created automatically for testing document processing",
            userId: fileRecord.userId,
          })
          .returning();
          
        courseId = newCourse.id;
        console.log(`✅ Created new test course ${courseId} for file ${fileRecord.id}`);
      }
    }
    
    if (!courseId) {
      throw new Error("Could not determine or create course ID for file");
    }

    const chunkRecords = chunks.map((chunk, index) => ({
      courseId: courseId!,
      fileId: fileRecord.id,
      chunkText: chunk.text,
      chunkIndex: index, // Assign index sequentially now
      tokenCount: chunk.tokenCount,
      pageNumber: chunk.pageNumber || null,
      startPosition: chunk.startPosition || null,
      endPosition: chunk.endPosition || null,
      embedding: embeddings[index],
    }));

    // ✅ Wrap DB operations in transaction - all or nothing
    await db.transaction(async (tx) => {
      // Insert all chunks
      await tx.insert(documentChunks).values(chunkRecords);
      console.log(`💾 Stored ${chunkRecords.length} chunks in database`);

      // Update file status
      await tx
        .update(files)
        .set({
          processingStatus: "completed",
          chunkCount: chunks.length,
          processingError: null,
        })
        .where(eq(files.id, fileId));
      
      console.log(`✅ Document processing completed for file ${fileId}`);
    });

    return { success: true, fileId, chunkCount: chunks.length };
  } catch (error) {
    console.error(`❌ Error processing document ${fileId}:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await db
      .update(files)
      .set({ processingStatus: "failed", processingError: errorMessage })
      .where(eq(files.id, fileId));

    return { success: false, fileId, chunkCount: 0, error: errorMessage };
  }
}

function getStoragePath(url: string): string {
  const urlParts = url.split("/course_material/");
  if (urlParts.length >= 2) {
    return urlParts[1];
  }
  throw new Error(`Invalid Supabase storage URL format: ${url}`);
}

/**
 * Process multiple documents
 */
export async function processDocuments(
  fileIds: string[]
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  for (const fileId of fileIds) {
    const result = await processDocument(fileId);
    results.push(result);
  }

  return results;
}
