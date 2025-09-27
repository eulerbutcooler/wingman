"use server";

import { db } from "@/services/db/drizzle";
import { files } from "@/services/db/schema/courses";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { eq, and } from "drizzle-orm";

export interface SaveFileData {
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  publicUrl: string; // Public URL for direct access
  topicId?: string;
}

export interface UploadedFile {
  id: string; // UUID from database
  userId: number;
  topicId?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadStatus: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveFileRecordData {
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  publicUrl: string; // Public URL for direct access
  lessonId?: string;
}

export interface FileRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  processingStatus: string;
  createdAt: Date;
}

/**
 * Save file record to database after successful Supabase upload
 */
export async function saveFileRecord(
  data: SaveFileRecordData
): Promise<FileRecord> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Save file record to database
    const [savedFile] = await db
      .insert(files)
      .values({
        userId: user.id, // Use the authenticated user's integer ID
        originalName: data.originalName,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.size,
        publicUrl: data.publicUrl, // Public URL for direct access
        processingStatus: "completed",
        createdAt: new Date(),
      })
      .returning();

    // If lessonId is provided, update the lesson to reference this file
    if (data.lessonId) {
      const { lessons } = await import("@/services/db/schema/courses");
      const { eq } = await import("drizzle-orm");

      await db
        .update(lessons)
        .set({ fileId: savedFile.id })
        .where(eq(lessons.id, data.lessonId));

      console.log(`✅ Linked file ${savedFile.id} to lesson ${data.lessonId}`);
    }

    return {
      id: savedFile.id,
      fileName: savedFile.originalName,
      fileUrl: savedFile.publicUrl, // Use publicUrl field from schema
      fileType: savedFile.mimeType,
      fileSize: savedFile.size,
      processingStatus: savedFile.processingStatus || "completed",
      createdAt: savedFile.createdAt!,
    };
  } catch (error) {
    console.error("❌ Error saving file record:", error);
    throw new Error("Failed to save file record");
  }
}

/**
 * Get file information by ID
 */
export async function getFileInfo(fileId: string): Promise<FileRecord | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const [fileInfo] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, user.id)))
      .limit(1);

    if (!fileInfo) {
      return null;
    }

    return {
      id: fileInfo.id,
      fileName: fileInfo.originalName,
      fileUrl: fileInfo.publicUrl, // Use publicUrl field from schema
      fileType: fileInfo.mimeType,
      fileSize: fileInfo.size,
      processingStatus: fileInfo.processingStatus || "completed",
      createdAt: fileInfo.createdAt || new Date(),
    };
  } catch (error) {
    console.error("❌ Error getting file info:", error);
    return null;
  }
}

/**
 * Delete file record and file from Supabase storage
 */
export async function deleteFile(
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get file info first
    const [fileInfo] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, user.id)))
      .limit(1);

    if (!fileInfo) {
      return { success: false, error: "File not found" };
    }

    // Delete from database
    await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.userId, user.id)));

    // TODO: Also delete from Supabase storage using the file path
    // This would require the Supabase client in a server action context

    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    return { success: false, error: "Failed to delete file" };
  }
}
