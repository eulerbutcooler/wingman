import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db/drizzle";
import { files } from "@/services/db/schema/courses";
import { eq } from "drizzle-orm";

/**
 * POST /api/ingest/failed
 * 
 * QStash calls this endpoint when document processing fails after all retries.
 * This is the Dead Letter Queue (DLQ) handler.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      console.error("❌ [INGEST-FAILED] No fileId provided in failure callback");
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    console.log(`🚨 [INGEST-FAILED] Processing failure for file ${fileId}`);

    // Mark the file as failed in the database
    await db
      .update(files)
      .set({
        processingStatus: "failed",
        processingError: "Processing failed after 3 retries. Please try re-uploading the file.",
      })
      .where(eq(files.id, fileId));

    console.log(`✅ [INGEST-FAILED] Marked file ${fileId} as failed in database`);

    // TODO: Optionally notify the user via email or in-app notification
    // await notifyUserOfFailure(fileId);

    return NextResponse.json({
      success: true,
      message: "Failure recorded successfully",
    });
  } catch (error) {
    console.error("❌ [INGEST-FAILED] Error handling failure callback:", error);
    
    // Return 200 anyway to prevent QStash from retrying this callback
    return NextResponse.json({
      success: false,
      error: "Error handling failure, but acknowledged",
    });
  }
}
