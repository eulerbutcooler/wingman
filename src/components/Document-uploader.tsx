"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  FileText,
  FileX,
  CheckCircle,
  Clock,
  AlertCircle,
  Presentation,
} from "lucide-react";
import { cn } from "@/services/utils";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "processing" | "ready" | "error";
  progress: number;
  error?: string;
  url?: string;
  fileType?: "pdf" | "pptx" | "docx";
}

interface DocumentUploaderProps {
  userId?: string;
  lessonId?: string;
  topicId?: string;
  onFileUploaded?: (file: UploadedFile) => void;
}

export default function DocumentUploader({
  userId,
  lessonId,
  topicId,
  onFileUploaded,
}: DocumentUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const uploadToSupabase = async (file: File, _fileId: string) => {
    try {
      // Use course-service upload function instead of API
      const { uploadFile } = await import("@/services/course-service");

      const uploadedFile = await uploadFile(
        file,
        userId || undefined,
        lessonId || undefined,
        topicId || undefined
      );

      return {
        success: true,
        message: "File uploaded successfully",
        file: uploadedFile,
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: "uploading" as const,
        progress: 0,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Upload files to Supabase
      newFiles.forEach((uploadedFile) => {
        uploadFile(uploadedFile.id);
      });
    },
    // Note: uploadFile is defined below but called within this callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, lessonId, topicId]
  );

  const uploadFile = async (fileId: string) => {
    const fileToUpload = uploadedFiles.find((f) => f.id === fileId);
    if (!fileToUpload) return;

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((file) => {
            if (
              file.id === fileId &&
              file.status === "uploading" &&
              file.progress < 90
            ) {
              return { ...file, progress: file.progress + 10 };
            }
            return file;
          })
        );
      }, 200);

      const result = await uploadToSupabase(fileToUpload.file, fileId);

      clearInterval(progressInterval);

      setUploadedFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId) {
            const updatedFile = {
              ...file,
              status: "ready" as const,
              progress: 100,
              url: result.file.url,
              fileType: result.file.type,
            };
            if (onFileUploaded) {
              onFileUploaded(updatedFile);
            }
            return updatedFile;
          }
          return file;
        })
      );
    } catch (error) {
      setUploadedFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId) {
            return {
              ...file,
              status: "error" as const,
              progress: 0,
              error: error instanceof Error ? error.message : "Upload failed",
            };
          }
          return file;
        })
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow":
        [".ppsx"],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
  });

  const getFileIcon = (file: File | UploadedFile) => {
    const fileName = "name" in file ? file.name : file.file.name;
    const fileType = fileName.toLowerCase();

    if (fileType.includes(".pdf")) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (
      fileType.includes(".pptx") ||
      fileType.includes(".ppt") ||
      fileType.includes(".ppsx")
    ) {
      return <Presentation className="h-8 w-8 text-orange-500" />;
    } else if (fileType.includes(".docx") || fileType.includes(".doc")) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }

    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "ready":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing...";
      case "ready":
        return "Ready";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents & Media</CardTitle>
          <CardDescription>
            Upload PDF, DOCX, PPTX, PPSX, MP4 files, or images for your course
            content. Maximum file size: 100MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">
                Drop the files here...
              </p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">
                  Drag & drop files here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOCX, PPTX, and PPSX files
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              Track the status of your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getFileIcon(uploadedFile)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                        {uploadedFile.fileType && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {uploadedFile.fileType.toUpperCase()}
                          </span>
                        )}
                      </p>
                      {uploadedFile.error && (
                        <p className="text-sm text-red-500 mt-1">
                          {uploadedFile.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {(uploadedFile.status === "uploading" ||
                      uploadedFile.status === "processing") && (
                      <div className="w-32">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{getStatusText(uploadedFile.status)}</span>
                          <span>{uploadedFile.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      {getStatusIcon(uploadedFile.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(uploadedFile.status)}
                      </span>
                    </div>

                    {uploadedFile.status === "ready" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (uploadedFile.url) {
                            window.open(uploadedFile.url, "_blank");
                          }
                        }}
                      >
                        View
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setUploadedFiles((prev) =>
                          prev.filter((f) => f.id !== uploadedFile.id)
                        );
                      }}
                    >
                      <FileX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
