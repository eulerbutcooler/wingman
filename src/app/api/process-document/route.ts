import { NextRequest, NextResponse } from "next/server";
import {
  processDocument,
  processDocuments,
} from "@/lib/rag/document-processor";

// POST /api/process-documents - Process uploaded documents for RAG
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [DOC-PROCESS] Starting document processing request");

    const body = await request.json();
    const { fileId, fileIds } = body;

    console.log("📝 [DOC-PROCESS] Document processing request received:", {
      fileId,
      fileIds,
      hasSingleFile: !!fileId,
      hasMultipleFiles: !!fileIds,
      multipleFilesCount: fileIds?.length || 0,
    });

    if (!fileId && !fileIds) {
      console.error("❌ [DOC-PROCESS] No file IDs provided");
      return NextResponse.json(
        { error: "Either fileId or fileIds must be provided" },
        { status: 400 }
      );
    }

    let results;

    if (fileId) {
      // Process single document
      console.log("📄 [DOC-PROCESS] Processing single document", { fileId });
      const result = await processDocument(fileId);
      results = [result];
      console.log("✅ [DOC-PROCESS] Single document processed", {
        fileId,
        success: result.success,
        chunkCount: result.chunkCount,
        error: result.error,
      });
    } else {
      // Process multiple documents
      console.log("📚 [DOC-PROCESS] Processing multiple documents", {
        count: fileIds.length,
        fileIds,
      });
      results = await processDocuments(fileIds);
      console.log("✅ [DOC-PROCESS] Multiple documents processed", {
        totalFiles: fileIds.length,
        results: results.map((r) => ({
          fileId: r.fileId,
          success: r.success,
          chunkCount: r.chunkCount,
        })),
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + r.chunkCount, 0);

    console.log(`🎉 [DOC-PROCESS] Processing completed successfully`, {
      successCount,
      failureCount,
      totalChunks,
      totalFiles: results.length,
    });

    console.log(
      `✅ Processing completed: ${successCount} successful, ${failureCount} failed, ${totalChunks} total chunks`
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount} documents successfully`,
      results,
      summary: {
        processed: results.length,
        successful: successCount,
        failed: failureCount,
        totalChunks,
      },
    });
  } catch (error) {
    console.error("💥 [DOC-PROCESS] Critical error processing documents:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      timestamp: new Date().toISOString(),
    });
    console.error("💥 Error processing documents:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/process-documents - Check processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId parameter is required" },
        { status: 400 }
      );
    }

    const { db } = await import("@/services/db/drizzle");
    const { files } = await import("@/services/db/schema/courses");
    const { eq } = await import("drizzle-orm");

    const [fileRecord] = await db
      .select({
        id: files.id,
        originalName: files.originalName,
        processingStatus: files.processingStatus,
        processingError: files.processingError,
        chunkCount: files.chunkCount,
      })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      file: fileRecord,
    });
  } catch (error) {
    console.error("Error checking processing status:", error);

    return NextResponse.json(
      {
        error: "Failed to check processing status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
