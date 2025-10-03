"use client";

import React, { useState, useEffect } from "react";
import { Quiz } from "@/types";
import * as quizService from "@/services/quiz-service";
import * as courseService from "@/services/course-service";
import { Course } from "@/types";

interface CourseQuizzesProps {
  courseId: string;
  userId: string;
  onBackToList: () => void;
}

interface QuizCardProps {
  quiz: Quiz;
  onStart: () => void;
  onReset: () => void;
  onReview: () => void;
}

const RefreshCw: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const Eye: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const ArrowLeft: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onStart,
  onReset,
  onReview,
}) => {
  const isCompleted =
    quiz.latestResult !== null && quiz.latestResult !== undefined;
  const scorePercentage = isCompleted
    ? (quiz.latestResult!.score / quiz.totalQuestions) * 100
    : 0;

  const getDifficultyBg = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-4 shadow-sm hover:shadow-xl transition-all duration-300 rounded-4xl">
      <div
        className={`w-full md:w-1/3 text-navy p-6 rounded-4xl flex flex-col justify-center text-center h-full }`}
      >
        <h2 className="text-xl font-bold">
          {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
        </h2>
        <p className="text-sm text-white/80">{quiz.totalQuestions} questions</p>
        <p className="text-xs text-white/60 mt-1">Auto-generated</p>
      </div>

      <div className="w-full md:w-2/3 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Progress</p>
          {isCompleted && (
            <p className="font-bold text-lg">
              {quiz.latestResult!.score}/{quiz.totalQuestions}
            </p>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getDifficultyBg(
              quiz.difficulty
            )}`}
            style={{ width: `${scorePercentage}%` }}
          ></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onStart}
            className={`flex-grow text-white font-semibold py-2 px-5 rounded-4xl cursor-pointer transition-colors ${getDifficultyBg(
              quiz.difficulty
            )}`}
          >
            {isCompleted ? "Retake Quiz" : "Start Quiz"}
          </button>
          {isCompleted && (
            <>
              <button
                onClick={onReview}
                className="flex-grow bg-white font-semibold py-2 px-5 rounded-4xl hover:border-gray-600 transition-colors flex border-gray-300 cursor-pointer border items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> View Answers
              </button>
              <button
                onClick={onReset}
                className="p-2 text-gray-500 hover:text-black transition-colors"
                title="Reset Progress"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseQuizzes: React.FC<CourseQuizzesProps> = ({
  courseId,
  userId,
  onBackToList,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [_currentView, setCurrentView] = useState<
    "list" | "quiz" | "results" | "review"
  >("list");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, userId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch course details and quizzes in parallel
      const [courseData, quizzesData] = await Promise.all([
        courseService
          .getCourses(userId)
          .then((courses) => courses.find((c) => c.id.toString() === courseId)),
        quizService.getQuizzesForCourse(courseId, userId),
      ]);

      setCourse(courseData || null);
      setQuizzes(quizzesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentView("quiz");
  };

  const handleResetQuiz = async (quiz: Quiz) => {
    try {
      await quizService.resetQuiz(courseId, userId, quiz.difficulty);
      // Reload quizzes to get the new version
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset quiz");
    }
  };

  const handleReviewQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentView("review");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBackToList}
        className="flex items-center font-semibold text-neutral-600 cursor-pointer hover:text-black mb-6 transition-colors duration-300"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to courses
      </button>

      <h1 className="text-2xl font-semibold text-left mb-2">
        {course?.title
          ? course.title.charAt(0).toUpperCase() + course.title.slice(1)
          : "Course"}{" "}
        Quizzes
      </h1>
      <p className="text-gray-600 mb-8">
        {course?.description
          ? course.description.charAt(0).toUpperCase() +
            course.description.slice(1)
          : "Complete these AI-generated quizzes to test your knowledge"}
      </p>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-4xl shadow-sm">
          <p className="text-gray-600 mb-4">No quizzes available yet.</p>
          <p className="text-sm text-gray-500">
            Quizzes are being generated for this course.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onStart={() => handleStartQuiz(quiz)}
              onReset={() => handleResetQuiz(quiz)}
              onReview={() => handleReviewQuiz(quiz)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseQuizzes;
