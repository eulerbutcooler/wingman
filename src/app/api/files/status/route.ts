import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/services/db/drizzle";
import { files } from "@/services/db/schema/courses";
import { eq, inArray } from "drizzle-orm";

/**
 * GET /api/files/status
 * Check the processing status of uploaded files
 * 
 * Query params:
 * - fileId: Single file ID to check
 * - fileIds: Comma-separated list of file IDs to check
 * 
 * Returns:
 * - Single file: { fileId, status, error, chunkCount, ... }
 * - Multiple files: { files: [...], summary: { ... } }
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const fileIdsParam = searchParams.get("fileIds");

    // Single file status check
    if (fileId) {
      const [fileRecord] = await db
        .select({
          id: files.id,
          originalName: files.originalName,
          processingStatus: files.processingStatus,
          processingError: files.processingError,
          chunkCount: files.chunkCount,
          createdAt: files.createdAt,
        })
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (!fileRecord) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        fileId: fileRecord.id,
        fileName: fileRecord.originalName,
        status: fileRecord.processingStatus || "pending",
        error: fileRecord.processingError,
        chunkCount: fileRecord.chunkCount || 0,
        isComplete: fileRecord.processingStatus === "completed",
        isFailed: fileRecord.processingStatus === "failed",
        isProcessing: fileRecord.processingStatus === "processing",
        createdAt: fileRecord.createdAt,
      });
    }

    // Multiple files status check
    if (fileIdsParam) {
      const fileIds = fileIdsParam.split(",").map((id) => id.trim());

      if (fileIds.length === 0) {
        return NextResponse.json(
          { error: "No file IDs provided" },
          { status: 400 }
        );
      }

      const fileRecords = await db
        .select({
          id: files.id,
          originalName: files.originalName,
          processingStatus: files.processingStatus,
          processingError: files.processingError,
          chunkCount: files.chunkCount,
          createdAt: files.createdAt,
        })
        .from(files)
        .where(inArray(files.id, fileIds));

      // Calculate summary
      const summary = {
        total: fileRecords.length,
        pending: fileRecords.filter((f) => !f.processingStatus || f.processingStatus === "pending").length,
        processing: fileRecords.filter((f) => f.processingStatus === "processing").length,
        completed: fileRecords.filter((f) => f.processingStatus === "completed").length,
        failed: fileRecords.filter((f) => f.processingStatus === "failed").length,
        allComplete: fileRecords.every((f) => f.processingStatus === "completed"),
        anyFailed: fileRecords.some((f) => f.processingStatus === "failed"),
      };

      return NextResponse.json({
        success: true,
        files: fileRecords.map((f) => ({
          fileId: f.id,
          fileName: f.originalName,
          status: f.processingStatus || "pending",
          error: f.processingError,
          chunkCount: f.chunkCount || 0,
          isComplete: f.processingStatus === "completed",
          isFailed: f.processingStatus === "failed",
          isProcessing: f.processingStatus === "processing",
        })),
        summary,
      });
    }

    // No fileId or fileIds provided
    return NextResponse.json(
      { error: "fileId or fileIds parameter required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching file status:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
