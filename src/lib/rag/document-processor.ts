import { createClient } from "@supabase/supabase-js";
import { db } from "@/services/db/drizzle";
import { files, documentChunks } from "@/services/db/schema/courses";
import { extractText } from "./text-extraction";
import { chunkText } from "./text-chunking";
import { generateEmbeddings } from "./embeddings";
import { generateContentHash } from "./hash-utils";
import { eq } from "drizzle-orm";

export interface ProcessingResult {
  success: boolean;
  fileId: string;
  chunkCount: number;
  error?: string;
}

/**
 * Process a document: extract text, chunk it, generate embeddings, and store in DB
 */
export async function processDocument(
  fileId: string
): Promise<ProcessingResult> {
  try {
    console.log(`🔄 Starting document processing for file ${fileId}`);

    // Get file info from database
    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord) {
      throw new Error("File not found in database");
    }

    // Update status to processing
    await db
      .update(files)
      .set({
        processingStatus: "processing",
        processingError: null,
      })
      .where(eq(files.id, fileId));

    console.log(`📄 Processing file: ${fileRecord.originalName}`);

    // Create Supabase service role client for downloading
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Download file from Supabase Storage
    const storagePath = getStoragePath(fileRecord.publicUrl);
    console.log(`📥 Attempting to download from path: ${storagePath}`);

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("course_material")
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error("❌ Download error details:", downloadError);
      const errorDetails = downloadError
        ? JSON.stringify(downloadError, null, 2)
        : "No error details";
      throw new Error(`Failed to download file: ${errorDetails}`);
    }

    // Convert to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());
    console.log(`📥 Downloaded file, size: ${buffer.length} bytes`);

    // Extract text with page tracking for PDFs, fallback to regular extraction for other formats
    let chunks;

    if (fileRecord.mimeType === "application/pdf") {
      // Use page-aware extraction for PDFs
      const { extractPagedTextFromPdf } = await import(
        "@/lib/rag/text-extraction"
      );
      const { chunkPagedText } = await import("@/lib/rag/text-chunking");

      const pagedText = await extractPagedTextFromPdf(buffer);
      console.log(
        `📝 Extracted paged text: ${pagedText.pages.length} pages, ${pagedText.fullText.length} characters`
      );

      if (!pagedText.fullText || pagedText.fullText.trim().length === 0) {
        throw new Error("No text content found in the PDF document");
      }

      // Chunk with page information preserved
      chunks = chunkPagedText(pagedText.pages);
      console.log(`🔪 Created ${chunks.length} chunks with page information`);
    } else {
      // Use regular extraction for non-PDF files
      const extractedText = await extractText(buffer, fileRecord.mimeType);
      console.log(
        `📝 Extracted text, length: ${extractedText.text.length} characters`
      );

      if (!extractedText.text || extractedText.text.trim().length === 0) {
        throw new Error("No text content found in the document");
      }

      // Chunk the text (without page information)
      const regularChunks = chunkText(extractedText.text);

      // Convert to PagedTextChunk format (without page info)
      chunks = regularChunks.map((chunk) => ({
        ...chunk,
        pageNumber: 1, // Default to page 1 for non-PDF files
        startPosition: 0,
        endPosition: chunk.text.length,
      }));

      console.log(`🔪 Created ${chunks.length} text chunks`);
    }

    if (chunks.length === 0) {
      throw new Error("No text chunks created from document");
    }

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map((chunk) => chunk.text);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`🧠 Generated ${embeddings.length} embeddings`);

    // Get course ID from file record
    let courseId = null;

    // First check if a lesson references this file
    const { lessons, topics } = await import("@/services/db/schema/courses");
    const [lessonRecord] = await db
      .select({ topicId: lessons.topicId })
      .from(lessons)
      .where(eq(lessons.fileId, fileRecord.id))
      .limit(1);

    if (lessonRecord) {
      // Get course ID from lesson's topic
      const [topicRecord] = await db
        .select({ courseId: topics.courseId })
        .from(topics)
        .where(eq(topics.id, lessonRecord.topicId))
        .limit(1);

      if (topicRecord) {
        courseId = topicRecord.courseId;
      }
    }

    if (!courseId) {
      throw new Error("Could not determine course ID for file");
    }

    // Store chunks and embeddings in database with deduplication
    const chunkRecords = chunks.map((chunk, index) => ({
      courseId: courseId!,
      fileId: fileRecord.id,
      chunkText: chunk.text,
      chunkIndex: chunk.index,
      tokenCount: chunk.tokenCount,
      pageNumber: chunk.pageNumber || null,
      startPosition: chunk.startPosition || null,
      endPosition: chunk.endPosition || null,
      embedding: embeddings[index],
      contentHash: generateContentHash(chunk.text), // Generate hash for deduplication
    }));

    // Insert with ON CONFLICT handling for duplicates
    let insertedCount = 0;
    let skippedDuplicates = 0;

    for (const record of chunkRecords) {
      try {
        await db.insert(documentChunks).values(record);
        insertedCount++;
      } catch (error: unknown) {
        // Check if it's a duplicate key error (PostgreSQL error code 23505)
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
          skippedDuplicates++;
          console.log(`⏭️  Skipped duplicate chunk: "${record.chunkText.substring(0, 50)}..."`);
        } else {
          throw error; // Re-throw if it's not a duplicate error
        }
      }
    }

    console.log(`💾 Stored ${insertedCount} new chunks in database`);
    if (skippedDuplicates > 0) {
      console.log(`🔄 Skipped ${skippedDuplicates} duplicate chunks`);
    }

    // Update file status to completed
    await db
      .update(files)
      .set({
        processingStatus: "completed",
        chunkCount: insertedCount, // Use actual inserted count
        processingError: null,
      })
      .where(eq(files.id, fileId));

    console.log(`✅ Document processing completed for file ${fileId}`);

    return {
      success: true,
      fileId,
      chunkCount: insertedCount,
    };
  } catch (error) {
    console.error(`❌ Error processing document ${fileId}:`, error);

    // Update file status to failed
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await db
      .update(files)
      .set({
        processingStatus: "failed",
        processingError: errorMessage,
      })
      .where(eq(files.id, fileId));

    return {
      success: false,
      fileId,
      chunkCount: 0,
      error: errorMessage,
    };
  }
}

/**
 * Extract storage path from Supabase URL
 */
function getStoragePath(url: string): string {
  console.log("🔍 Extracting storage path from URL:", url);

  // Handle different URL formats:
  // Public: https://project.supabase.co/storage/v1/object/public/course_material/path
  // Private: https://project.supabase.co/storage/v1/object/course_material/path

  // Try public format first
  let urlParts = url.split("/storage/v1/object/public/course_material/");
  if (urlParts.length >= 2) {
    const path = urlParts[1];
    console.log("✅ Extracted path from public URL:", path);
    return path;
  }

  // Try private format
  urlParts = url.split("/storage/v1/object/course_material/");
  if (urlParts.length >= 2) {
    const path = urlParts[1];
    console.log("✅ Extracted path from private URL:", path);
    return path;
  }

  // Try to extract from any course_material reference
  const bucketIndex = url.indexOf("course_material/");
  if (bucketIndex !== -1) {
    const path = url.substring(bucketIndex + "course_material/".length);
    console.log("✅ Extracted path from bucket reference:", path);
    return path;
  }

  console.error("❌ Could not extract path from URL:", url);
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
