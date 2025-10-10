"use client";

/**
 * Library Client Component
 *
 * This is the client-side interactive part of the library page.
 * It receives initial data from the server component for faster loading.
 */

import React, { useEffect } from "react";
import { useLibraryStore } from "@/stores";
import CourseCreator from "@/components/CourseCreator";
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
  ({ course, onClick }: { course: Course; onClick: () => void }) => (
    <div
      onClick={onClick}
      className="modern-card rounded-2xl md:rounded-4xl overflow-hidden cursor-pointer group transition-all duration-300 animate-slide-in-up hover:scale-105"
    >
      <div className="relative bg-black h-32 md:h-40 flex items-center justify-center p-4">
        <h3 className="text-xl md:text-2xl font-bold text-white text-center capitalize leading-tight">
          {course.title}
        </h3>
      </div>

      <div className="p-4 md:p-6">
        <p className="text-navy text-sm md:text-base capitalize font-medium">
          {course.description}
        </p>
        <div className="w-full h-1 bg-gradient-to-r from-navy to-blue-600 rounded-full mt-3 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      </div>
    </div>
  )
);

CourseCard.displayName = "CourseCard";

const CreateCourseCard = ({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    className="flex gap-2 md:gap-4 text-neutral-600 hover:text-black cursor-pointer items-center pr-2 md:pr-4 transition-colors text-sm md:text-base"
  >
    Add a new course
    <FaPlus className="text-base md:text-xl" />
  </div>
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
    className="flex items-center cursor-pointer font-semibold text-gray-600 hover:text-black mb-4 md:mb-6 transition-colors duration-300 text-sm md:text-base"
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
  <div className="flex flex-col items-center min-h-screen w-full">
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
    <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h1 className="text-left text-xl md:text-2xl font-semibold">
            Library
          </h1>
          <p className="text-gray-600 text-left mt-2 md:mt-4 mb-4 md:mb-6 text-sm md:text-base">
            Explore your courses or create a new one to get started.
          </p>
        </div>
        <CreateCourseCard onClick={onCreateCourse} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-2xl md:rounded-4xl w-full py-6 md:py-8 mb-10 md:mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
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
}: {
  course: Course;
  courseSummary: string;
  loading: boolean;
  onBack: () => void;
  onDelete: () => void;
  onTopicSelect: (topic: Topic) => void;
}) => (
  <div className="flex flex-col items-center min-h-screen w-full">
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
    <div className="relative z-10 w-full md:w-11/12 pt-24 md:pt-34 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <BackButton onClick={onBack}>Back to Library</BackButton>
        <button
          className={`font-semibold transition-colors duration-300 mb-4 md:mb-6 ${
            loading
              ? "text-gray-400 cursor-not-allowed"
              : "text-red-600 hover:text-red-800"
          }`}
          onClick={onDelete}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start mb-8 gap-6">
        <div className="w-full md:w-72 h-48 bg-black rounded-2xl md:rounded-4xl flex items-center justify-center p-4 mx-auto md:mx-0">
          <h3 className="text-lg md:text-xl font-bold text-white text-center capitalize leading-tight">
            {course.title}
          </h3>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-4xl font-bold text-black capitalize text-center md:text-left">
            {course.title}
          </h1>
          <p className="text-neutral-600 mt-2 capitalize text-center md:text-left text-sm md:text-base">
            {course.description}
          </p>
        </div>
      </div>

      <div className="modern-card p-4 md:p-6 rounded-2xl md:rounded-4xl mb-8 animate-fade-in-scale">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-navy to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">📋</span>
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-black">
            Course Summary
          </h3>
        </div>
        <div className="text-navy text-sm md:text-base leading-relaxed font-medium bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border-l-4 border-navy">
          {courseSummary ||
            "This course will enhance your aeronautical engineering knowledge."}
        </div>
      </div>

      <div className="space-y-4 mb-14">
        {course.topics && course.topics.length > 0 ? (
          course.topics.map((topic, index) => (
            <div
              key={topic.id}
              onClick={() => onTopicSelect(topic)}
              className="modern-card p-4 md:p-5 rounded-2xl md:rounded-4xl cursor-pointer transition-all duration-300 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 group animate-slide-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-navy to-blue-600 rounded-full flex items-center justify-center mr-3 md:mr-4">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <span className="font-semibold text-base md:text-lg group-hover:text-navy transition-colors">
                  {topic.title}
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 ml-13 sm:ml-0">
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {topic.lessons?.length || 0} lessons
                </span>
                <div className="w-8 h-8 bg-navy/10 rounded-full flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all duration-300">
                  <span className="text-navy group-hover:text-white">→</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm md:text-base">
              No topics available for this course yet.
            </p>
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
}: {
  topic: Topic;
  courseName: string;
  onBack: () => void;
}) => (
  <div className="flex flex-col items-center min-h-screen w-full">
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
    <div className="relative z-10 w-full md:w-11/12 pt-24 md:pt-34 px-4 md:px-6">
      <BackButton onClick={onBack}>Back to {courseName}</BackButton>

      <h1 className="text-2xl md:text-4xl font-bold mb-4 text-black capitalize">
        {topic.title}
      </h1>
      <p className="text-neutral-600 mb-4 pb-4 text-sm md:text-base">
        All lessons for this topic.
      </p>

      <div className="space-y-3 mb-14">
        {topic.lessons && topic.lessons.length > 0 ? (
          topic.lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm md:text-base">
              No lessons available for this topic yet.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const LessonCard = React.memo(({ lesson }: { lesson: Lesson }) => {
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
          <FileText className="w-4 h-4 md:w-5 md:h-5 mr-3 md:mr-4 text-gray-500" />
        );
    }
  };

  return (
    <div className="bg-white p-3 md:p-4 px-4 md:px-6 cursor-pointer rounded-2xl md:rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0">
        <div className="flex items-center">
          {getIcon()}
          <div className="flex flex-col">
            <span className="font-medium capitalize text-sm md:text-base">
              {lesson.title}
            </span>
            <span className="text-xs text-gray-400 capitalize">
              {lesson.type} file
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-7 sm:ml-0">
          {lesson.fileUrl && (
            <a
              href={lesson.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Open File
            </a>
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

  return <div className="space-y-6">{renderContent()}</div>;
}
