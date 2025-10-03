import { inngest } from "../client";
import { processDocument } from "@/lib/rag/document-processor";
import { db } from "@/services/db/drizzle";
import { files } from "@/services/db/schema/courses";
import { eq } from "drizzle-orm";

/**
 * Inngest function to process uploaded documents
 * 
 * Features:
 * - Automatic retries (3 attempts with exponential backoff)
 * - Concurrency control (max 5 files processing at once)
 * - Detailed logging for debugging
 * - Graceful error handling
 */
export const processDocumentJob = inngest.createFunction(
  {
    id: "process-document-rag",
    name: "Process Document for RAG",
    retries: 3, // Retry up to 3 times on failure
    concurrency: {
      limit: 5, // Process max 5 documents at once to avoid overload
    },
  },
  { event: "file/uploaded" }, // Triggered when this event is sent
  async ({ event, step }) => {
    const { fileId, courseId, userId } = event.data;

    console.log(`📋 [Inngest] Starting document processing for file: ${fileId}`);

    // Step 1: Validate file exists and is ready for processing
    const fileRecord = await step.run("validate-file", async () => {
      console.log(`🔍 [Inngest] Validating file ${fileId}...`);
      
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (!file) {
        throw new Error(`File ${fileId} not found in database`);
      }

      if (file.processingStatus === "completed") {
        console.log(`✅ [Inngest] File ${fileId} already processed, skipping`);
        return { skipped: true, file };
      }

      console.log(`✅ [Inngest] File validated: ${file.originalName}`);
      return { skipped: false, file };
    });

    // Skip if already processed
    if (fileRecord.skipped) {
      return {
        success: true,
        fileId,
        message: "File already processed",
        skipped: true,
      };
    }

    // Step 2: Process the document (extract, chunk, embed, store)
    const processingResult = await step.run("process-document", async () => {
      console.log(`🔄 [Inngest] Processing document ${fileId}...`);
      
      try {
        const result = await processDocument(fileId);
        
        console.log(`✅ [Inngest] Document processing completed for ${fileId}`, {
          chunkCount: result.chunkCount,
          success: result.success,
        });

        return result;
      } catch (error) {
        console.error(`❌ [Inngest] Document processing failed for ${fileId}:`, error);
        throw error; // This will trigger retry
      }
    });

    // Step 3: Send completion event (optional, for tracking)
    await step.run("send-completion-event", async () => {
      console.log(`📤 [Inngest] Sending completion event for ${fileId}`);
      
      await inngest.send({
        name: "file/processed",
        data: {
          fileId,
          courseId,
          userId,
          success: processingResult.success,
          chunkCount: processingResult.chunkCount,
        },
      });

      return { eventSent: true };
    });

    console.log(`🎉 [Inngest] Complete workflow finished for file ${fileId}`);

    return {
      success: true,
      fileId,
      chunkCount: processingResult.chunkCount,
      message: "Document processed successfully",
    };
  }
);
