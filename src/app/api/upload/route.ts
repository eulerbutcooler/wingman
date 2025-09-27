import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveFileRecord } from "@/lib/actions/files/file-actions";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { processDocument } from "@/lib/rag/document-processor";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const lessonId = formData.get("lessonId") as string;
    const topicId = formData.get("topicId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only PDF, DOCX, and PPTX files are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 100MB" },
        { status: 400 }
      );
    }

    // Create Supabase client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate unique filename
    const timestamp = Date.now();
    const userId = user.id;
    const extension = file.name.split(".").pop();
    const fileName = `${
      file.name.split(".")[0]
    }_${userId}_${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const filePath = `documents/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("course_material")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("course_material")
      .getPublicUrl(filePath);

    // Save file record to database
    const savedFile = await saveFileRecord({
      lessonId: lessonId || undefined,
      originalName: file.name,
      filename: fileName,
      mimeType: file.type,
      size: file.size,
      publicUrl: publicUrlData.publicUrl, // Public URL for direct access
    });

    // Trigger RAG processing asynchronously (don't wait for it to complete)
    console.log(`🚀 Triggering RAG processing for file: ${savedFile.id}`);
    console.log(`📄 File details:`, {
      fileId: savedFile.id,
      originalName: file.name,
      size: file.size,
      type: file.type,
      lessonId: lessonId || "none",
      topicId: topicId || "none",
      publicUrl: publicUrlData.publicUrl,
    });

    // Process document in background
    processDocument(savedFile.id)
      .then((result) => {
        console.log(
          `✅ RAG processing completed for file ${savedFile.id}:`,
          result
        );
      })
      .catch((error: unknown) => {
        console.error(
          `❌ RAG processing failed for file ${savedFile.id}:`,
          error
        );
        if (error instanceof Error) {
          console.error(`❌ Error details:`, {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }
      });

    return NextResponse.json({
      success: true,
      file: savedFile,
      message: "File uploaded successfully, processing started",
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for fetching file info
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

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const { getFileInfo } = await import("@/lib/actions/files/file-actions");
    const fileInfo = await getFileInfo(fileId);

    if (!fileInfo) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      file: fileInfo,
    });
  } catch (error) {
    console.error("Error fetching file info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
