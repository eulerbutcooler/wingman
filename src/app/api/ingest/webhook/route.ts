import { NextRequest, NextResponse } from "next/server";
import { processDocument } from "@/lib/rag/document-processor";

/**
 * This API route acts as the ingestion worker.
 * It is called by QStash when a new job is available in the queue.
 * It's responsible for executing the long-running document processing task.
 */
export async function POST(request: NextRequest) {
  try {
    // For now, we'll skip signature verification for simplicity
    // In production, you should verify the QStash signature
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      console.error("❌ Webhook received with no fileId in body");
      return NextResponse.json(
        { error: "Missing fileId in request body" },
        { status: 400 }
      );
    }

    console.log(`⚙️ Worker picked up job for fileId: ${fileId}`);

    // --- ✅ Add timeout wrapper (5 minutes) ---
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    
    const result = await Promise.race([
      processDocument(fileId),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Processing timeout after 5 minutes')),
          TIMEOUT_MS
        )
      ),
    ]);

    if (result.success) {
      console.log(
        `✅ Worker successfully processed fileId: ${fileId}. Chunks: ${result.chunkCount}`
      );
      return NextResponse.json({ 
        success: true, 
        fileId: result.fileId,
        chunkCount: result.chunkCount 
      });
    } else {
      console.error(
        `❌ Worker failed to process fileId: ${fileId}. Error: ${result.error}`
      );
      // Return a 500 status to let QStash know the job failed, allowing for potential retries.
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ An unexpected error occurred in the ingestion worker:", error);
    return NextResponse.json(
      { success: false, error: "Internal worker error" },
      { status: 500 }
    );
  }
}
