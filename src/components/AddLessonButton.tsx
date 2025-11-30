"use client";

import React, { useState, useRef } from "react";
import { FaPlus } from "react-icons/fa6";
import { FileText } from "lucide-react";
import * as courseService from "@/services/course-service";

interface AddLessonButtonProps {
  topicId: string;
  onSuccess?: () => void;
}

export default function AddLessonButton({
  topicId,
  onSuccess,
}: AddLessonButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"pdf" | "docx" | "pptx">("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = courseService.validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
    setLessonType(validation.fileType as "pdf" | "docx" | "pptx");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonTitle.trim()) {
      setError("Lesson title is required");
      return;
    }

    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Create lesson
      const newLesson = await courseService.createLesson({
        title: lessonTitle.trim(),
        type: lessonType,
        topicId,
      });

      console.log("✅ Lesson created:", newLesson.id);

      // Step 2: Upload file and link to lesson
      setUploadProgress(10);
      await courseService.uploadFile(
        selectedFile,
        undefined,
        newLesson.id,
        topicId,
        (progress) => {
          setUploadProgress(10 + (progress * 0.9)); // 10% for lesson creation, 90% for upload
        }
      );

      console.log("✅ File uploaded and processing queued");

      // Reset and close
      setLessonTitle("");
      setSelectedFile(null);
      setUploadProgress(0);
      setIsOpen(false);

      // Notify parent
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to create lesson:", err);
      setError(err instanceof Error ? err.message : "Failed to create lesson");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false);
      setLessonTitle("");
      setSelectedFile(null);
      setUploadProgress(0);
      setError(null);
    }
  };

  return (
    <>
      {/* Add Lesson Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black font-medium transition-colors group"
      >
        <div className="w-6 h-6 bg-navy/10 rounded-full flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all">
          <FaPlus className="text-xs" />
        </div>
        Add Lesson
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-4xl shadow-2xl w-full max-w-md">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 text-black">
                Add New Lesson
              </h2>

              <form onSubmit={handleSubmit}>
                {/* Lesson Title */}
                <div className="mb-4">
                  <label
                    htmlFor="lessonTitle"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Lesson Title
                  </label>
                  <input
                    id="lessonTitle"
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g., Ramjet Engine Fundamentals"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-all"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {/* File Type Selection */}
                <div className="mb-4">
                  <label
                    htmlFor="lessonType"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    File Type
                  </label>
                  <select
                    id="lessonType"
                    value={lessonType}
                    onChange={(e) =>
                      setLessonType(e.target.value as "pdf" | "docx" | "pptx")
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-all"
                    disabled={isLoading || !!selectedFile}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="docx">Word Document</option>
                    <option value="pptx">PowerPoint Presentation</option>
                  </select>
                </div>

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={
                      lessonType === "pdf"
                        ? ".pdf"
                        : lessonType === "docx"
                        ? ".docx,.doc"
                        : ".pptx,.ppt"
                    }
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-2xl hover:border-navy hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5 text-gray-500" />
                    {selectedFile ? (
                      <span className="text-sm font-medium text-navy">
                        ✓ {selectedFile.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Click to select file
                      </span>
                    )}
                  </button>
                </div>

                {/* Upload Progress */}
                {isLoading && uploadProgress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-navy transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isLoading || !lessonTitle.trim() || !selectedFile
                    }
                    className="flex-1 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Lesson"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
