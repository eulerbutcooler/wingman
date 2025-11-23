"use client";

import React, { useState, useRef } from "react";
import * as courseService from "@/services/course-service";
import { FaArrowRight } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";
import type { Course } from "@/types/library";

type LessonUpdate = {
  title?: string;
  type?: "pdf" | "docx" | "pptx";
  file?: File;
  uploading?: boolean;
  uploadProgress?: number;
};

interface CourseCreatorProps {
  userId: string;
  onSuccess: (course: Course) => void;
  onCancel: () => void;
}

export default function CourseCreator({
  userId,
  onSuccess,
  onCancel,
}: CourseCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    imageFile: null as File | null,
    imageUploading: false,
  });
  const [topics, setTopics] = useState<
    Array<{
      id: string;
      title: string;
      lessons: Array<{
        id: string;
        title: string;
        type: "pdf" | "docx" | "pptx";
        file?: File;
        uploading?: boolean;
        uploadProgress?: number;
      }>;
    }>
  >([]);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const addTopic = () => {
    const newTopic = {
      id: `topic-${Date.now()}`,
      title: `Module ${topics.length + 1}`,
      lessons: [],
    };
    setTopics([...topics, newTopic]);
  };

  const updateTopic = (topicId: string, title: string) => {
    setTopics(
      topics.map((topic) =>
        topic.id === topicId ? { ...topic, title } : topic
      )
    );
  };

  const removeTopic = (topicId: string) => {
    setTopics(topics.filter((topic) => topic.id !== topicId));
  };

  const addLesson = (topicId: string) => {
    const newLesson = {
      id: `lesson-${Date.now()}`,
      title: "New Lesson",
      type: "pdf" as const,
    };
    setTopics(
      topics.map((topic) =>
        topic.id === topicId
          ? { ...topic, lessons: [...topic.lessons, newLesson] }
          : topic
      )
    );
  };

  const updateLesson = (
    topicId: string,
    lessonId: string,
    updates: LessonUpdate
  ) => {
    setTopics(
      topics.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              lessons: topic.lessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, ...updates } : lesson
              ),
            }
          : topic
      )
    );
  };

  const removeLesson = (topicId: string, lessonId: string) => {
    setTopics(
      topics.map((topic) =>
        topic.id === topicId
          ? {
              ...topic,
              lessons: topic.lessons.filter((lesson) => lesson.id !== lessonId),
            }
          : topic
      )
    );
  };

  const handleFileSelect = (topicId: string, lessonId: string, file: File) => {
    console.log(
      "📎 File selected:",
      file.name,
      "for lesson:",
      lessonId,
      "topic:",
      topicId
    );
    const validation = courseService.validateFile(file);
    if (!validation.isValid) {
      console.error("❌ File validation failed:", validation.error);
      alert(validation.error);
      return;
    }

    console.log("✅ File validation passed:", validation.fileType);
    updateLesson(topicId, lessonId, {
      file,
      type: validation.fileType,
      uploading: false,
    });
    console.log("📝 Lesson updated with file");
  };

  const handleImageSelect = async (file: File) => {
    // Validate image file
    const validation = courseService.validateImage(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setFormData((prev) => ({ ...prev, imageFile: file, imageUploading: true }));

    try {
      const result = await courseService.uploadImage(file, userId);
      setFormData((prev) => ({
        ...prev,
        imageUrl: result.url,
        imageUploading: false,
      }));
    } catch (error) {
      console.error("Image upload failed:", error);
      alert(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setFormData((prev) => ({
        ...prev,
        imageFile: null,
        imageUploading: false,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare course data
      const courseData = {
        title: formData.title,
        description: formData.description,
        imageUrl:
          formData.imageUrl ||
          `https://placehold.co/600x400/000000/FFFFFF?text=${encodeURIComponent(
            formData.title.charAt(0).toUpperCase() + formData.title.slice(1)
          )}`,
        userId,
        topics: topics.map((topic) => ({
          title: topic.title,
          lessons: topic.lessons.map((lesson) => ({
            title: lesson.title,
            type: lesson.type,
            duration: undefined,
          })),
        })),
      };

      // Create the course
      const createdCourse = await courseService.createCourse(courseData);
      console.log("Course created:", createdCourse);

      // Upload files for lessons that have them
      console.log("🔍 Checking for files to upload...");
      for (const topic of topics) {
        console.log(`📁 Topic: ${topic.title}, lessons:`, topic.lessons.length);
        for (const lesson of topic.lessons) {
          console.log(
            `📝 Lesson: ${lesson.title}, has file:`,
            !!lesson.file,
            "file:",
            lesson.file
          );
          if (lesson.file) {
            try {
              console.log(`🚀 Starting upload for lesson: ${lesson.title}`);
              updateLesson(topic.id, lesson.id, {
                uploading: true,
                uploadProgress: 0,
              });

              // Find the corresponding lesson in the created course
              const createdTopic = createdCourse.topics?.find(
                (t) => t.title === topic.title
              );
              const createdLesson = createdTopic?.lessons?.find(
                (l) => l.title === lesson.title
              );

              console.log("🔍 Found created topic:", createdTopic?.id);
              console.log("🔍 Found created lesson:", createdLesson?.id);

              if (createdLesson && createdTopic) {
                console.log(`📤 Uploading file for lesson ${createdLesson.id}`);
                const uploadedFile = await courseService.uploadFile(
                  lesson.file,
                  userId,
                  createdLesson.id.toString(),
                  createdTopic.id.toString(),
                  (progress) => {
                    console.log(
                      `📊 Upload progress for ${lesson.title}: ${progress}%`
                    );
                    updateLesson(topic.id, lesson.id, {
                      uploadProgress: progress,
                    });
                  }
                );

                console.log("✅ File uploaded successfully:", uploadedFile);
                console.log(
                  `✅ File ${uploadedFile.id} automatically linked to lesson ${createdLesson.id} during upload process`
                );
                updateLesson(topic.id, lesson.id, {
                  uploading: false,
                  uploadProgress: 100,
                });
              } else {
                console.error("❌ Could not find created lesson or topic");
              }
            } catch (error) {
              console.error(
                "💥 File upload failed for lesson:",
                lesson.title,
                error
              );
              updateLesson(topic.id, lesson.id, {
                uploading: false,
                uploadProgress: 0,
              });
            }
          }
        }
      }

      onSuccess(createdCourse);
    } catch (error) {
      console.error("Course creation failed:", error);
      alert(
        `Failed to create course: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-slate-50 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-soft-light"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent via-50% to-slate-50"></div>

      <div className="relative z-10 w-full md:w-11/12 px-4 md:px-6 pt-24 md:pt-34 pb-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button
            onClick={onCancel}
            className="px-3 md:px-4 py-2 text-slate-600 cursor-pointer flex hover:text-blue-600 items-center gap-2 md:gap-4 transition-colors text-sm md:text-base"
          >
            <FaArrowLeft />
            Go back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 w-full">
          {/* Course Details */}
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
            <div className="bg-white p-4 md:p-6 h-fit rounded-3xl w-full lg:w-1/2 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-slate-900">
                Course Information
              </h2>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 md:px-4 py-2 border border-slate-200 rounded-xl text-sm md:text-base bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Enter course title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Describe what students will learn"
                  />
                </div>
                
              </div>
              <div className="flex justify-end mt-8 gap-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl hover:border-blue-600 hover:text-blue-600 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || !formData.title || !formData.description
                  }
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Creating Course..." : "Create Course"}
                </button>
              </div>
            </div>

            {/* Topics */}
            <div className="p-6 rounded-3xl border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white w-1/2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Course Topics</h2>
                <button
                  type="button"
                  onClick={addTopic}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Add Topic
                </button>
              </div>

              <div className="space-y-6">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="border border-slate-200 bg-slate-50 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => updateTopic(topic.id, e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white"
                        placeholder="Topic title"
                      />
                      <button
                        type="button"
                        onClick={() => addLesson(topic.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition-colors text-sm"
                      >
                        Add Lesson
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTopic(topic.id)}
                        className="px-4 py-2 cursor-pointer border border-slate-200 text-slate-600 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Lessons */}
                    <div className="space-y-3 ml-4">
                      {topic.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200"
                        >
                          <FaArrowRight className="text-blue-600" />
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) =>
                              updateLesson(topic.id, lesson.id, {
                                title: e.target.value,
                              })
                            }
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                            placeholder="Lesson title"
                          />
                          <select
                            value={lesson.type}
                            onChange={(e) =>
                              updateLesson(topic.id, lesson.id, {
                                type: e.target.value as "pdf" | "docx" | "pptx",
                              })
                            }
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                          >
                            <option value="pdf">PDF</option>
                            <option value="docx">Word Document</option>
                            <option value="pptx">PowerPoint</option>
                          </select>
                          <input
                            ref={(el) => {
                              fileInputRefs.current[
                                `${topic.id}-${lesson.id}`
                              ] = el;
                            }}
                            type="file"
                            accept={
                              lesson.type === "pdf"
                                ? ".pdf"
                                : lesson.type === "docx"
                                ? ".docx,.doc"
                                : ".pptx,.ppt"
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileSelect(topic.id, lesson.id, file);
                              }
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              fileInputRefs.current[
                                `${topic.id}-${lesson.id}`
                              ]?.click();
                            }}
                            disabled={lesson.uploading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 disabled:bg-slate-400 transition-colors text-sm"
                          >
                            {lesson.uploading
                              ? `${lesson.uploadProgress || 0}%`
                              : lesson.file
                              ? "Change"
                              : "Select"}
                          </button>
                          {lesson.file && (
                            <span className="text-xs text-green-600">
                              ✓ {lesson.file.name}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeLesson(topic.id, lesson.id)}
                            className="px-4 py-2 bg-white border border-slate-200 cursor-pointer text-slate-600 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
        </form>
      </div>
    </div>
  );
}
