import { supabase } from '@/lib/auth/supabase';
import { db } from '@/lib/db/drizzle';
import { files, documentChunks } from '@/lib/db/schema/courses';
import { extractText } from './text-extraction';
import { chunkText } from './text-chunking';
import { generateEmbeddings } from './embeddings';
import { eq } from 'drizzle-orm';

export interface ProcessingResult {
  success: boolean;
  fileId: string;
  chunkCount: number;
  error?: string;
}

/**
 * Process a document: extract text, chunk it, generate embeddings, and store in DB
 */
export async function processDocument(fileId: string): Promise<ProcessingResult> {
  try {
    console.log(`🔄 Starting document processing for file ${fileId}`);
    
    // Get file info from database
    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);
    
    if (!fileRecord) {
      throw new Error('File not found in database');
    }
    
    // Update status to processing
    await db
      .update(files)
      .set({ 
        processingStatus: 'processing',
        processingError: null 
      })
      .where(eq(files.id, fileId));
    
    console.log(`📄 Processing file: ${fileRecord.originalName}`);
    
    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('wingman-files')
      .download(getStoragePath(fileRecord.url));
    
    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }
    
    // Convert to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());
    console.log(`📥 Downloaded file, size: ${buffer.length} bytes`);
    
    // Extract text based on file type
    const extractedText = await extractText(buffer, fileRecord.mimeType);
    console.log(`📝 Extracted text, length: ${extractedText.text.length} characters`);
    
    if (!extractedText.text || extractedText.text.trim().length === 0) {
      throw new Error('No text content found in the document');
    }
    
    // Chunk the text
    const chunks = chunkText(extractedText.text);
    console.log(`🔪 Created ${chunks.length} text chunks`);
    
    if (chunks.length === 0) {
      throw new Error('No text chunks created from document');
    }
    
    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(chunk => chunk.text);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`🧠 Generated ${embeddings.length} embeddings`);
    
    // Get course ID from file record
    let courseId = null;
    
    if (fileRecord.lessonId) {
      // Get course ID from lesson
      const { lessons, topics } = await import('@/lib/db/schema/courses');
      const [lessonRecord] = await db
        .select({ topicId: lessons.topicId })
        .from(lessons)
        .where(eq(lessons.id, fileRecord.lessonId))
        .limit(1);
      
      if (lessonRecord) {
        const [topicRecord] = await db
          .select({ courseId: topics.courseId })
          .from(topics)
          .where(eq(topics.id, lessonRecord.topicId))
          .limit(1);
        
        if (topicRecord) {
          courseId = topicRecord.courseId;
        }
      }
    } else if (fileRecord.topicId) {
      // Get course ID directly from topic
      const { topics } = await import('@/lib/db/schema/courses');
      const [topicRecord] = await db
        .select({ courseId: topics.courseId })
        .from(topics)
        .where(eq(topics.id, fileRecord.topicId))
        .limit(1);
      
      if (topicRecord) {
        courseId = topicRecord.courseId;
      }
    }
    
    if (!courseId) {
      throw new Error('Could not determine course ID for file');
    }
    
    // Store chunks and embeddings in database
    const chunkRecords = chunks.map((chunk, index) => ({
      courseId: courseId!,
      fileId: fileRecord.id,
      chunkText: chunk.text,
      chunkIndex: chunk.index,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[index],
    }));
    
    await db.insert(documentChunks).values(chunkRecords);
    console.log(`💾 Stored ${chunkRecords.length} chunks in database`);
    
    // Update file status to completed
    await db
      .update(files)
      .set({ 
        processingStatus: 'completed',
        chunkCount: chunks.length,
        processingError: null 
      })
      .where(eq(files.id, fileId));
    
    console.log(`✅ Document processing completed for file ${fileId}`);
    
    return {
      success: true,
      fileId,
      chunkCount: chunks.length
    };
    
  } catch (error) {
    console.error(`❌ Error processing document ${fileId}:`, error);
    
    // Update file status to failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await db
      .update(files)
      .set({ 
        processingStatus: 'failed',
        processingError: errorMessage 
      })
      .where(eq(files.id, fileId));
    
    return {
      success: false,
      fileId,
      chunkCount: 0,
      error: errorMessage
    };
  }
}

/**
 * Extract storage path from Supabase URL
 */
function getStoragePath(url: string): string {
  // Extract path from Supabase storage URL
  // URL format: https://project.supabase.co/storage/v1/object/public/bucket/path
  const urlParts = url.split('/storage/v1/object/public/wingman-files/');
  if (urlParts.length < 2) {
    throw new Error('Invalid Supabase storage URL');
  }
  return urlParts[1];
}

/**
 * Process multiple documents
 */
export async function processDocuments(fileIds: string[]): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  
  for (const fileId of fileIds) {
    const result = await processDocument(fileId);
    results.push(result);
  }
  
  return results;
}
