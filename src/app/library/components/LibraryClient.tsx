"use client";

/**
 * Library Client Component
 *
 * This is the client-side interactive part of the library page.
 * It receives initial data from the server component for faster loading.
 */

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useLibraryStore } from "@/stores";
import CourseCreator from "@/components/CourseCreator";
import AddTopicButton from "@/components/AddTopicButton";
import AddLessonButton from "@/components/AddLessonButton";
import FileViewerModal from "@/components/FileViewerModal";
import { FaPlus, FaArrowLeft } from "react-icons/fa6";
import { BookOpen, FileText, Presentation, ExternalLink } from "lucide-react";
import * as courseService from "@/services/course-service";
import type { Course, Topic, Lesson } from "@/types/library";

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const LoadingSpinner = () => (
  <div className="flex justify-center text-xl h-[50vh] items-center">
    <div className="loader"></div>
  </div>
);

const ErrorMessage = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="text-center py-12">
    <p className="text-red-600 mb-4">Error: {error}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Retry
    </button>
  </div>
);

const CourseCard = React.memo(
  ({ course, onClick, index }: { course: Course; onClick: () => void; index: number }) => {
    // Simple sequential image naming - rename these files in /public folder
    const imagePath = `/image${index + 1}.jpg`;
    
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-3xl border-2 border-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
      >
        <div className="relative h-32 md:h-40 flex items-center justify-center p-4">
          <Image
            src={imagePath}
            alt={course.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/30 transition-colors duration-300" />
          <h3 className="relative z-10 text-xl md:text-2xl font-bold text-white text-center capitalize leading-tight">
            {course.title}
          </h3>
        </div>

        <div className="p-4 md:p-6">
          <p className="text-slate-600 text-sm md:text-base capitalize leading-relaxed">
            {course.description}
          </p>
        </div>
      </div>
    );
  }
);

CourseCard.displayName = "CourseCard";

const CreateCourseCard = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex gap-2 md:gap-3 items-center px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors text-sm md:text-base font-medium shadow-sm"
  >
    <FaPlus className="text-sm md:text-base" />
    Add New Course
  </button>
);

const BackButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="flex items-center cursor-pointer font-medium text-slate-600 hover:text-slate-900 mb-4 md:mb-6 transition-colors duration-300 text-sm md:text-base"
  >
    <FaArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
    {children}
  </button>
);

// ============================================================================
// VIEW COMPONENTS
// ============================================================================

const LibraryView = ({
  courses,
  loading,
  onCourseSelect,
  onCreateCourse,
}: {
  courses: Course[];
  loading: boolean;
  onCourseSelect: (course: Course) => void;
  onCreateCourse: () => void;
}) => (
  <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide bg-slate-50 relative overflow-hidden">
    {/* Grid Pattern Background */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-soft-light"></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    {/* Gradient fade overlay - fades grid on both left and right sides */}
    <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent via-50% to-slate-50"></div>

    <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h1 className="text-left text-3xl md:text-4xl font-bold text-slate-900">
            Library
          </h1>
          <p className="text-slate-600 text-left mt-2 md:mt-4 mb-4 md:mb-6 text-base md:text-lg">
            Explore your courses or create a new one to get started.
          </p>
        </div>
        <CreateCourseCard onClick={onCreateCourse} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-2xl md:rounded-3xl w-full py-6 md:py-8 mb-10 md:mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                onClick={() => onCourseSelect(course)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const CourseView = ({
  course,
  courseSummary,
  loading,
  onBack,
  onDelete,
  onTopicSelect,
  onRefresh,
}: {
  course: Course;
  courseSummary: string;
  loading: boolean;
  onBack: () => void;
  onDelete: () => void;
  onTopicSelect: (topic: Topic) => void;
  onRefresh?: () => void;
}) => (
  <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide bg-slate-50 relative overflow-hidden">
    {/* Grid Pattern Background */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-soft-light"></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    {/* Gradient fade overlay - fades grid on both left and right sides */}
    <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent via-50% to-slate-50"></div>

    <div className="relative z-10 w-full md:w-11/12 pt-24 md:pt-34 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <BackButton onClick={onBack}>Back to Library</BackButton>
        <button
          className={`font-medium transition-colors duration-300 mb-4 md:mb-6 px-4 py-2 rounded-xl ${
            loading
              ? "text-slate-400 bg-slate-100 cursor-not-allowed"
              : "text-red-600 hover:text-white hover:bg-red-600 border border-red-200"
          }`}
          onClick={onDelete}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete Course"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start mb-8 gap-6">
        <div className="w-full md:w-72 h-48 bg-slate-900 rounded-3xl flex items-center justify-center p-4 mx-auto md:mx-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <h3 className="text-lg md:text-xl font-bold text-white text-center capitalize leading-tight">
            {course.title}
          </h3>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 capitalize text-center md:text-left">
            {course.title}
          </h1>
          <p className="text-slate-600 mt-2 capitalize text-center md:text-left text-sm md:text-base">
            {course.description}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl mb-8 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900">
            Course Summary
          </h3>
        </div>
        <div className="text-slate-600 text-sm md:text-base leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
          {courseSummary ||
            "This course will enhance your aeronautical engineering knowledge."}
        </div>
      </div>

      <div className="space-y-4 mb-14">
        {course.topics && course.topics.length > 0 ? (
          <>
            {course.topics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => onTopicSelect(topic)}
                className="bg-white p-4 md:p-5 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 group border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] hover:-translate-y-0.5"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3 md:mr-4 group-hover:bg-blue-600 transition-colors duration-300">
                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="font-semibold text-base md:text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    {topic.title}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 ml-13 sm:ml-0">
                  <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                    {topic.lessons?.length || 0} lessons
                  </span>
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-all duration-300">
                    <span className="text-slate-600 group-hover:text-white">→</span>
                  </div>
                </div>
              </div>
            ))}
            <AddTopicButton courseId={course.id} onSuccess={onRefresh} />
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm md:text-base mb-6 text-slate-600">
              No topics available for this course yet.
            </p>
            <AddTopicButton courseId={course.id} onSuccess={onRefresh} />
          </div>
        )}
      </div>
    </div>
  </div>
);

const TopicView = ({
  topic,
  courseName,
  onBack,
  onRefresh,
  onViewFile,
}: {
  topic: Topic;
  courseName: string;
  onBack: () => void;
  onRefresh?: () => void;
  onViewFile: (lesson: Lesson) => void;
}) => (
  <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide bg-slate-50 relative overflow-hidden">
    {/* Grid Pattern Background */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-soft-light"></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    {/* Gradient fade overlay - fades grid on both left and right sides */}
    <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent via-50% to-slate-50"></div>

    <div className="relative z-10 w-full md:w-11/12 pt-24 md:pt-34 px-4 md:px-6">
      <BackButton onClick={onBack}>Back to {courseName}</BackButton>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 capitalize">
            {topic.title}
          </h1>
          <p className="text-slate-600 mt-2 text-sm md:text-base">
            All lessons for this topic.
          </p>
        </div>
        <AddLessonButton topicId={topic.id} onSuccess={onRefresh} />
      </div>

      <div className="space-y-3 mb-14">
        {topic.lessons && topic.lessons.length > 0 ? (
          topic.lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} onView={onViewFile} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm md:text-base mb-6 text-slate-600">
              No lessons available for this topic yet.
            </p>
            <AddLessonButton topicId={topic.id} onSuccess={onRefresh} />
          </div>
        )}
      </div>
    </div>
  </div>
);

const LessonCard = React.memo(({ lesson, onView }: { lesson: Lesson; onView: (lesson: Lesson) => void }) => {
  const getIcon = () => {
    switch (lesson.type) {
      case "pdf":
        return (
          <FileText className="w-4 h-4 md:w-5 md:h-5 mr-3 md:mr-4 text-red-500" />
        );
      case "docx":
        return (
          <FileText className="w-4 h-4 md:w-5 md:h-5 mr-3 md:mr-4 text-blue-600" />
        );
      case "pptx":
        return (
          <Presentation className="w-4 h-4 md:w-5 md:h-5 mr-3 md:mr-4 text-orange-500" />
        );
      default:
        return (
          <FileText className="w-4 h-4 md:w-5 md:h-5 mr-3 md:mr-4 text-slate-500" />
        );
    }
  };

  return (
    <div 
      onClick={() => lesson.fileUrl && onView(lesson)}
      className="bg-white p-4 md:p-5 px-5 md:px-6 cursor-pointer rounded-3xl border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
        <div className="flex items-center">
          {getIcon()}
          <div className="flex flex-col">
            <span className="font-semibold capitalize text-sm md:text-base text-slate-900">
              {lesson.title}
            </span>
            <span className="text-xs text-slate-500 capitalize font-medium">
              {lesson.type} file
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-7 sm:ml-0">
          {lesson.fileUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(lesson);
              }}
              className="flex items-center px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 text-xs md:text-sm font-medium transition-colors rounded-lg"
            >
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              View
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

LessonCard.displayName = "LessonCard";

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

interface ServerCourse {
  id: string;
  title: string;
  description: string;
  gendesc: string;
  imageUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: number;
  topics: unknown[];
}

interface LibraryClientProps {
  initialCourses: ServerCourse[];
  userId: string;
}

export default function LibraryClient({
  initialCourses,
  userId,
}: LibraryClientProps) {
  const {
    view,
    selectedCourse,
    selectedTopic,
    courses,
    loading,
    error,
    courseSummary,
    lastFetchTime,
    setView,
    setSelectedCourse,
    setSelectedTopic,
    setCourses,
    setLoading,
    setError,
    setCourseSummary,
    addCourse,
    removeCourse,
    reset,
  } = useLibraryStore();

  // File viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Track if we've initialized to prevent double updates
  const [initialized, setInitialized] = React.useState(false);

  // Initialize store with server-fetched data (only if fresh or not cached)
  useEffect(() => {
    // Prevent double initialization
    if (initialized) return;

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    const isCacheValid =
      lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION;

    // Only update if cache is invalid or no data exists
    if (!isCacheValid && initialCourses.length > 0) {
      const clientCourses = initialCourses.map((course) => ({
        ...course,
      })) as Course[];
      setCourses(clientCourses);
      setLoading(false);
      setInitialized(true);
    } else if (courses.length > 0) {
      // Data is cached, just mark as not loading
      setLoading(false);
      setInitialized(true);
    } else if (initialCourses.length > 0) {
      // No cached data, use server data
      const clientCourses = initialCourses.map((course) => ({
        ...course,
      })) as Course[];
      setCourses(clientCourses);
      setLoading(false);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCourses = await courseService.getCourses(userId.toString());
      setCourses(userCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setView("course");
    setCourseSummary(
      course.gendesc ||
        "This course will enhance your aeronautical engineering knowledge."
    );
  };

  const handleCourseDelete = async (courseId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this course? This will also delete all associated quizzes and cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await courseService.deleteCourse(courseId, userId.toString());
      removeCourse(courseId);

      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setView("library");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setView("topic");
  };

  const handleCourseCreated = (course: Course) => {
    addCourse(course);
    setView("library");
  };

  const handleRefreshCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      const userCourses = await courseService.getCourses(userId.toString());
      const updatedCourse = userCourses.find((c) => c.id === selectedCourse.id);
      
      if (updatedCourse) {
        setSelectedCourse(updatedCourse);
        setCourses(userCourses);
      }
    } catch (err) {
      console.error("Failed to refresh course:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh course");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTopic = async () => {
    if (!selectedCourse || !selectedTopic) return;
    
    try {
      setLoading(true);
      const userCourses = await courseService.getCourses(userId.toString());
      const updatedCourse = userCourses.find((c) => c.id === selectedCourse.id);
      
      if (updatedCourse) {
        const updatedTopic = updatedCourse.topics?.find((t) => t.id === selectedTopic.id);
        
        if (updatedTopic) {
          setSelectedTopic(updatedTopic);
          setSelectedCourse(updatedCourse);
          setCourses(userCourses);
        }
      }
    } catch (err) {
      console.error("Failed to refresh topic:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh topic");
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedLesson(null);
  };

  const backToLibrary = () => {
    reset();
  };

  const backToCourse = () => {
    setSelectedTopic(null);
    setView("course");
  };

  if (error) {
    return <ErrorMessage error={error} onRetry={loadCourses} />;
  }

  const renderContent = () => {
    switch (view) {
      case "create":
        return (
          <CourseCreator
            userId={userId.toString()}
            onSuccess={handleCourseCreated}
            onCancel={backToLibrary}
          />
        );

      case "course":
        return (
          selectedCourse && (
            <CourseView
              course={selectedCourse}
              courseSummary={courseSummary}
              loading={loading}
              onBack={backToLibrary}
              onDelete={() => handleCourseDelete(selectedCourse.id)}
              onTopicSelect={handleTopicSelect}
              onRefresh={handleRefreshCourse}
            />
          )
        );

      case "topic":
        return (
          selectedTopic &&
          selectedCourse && (
            <TopicView
              topic={selectedTopic}
              courseName={selectedCourse.title}
              onBack={backToCourse}
              onRefresh={handleRefreshTopic}
              onViewFile={handleViewFile}
            />
          )
        );

      case "library":
      default:
        // Use Zustand store courses (already initialized from server data)
        return (
          <LibraryView
            courses={courses}
            loading={loading}
            onCourseSelect={handleCourseSelect}
            onCreateCourse={() => setView("create")}
          />
        );
    }
  };

  return (
    <>
      <div className="space-y-6">{renderContent()}</div>
      
      {/* File Viewer Modal */}
      {selectedLesson && (
        <FileViewerModal
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          fileUrl={selectedLesson.fileUrl || ""}
          fileName={selectedLesson.title}
          fileType={selectedLesson.type}
        />
      )}
    </>
  );
}
