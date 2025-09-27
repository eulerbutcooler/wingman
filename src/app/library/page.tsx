"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import CourseCreator from "@/components/CourseCreator";
import { FaPlus, FaArrowLeft } from "react-icons/fa6";
import { BookOpen, FileText, Presentation, ExternalLink } from "lucide-react";
import * as courseService from "@/services/course-service";
import type { Course, Topic, Lesson, ViewType } from "@/types/library";

const LoadingSpinner = () => (
  <div className="flex justify-center text-xl h-[50vh] items-center">
    <div className="loader"></div>
  </div>
);

// ✅ Error component
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

// ✅ Course card component
const CourseCard = ({
  course,
  onClick,
}: {
  course: Course;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-white rounded-4xl shadow-sm overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl"
  >
    <img
      src={course.image || course.imageUrl}
      alt={course.title}
      className="w-full h-32 object-cover"
    />
    <div className="p-6">
      <h3 className="text-xl font-semibold text-black mb-2 capitalize">
        {course.title}
      </h3>
      <p className="text-navy text-base capitalize">{course.description}</p>
    </div>
  </div>
);

// ✅ Create course card component
const CreateCourseCard = ({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    className="flex gap-4 text-neutral-600 hover:text-black cursor-pointer items-center pr-4 transition-colors"
  >
    Add a new course
    <FaPlus className="text-xl" />
  </div>
);

// ✅ Navigation button component
const BackButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="flex items-center cursor-pointer font-semibold text-gray-600 hover:text-black mb-6 transition-colors duration-300"
  >
    <FaArrowLeft className="w-4 h-4 mr-2" />
    {children}
  </button>
);

export default function LibraryPage() {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user?.id) {
    return null; // Will redirect via useEffect
  }

  return <LibraryContent userId={user.id} />;
}

// ✅ Main content component with userId prop
function LibraryContent({ userId }: { userId: string }) {
  const [view, setView] = useState<ViewType>("library");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseSummary, setCourseSummary] = useState<string>("");

  // ✅ Load courses on mount
  useEffect(() => {
    loadCourses();
  }, [userId]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCourses = await courseService.getCourses(userId);
      setCourses(userCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
      console.error("Failed to load courses:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Course summary is now loaded from stored gendesc
  // No need to generate summary since it's pre-generated and stored in database

  // ✅ Event handlers
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setView("course");
    // Use stored AI-generated description instead of generating new one
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
      await courseService.deleteCourse(courseId, userId);
      setCourses((prev) =>
        prev.filter((course) => course.id.toString() !== courseId)
      );

      if (selectedCourse?.id.toString() === courseId) {
        setSelectedCourse(null);
        setView("library");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
      console.error("Failed to delete course:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setView("topic");
  };

  const handleCourseCreated = (course: Course) => {
    setCourses((prev) => [course, ...prev]);
    setView("library");
  };

  // ✅ Navigation helpers
  const backToLibrary = () => {
    setSelectedCourse(null);
    setSelectedTopic(null);
    setView("library");
  };

  const backToCourse = () => {
    setSelectedTopic(null);
    setView("course");
  };

  // ✅ Error state
  if (error) {
    return <ErrorMessage error={error} onRetry={loadCourses} />;
  }

  // ✅ Main render logic
  const renderContent = () => {
    switch (view) {
      case "create":
        return (
          <CourseCreator
            userId={userId}
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
              onDelete={() => handleCourseDelete(selectedCourse.id.toString())}
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

// ✅ Separate view components for better organization
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
  <div className="flex flex-col items-center bg-[#f5f5f5] min-h-screen w-[100vw]">
    <div className="w-11/12 px-6 pt-34">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-left text-2xl font-semibold">Library</h1>
          <p className="text-gray-600 text-left mt-4 mb-6">
            Explore your courses or create a new one to get started.
          </p>
        </div>
        <CreateCourseCard onClick={onCreateCourse} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-4xl w-full py-8 mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8">
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
  <div className="flex flex-col items-center bg-[#f5f5f5] min-h-screen w-[100vw]">
    <div className="w-11/12 pt-34 px-6">
      <div className="flex justify-between">
        <BackButton onClick={onBack}>Back to Library</BackButton>
        <button
          className={`font-semibold transition-colors duration-300 mb-6 ${
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

      <div className="flex items-start mb-8">
        <img
          src={course.imageUrl}
          alt={course.title}
          className="w-40 h-auto object-cover rounded-4xl mr-6"
        />
        <div>
          <h1 className="text-4xl font-bold text-black capitalize">
            {course.title}
          </h1>
          <p className="text-neutral-600 mt-2 capitalize">
            {course.description}
          </p>
          <div className="text-navy mt-3 font-medium italic">
            {courseSummary ||
              "This course will enhance your aeronautical engineering knowledge."}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-black mb-4 pb-2">Topics</h2>
      <div className="space-y-4 mb-14">
        {course.topics && course.topics.length > 0 ? (
          course.topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onTopicSelect(topic)}
              className="bg-white p-5 rounded-4xl cursor-pointer hover:shadow-xl shadow-sm transition-all duration-300 flex justify-between items-center"
            >
              <div className="flex items-center">
                <BookOpen className="w-6 h-6 mr-4 text-gray-600" />
                <span className="font-semibold text-lg">{topic.title}</span>
              </div>
              <span className="text-sm text-gray-600">
                {topic.lessons?.length || 0} lessons
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No topics available for this course yet.</p>
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
  <div className="flex flex-col items-center bg-[#f5f5f5] min-h-screen w-[100vw]">
    <div className="w-11/12 pt-34 px-6">
      <BackButton onClick={onBack}>Back to {courseName}</BackButton>

      <h1 className="text-4xl font-bold mb-4 text-black capitalize">
        {topic.title}
      </h1>
      <p className="text-neutral-600 mb-4 pb-4">All lessons for this topic.</p>

      <div className="space-y-3 mb-14">
        {topic.lessons && topic.lessons.length > 0 ? (
          topic.lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No lessons available for this topic yet.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ✅ Lesson card component
const LessonCard = ({ lesson }: { lesson: Lesson }) => {
  const getIcon = () => {
    switch (lesson.type) {
      case "pdf":
        return <FileText className="w-5 h-5 mr-4 text-red-500" />;
      case "docx":
        return <FileText className="w-5 h-5 mr-4 text-blue-600" />;
      case "pptx":
        return <Presentation className="w-5 h-5 mr-4 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 mr-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white p-4 px-6 cursor-pointer rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {getIcon()}
          <div className="flex flex-col">
            <span className="font-medium capitalize">{lesson.title}</span>
            <span className="text-xs text-gray-400 capitalize">
              {lesson.type} file
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lesson.fileUrl && (
            <a
              href={lesson.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open File
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
