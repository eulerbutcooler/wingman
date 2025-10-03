import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveFileRecord } from "@/lib/actions/files/file-actions";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { qstashClient } from "@/lib/qstash";
import { processDocument } from "@/lib/rag/document-processor";

// The endpoint for the ingestion worker that QStash will call.
// It's critical to provide the full URL where your application is deployed.
const INGESTION_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_URL + "/api/ingest/webhook";

if (!process.env.NEXT_PUBLIC_URL) {
  throw new Error("Missing NEXT_PUBLIC_APP_URL environment variable");
}

// Check if we're in localhost/development mode
const isLocalhost =
  process.env.NEXT_PUBLIC_URL?.includes("localhost") ||
  process.env.NEXT_PUBLIC_URL?.includes("127.0.0.1") ||
  process.env.NEXT_PUBLIC_URL?.includes("::1");

export async function POST(request: NextRequest) {
  try {
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
    const courseId = formData.get("courseId") as string;

    console.log(`📋 Upload request details:`, {
      fileName: file?.name,
      lessonId: lessonId || "not provided",
      topicId: topicId || "not provided",
      courseId: courseId || "not provided",
    });

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // --- File Validation (unchanged) ---
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type." },
        { status: 400 }
      );
    }
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 100MB" },
        { status: 400 }
      );
    }

    // --- File Upload to Storage (unchanged) ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const fileName = `${file.name.split(".")[0]}_${
      user.id
    }_${timestamp}.${extension}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("course_material")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("course_material")
      .getPublicUrl(filePath);

    // --- Save Initial File Record with 'queued' status ---
    const savedFile = await saveFileRecord({
      originalName: file.name,
      filename: fileName,
      mimeType: file.type,
      size: file.size,
      publicUrl: publicUrlData.publicUrl,
      processingStatus: "queued", // Set initial status to 'queued'
      lessonId: lessonId || undefined, // Pass lessonId if provided
    });

    // --- ARCHITECTURE CHANGE: Enqueue Job instead of Direct Processing ---
    // Instead of processing the document synchronously, we publish a job to the queue.
    // The worker will pick this up asynchronously.

    if (isLocalhost || !qstashClient) {
      // For localhost development or when QStash is not configured, process directly
      console.log(
        `🏠 ${
          isLocalhost ? "Localhost" : "No QStash"
        } detected - processing file ${savedFile.id} directly`
      );

      // Process document in background for localhost
      processDocument(savedFile.id)
        .then((result) => {
          console.log(
            `✅ Direct processing completed for file ${savedFile.id}:`,
            result
          );
        })
        .catch((error: unknown) => {
          console.error(
            `❌ Direct processing failed for file ${savedFile.id}:`,
            error
          );
        });

      console.log(`✅ File ${savedFile.id} is being processed directly.`);
    } else {
      // For production with QStash configured, use QStash queue
      try {
        await qstashClient.publishJSON({
          url: INGESTION_WEBHOOK_URL,
          // The body contains the necessary information for the worker.
          body: {
            fileId: savedFile.id,
          },
          // Optional: Add a delay or configure retries
          // retries: 3,
        });

        console.log(`✅ File ${savedFile.id} has been queued for processing.`);
      } catch (qstashError) {
        console.error(
          "❌ QStash error, falling back to direct processing:",
          qstashError
        );

        // Fallback to direct processing if QStash fails
        processDocument(savedFile.id)
          .then((result) => {
            console.log(
              `✅ Fallback processing completed for file ${savedFile.id}:`,
              result
            );
          })
          .catch((error: unknown) => {
            console.error(
              `❌ Fallback processing failed for file ${savedFile.id}:`,
              error
            );
          });

        console.log(
          `✅ File ${savedFile.id} is being processed directly (fallback mode).`
        );
      }
    }

    // --- Respond Immediately to the Client ---
    // The API now returns a response instantly, without waiting for the RAG processing.
    return NextResponse.json({
      success: true,
      file: savedFile,
      message: isLocalhost
        ? "File uploaded successfully and is being processed directly (localhost mode)."
        : "File uploaded successfully and is now queued for processing.",
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
