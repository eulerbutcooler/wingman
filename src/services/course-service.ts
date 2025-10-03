// Course Management API Client
// Client-side service for interacting with course-related API routes

import { createClient } from "@/services/supabase/client";
import type {
  Course,
  Topic,
  Lesson,
  UploadedFile,
  CreateCourseData,
  FileValidationResult,
  ImageValidationResult,
} from "@/types";

// Base API URL for course operations
const BASE_URL = "/api";

// ============================================================================
// COURSE MANAGEMENT
// ============================================================================

export async function createCourse(
  courseData: CreateCourseData
): Promise<Course> {
  const response = await fetch(`${BASE_URL}/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(courseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create course");
  }

  const result = await response.json();
  return result.course;
}

export async function getCourses(_userId?: string): Promise<Course[]> {
  const response = await fetch(`${BASE_URL}/courses`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch courses");
  }

  const result = await response.json();
  return result.courses;
}

export async function deleteCourse(
  courseId: string,
  _userId?: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/courses?courseId=${courseId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete course");
  }
}

// ============================================================================
// TOPIC MANAGEMENT
// ============================================================================

export async function createTopic(
  title: string,
  courseId: string
): Promise<Topic> {
  const response = await fetch(`${BASE_URL}/topics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, courseId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create topic");
  }

  const result = await response.json();
  return result.topic;
}

export async function getTopics(courseId: string): Promise<Topic[]> {
  const response = await fetch(`${BASE_URL}/topics?courseId=${courseId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch topics");
  }

  const result = await response.json();
  return result.topics;
}

export async function updateTopic(
  topicId: string,
  updates: { title?: string; order?: number }
): Promise<Topic> {
  const response = await fetch(`${BASE_URL}/topics`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topicId, ...updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update topic");
  }

  const result = await response.json();
  return result.topic;
}

export async function deleteTopic(topicId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/topics?topicId=${topicId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete topic");
  }
}

// ============================================================================
// LESSON MANAGEMENT
// ============================================================================

export async function createLesson(lessonData: {
  title: string;
  type: "pdf" | "docx" | "pptx";
  topicId: string;
  fileId?: string;
  duration?: string;
}): Promise<Lesson> {
  const response = await fetch(`${BASE_URL}/lessons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lessonData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create lesson");
  }

  const result = await response.json();
  return result.lesson;
}

export async function getLessons(topicId: string): Promise<Lesson[]> {
  const response = await fetch(`${BASE_URL}/lessons?topicId=${topicId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch lessons");
  }

  const result = await response.json();
  return result.lessons;
}

export async function updateLesson(
  lessonId: string | number,
  updates: {
    title?: string;
    order?: number;
    duration?: string;
    fileId?: string;
  }
): Promise<Lesson> {
  console.log("🔄 [COURSE_SERVICE] updateLesson called with:", {
    lessonId,
    lessonIdType: typeof lessonId,
    updates,
    fileId: updates.fileId,
    fileIdType: typeof updates.fileId,
  });

  const response = await fetch(`${BASE_URL}/lessons/${lessonId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update lesson");
  }

  const result = await response.json();
  return result.lesson;
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/lessons?lessonId=${lessonId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete lesson");
  }
}

// ============================================================================
// FILE UPLOAD & PROCESSING (Using Supabase Client)
// ============================================================================

export async function uploadFile(
  file: File,
  _userId?: string,
  lessonId?: string,
  topicId?: string,
  _onProgress?: (progress: number) => void
): Promise<UploadedFile> {
  // Create FormData for API request
  const formData = new FormData();
  formData.append("file", file);
  if (lessonId) formData.append("lessonId", lessonId);
  if (topicId) formData.append("topicId", topicId);

  // Upload via API route
  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload file");
  }

  const result = await response.json();
  const savedFile = result.file;

  // Convert FileRecord to UploadedFile format
  return {
    id: savedFile.id, // Use the actual file UUID from database
    userId: savedFile.userId,
    lessonId: savedFile.lessonId ? parseInt(savedFile.lessonId) : undefined,
    fileName: savedFile.fileName,
    originalName: savedFile.fileName,
    filename: savedFile.fileName,
    fileUrl: savedFile.fileUrl,
    url: savedFile.fileUrl,
    fileType: savedFile.fileType,
    type: (file.type.includes("pdf")
      ? "pdf"
      : file.type.includes("pptx")
      ? "pptx"
      : "docx") as "pdf" | "docx" | "pptx",
    fileSize: savedFile.fileSize,
    size: savedFile.fileSize,
    uploadStatus: savedFile.uploadStatus,
    createdAt: savedFile.createdAt,
    updatedAt: savedFile.updatedAt,
  };
}

export async function uploadImage(
  file: File,
  _userId?: string,
  _onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string }> {
  const supabase = createClient();

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split(".").pop();
  const fileName = `${
    file.name.split(".")[0]
  }_${timestamp}_${randomString}.${extension}`;

  // Upload to Supabase Storage
  const filePath = `images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("course_material")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image");
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("course_material")
    .getPublicUrl(filePath);

  return {
    url: publicUrlData.publicUrl,
    publicId: fileName,
  };
}

export async function processFile(
  filePath: string,
  fileType: "pdf" | "docx" | "pptx",
  originalName: string
) {
  const response = await fetch(`${BASE_URL}/process-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filePath, fileType, originalName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to process file");
  }

  const result = await response.json();
  return result.metadata;
}

export async function getFileInfo(fileId: string) {
  const { getFileInfo: getFileInfoAction } = await import(
    "@/lib/actions/files/file-actions"
  );

  const fileInfo = await getFileInfoAction(fileId);

  if (!fileInfo) {
    throw new Error("File not found");
  }

  return fileInfo;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function validateFile(file: File): FileValidationResult {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const pdfTypes = ["application/pdf"];
  const docxTypes = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-word",
  ];
  const pptxTypes = [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ];

  if (file.size > maxSize) {
    return { isValid: false, error: "File size must be less than 100MB" };
  }

  if (pdfTypes.includes(file.type)) {
    return { isValid: true, fileType: "pdf" };
  }

  if (docxTypes.includes(file.type)) {
    return { isValid: true, fileType: "docx" };
  }

  if (pptxTypes.includes(file.type)) {
    return { isValid: true, fileType: "pptx" };
  }

  return {
    isValid: false,
    error:
      "Only PDF files, Word documents (DOCX), and PowerPoint presentations (PPTX) are supported",
  };
}

export function validateImage(file: File): ImageValidationResult {
  const maxSize = 10 * 1024 * 1024; // 10MB for images
  const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    return { isValid: false, error: "Image size must be less than 10MB" };
  }

  if (!imageTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Only JPEG, PNG, and WebP images are supported",
    };
  }

  return { isValid: true };
}
