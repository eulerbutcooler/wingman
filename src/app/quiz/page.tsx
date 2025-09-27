"use client";

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Award,
  RefreshCw,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { Quiz, Question, Course } from "@/types";
import * as quizService from "@/services/quiz-service";
import * as courseService from "@/services/course-service";

// ✅ Utility function
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

// ✅ Type definitions (using centralized Course type from @/types)

type ViewType =
  | "courses"
  | "course_quizzes"
  | "quiz_in_progress"
  | "quiz_results"
  | "review_answers";

interface QuizResults {
  score: number;
  answers: Record<string, string>;
  timeSpent: number;
}

// ✅ Helper functions
const getScoreColor = (scorePercentage: number) => {
  if (scorePercentage >= 80) return "text-green-500/90";
  if (scorePercentage >= 60) return "text-yellow-500/90";
  return "text-red-500/90";
};

const capitalizeText = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

// ✅ Loading component
const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center min-h-screen bg-[#f5f5f5] w-full">
    <div className="w-full md:w-11/12 px-4 md:px-6 pt-24 md:pt-34">
      <h1 className="text-xl md:text-2xl font-semibold text-left mb-6 md:mb-8">{message}</h1>
      <div className="flex justify-center text-lg md:text-xl h-[50vh] items-center">
        <div className="loader"></div>
      </div>
    </div>
  </div>
);

// ✅ Error component
const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center min-h-screen bg-[#f5f5f5] w-full">
    <div className="w-full md:w-11/12 px-4 md:px-6 pt-24 md:pt-34 text-center">
      <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-4xl shadow-sm">
        <p className="text-red-600 mb-4 text-sm md:text-base">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-black text-white rounded-2xl md:rounded-4xl hover:bg-gray-800 transition-colors text-sm md:text-base"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// ✅ Quiz Card Component
const QuizCard = ({
  quiz,
  onStart,
  onReset,
  onReview,
  isResetting = false,
}: {
  quiz: Quiz;
  onStart: () => void;
  onReset: () => void;
  onReview: () => void;
  isResetting?: boolean;
}) => {
  const isCompleted =
    quiz.latestResult !== null && quiz.latestResult !== undefined;
  const scorePercentage = isCompleted
    ? (quiz.latestResult!.score / quiz.totalQuestions) * 100
    : 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 transition-all duration-300 rounded-4xl">
      <div className="w-full md:w-1/3 bg-white transition-all duration-300 text-navy hover:shadow-xl p-6 gap-2 rounded-4xl shadow-sm flex flex-col justify-center h-full">
        <h2 className="text-2xl text-black font-semibold">
          {capitalizeText(quiz.difficulty)}
        </h2>
        <p className="text-lg">{quiz.title.split(" - ")[0]}</p>
        <p className="text-sm text-neutral-800 mt-1">
          {quiz.totalQuestions} questions
        </p>
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
            className="bg-black h-4 rounded-full transition-all duration-500"
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onStart}
            className="flex-grow bg-black text-white font-semibold py-2 px-5 rounded-4xl cursor-pointer transition-colors hover:bg-gray-800"
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
                disabled={isResetting}
                className={cn(
                  "p-2 transition-colors",
                  isResetting
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:text-black cursor-pointer"
                )}
                title="Reset Progress"
              >
                <RefreshCw
                  className={cn("w-5 h-5", isResetting && "animate-spin")}
                />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Course List Component
const CourseList = ({
  courses,
  onSelectCourse,
}: {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
}) => (
  <div>
    <h1 className="text-xl md:text-2xl font-semibold text-left mb-6 md:mb-8">
      Select a course for quiz
    </h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
      {courses.map((course) => (
        <div
          key={course.id}
          onClick={() => onSelectCourse(course)}
          className="bg-white p-4 md:p-6 flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl md:rounded-4xl cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-3 md:mb-4">
            <h2 className="text-lg md:text-2xl font-semibold">
              {capitalizeText(course.title)}
            </h2>
          </div>
          <p className="text-navy text-sm md:text-lg mb-3 md:mb-4">
            {capitalizeText(course.description || "")}
          </p>
          <div className="text-sm md:text-base text-neutral-800 font-semibold">
            View Quizzes →
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ✅ Course Quizzes Component
const CourseQuizzes = ({
  course,
  quizzes,
  onStartQuiz,
  onResetQuiz,
  onReviewQuiz,
  onBackToCourses,
  resettingQuizId,
}: {
  course: Course;
  quizzes: Quiz[];
  onStartQuiz: (quiz: Quiz) => void;
  onResetQuiz: (quiz: Quiz) => void;
  onReviewQuiz: (quiz: Quiz) => void;
  onBackToCourses: () => void;
  resettingQuizId?: string | null;
}) => (
  <div>
    <button
      onClick={onBackToCourses}
      className="flex items-center font-semibold text-neutral-600 cursor-pointer hover:text-black mb-6 transition-colors duration-300"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to courses
    </button>

    <h1 className="text-2xl font-semibold text-left mb-4">
      {capitalizeText(course.title)} - Quizzes
    </h1>
    <p className="text-gray-600 mb-8">
      {capitalizeText(course.description || "")}
    </p>

    {quizzes.length === 0 ? (
      <div className="h-[50vh] flex justify-center items-center p-8 text-center">
        <p className="text-gray-600">
          Quizzes are being generated for this course. Please check back in a
          few moments.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-8">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onStart={() => onStartQuiz(quiz)}
            onReset={() => onResetQuiz(quiz)}
            onReview={() => onReviewQuiz(quiz)}
            isResetting={resettingQuizId === quiz.id}
          />
        ))}
      </div>
    )}
  </div>
);

// ✅ Quiz In Progress Component
const QuizInProgress = ({
  quiz,
  onQuizComplete,
}: {
  quiz: Quiz;
  onQuizComplete: (
    score: number,
    answers: Record<string, string>,
    timeSpent: number
  ) => void;
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  const questions = quiz.questions as Question[];
  const question = questions[currentQuestionIndex];
  const progressPercentage =
    ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (!selectedAnswer) return;

    const newAnswers = { ...answers, [question.id]: selectedAnswer };
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      // Calculate score
      const score = Object.keys(newAnswers).reduce((total, questionId) => {
        const q = questions.find((q) => q.id === questionId);
        return q && newAnswers[questionId] === q.correctAnswer
          ? total + 1
          : total;
      }, 0);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      onQuizComplete(score, newAnswers, timeSpent);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold text-left mb-8">
        Quiz in progress...
      </h3>
      <div className="bg-white rounded-4xl shadow-sm mb-14 p-8 mx-auto w-full">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div
              className="bg-black h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-6">{question.question}</h2>
        <div className="space-y-3">
          {question.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(option)}
              className={cn(
                "w-full text-left p-4 rounded-4xl transition-all duration-150 cursor-pointer hover:border-gray-600 border",
                selectedAnswer === option
                  ? "bg-white border-black"
                  : "bg-white border-gray-300"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="w-full mt-8 bg-black text-white font-bold py-3 px-4 rounded-4xl cursor-pointer disabled:bg-gray-400 hover:bg-gray-800 transition-colors"
        >
          {currentQuestionIndex < questions.length - 1
            ? "Next Question"
            : "Finish Quiz"}
        </button>
      </div>
    </div>
  );
};

// ✅ Quiz Results Component
const QuizResults = ({
  quiz,
  score,
  totalQuestions,
  onRestart,
  onReview,
  onBackToQuizzes,
}: {
  quiz: Quiz;
  score: number;
  totalQuestions: number;
  onRestart: () => void;
  onReview: () => void;
  onBackToQuizzes: () => void;
}) => {
  const scorePercentage = (score / totalQuestions) * 100;
  const scoreColor = getScoreColor(scorePercentage);

  return (
    <div className="bg-white rounded-4xl shadow-sm mt-16 mb-14 p-8 text-center mx-auto w-full">
      <Award className={cn("w-12 h-12 mx-auto mb-4", scoreColor)} />
      <h1 className="text-2xl font-bold mb-2">Quiz complete!</h1>
      <p className="text-neutral-600 mb-6">
        You&apos;ve successfully completed the {quiz.difficulty} quiz.
      </p>
      <div className="bg-white rounded-4xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 mb-6">
        <p className="text-xl font-semibold">Your Score</p>
        <p className={cn("text-2xl font-bold my-2", scoreColor)}>
          {score}{" "}
          <span className="text-2xl text-neutral-600">/ {totalQuestions}</span>
        </p>
        <p className={cn("text-2xl pt-2 font-semibold", scoreColor)}>
          {scorePercentage.toFixed(0)}%
        </p>
      </div>
      <div className="space-y-3">
        <button
          onClick={onReview}
          className="w-full text-xl bg-black text-white font-semibold py-3 px-4 cursor-pointer rounded-4xl transition-colors hover:bg-gray-800"
        >
          View answers
        </button>
        <button
          onClick={onRestart}
          className="w-full text-xl bg-white text-black font-semibold py-3 px-4 cursor-pointer rounded-4xl hover:border-gray-600 border-gray-300 border duration-50 transition-all"
        >
          Retake quiz
        </button>
        <button
          onClick={onBackToQuizzes}
          className="w-full text-xl bg-white text-black font-semibold py-3 px-4 cursor-pointer rounded-4xl hover:border-gray-600 border-gray-300 border duration-50 transition-all"
        >
          Back to quizzes
        </button>
      </div>
    </div>
  );
};

// ✅ Answer Option Component
const AnswerOption = ({
  option,
  isUserAnswer,
  isCorrectAnswer,
}: {
  option: string;
  isUserAnswer: boolean;
  isCorrectAnswer: boolean;
}) => (
  <div
    className={cn(
      "p-3 rounded-4xl flex items-center gap-3 transition-all duration-200",
      isCorrectAnswer && "bg-green-100 border border-green-300",
      isUserAnswer && !isCorrectAnswer && "bg-red-100 border border-red-300",
      !isUserAnswer && !isCorrectAnswer && "bg-white border border-gray-300"
    )}
  >
    {isUserAnswer && !isCorrectAnswer && (
      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
    )}
    {isCorrectAnswer && (
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
    )}
    <span
      className={cn(
        isCorrectAnswer && "font-semibold text-green-700",
        isUserAnswer && !isCorrectAnswer && "font-semibold text-red-700"
      )}
    >
      {option}
    </span>
    {isUserAnswer && !isCorrectAnswer && (
      <span className="text-xs text-red-600 ml-auto">Your answer</span>
    )}
    {isCorrectAnswer && (
      <span className="text-xs text-green-600 ml-auto">Correct answer</span>
    )}
  </div>
);

// ✅ Review Answers Component
const ReviewAnswers = ({
  quiz,
  answers,
  onBackToResults,
}: {
  quiz: Quiz;
  answers: Record<string, string>;
  onBackToResults: () => void;
}) => {
  const questions = quiz.questions as Question[];

  return (
    <div>
      <button
        onClick={onBackToResults}
        className="flex items-center font-semibold text-neutral-600 cursor-pointer hover:text-black mb-6 transition-colors duration-300"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to results
      </button>
      <div className="p-8 mb-14 mx-auto w-full">
        <h1 className="text-2xl font-semibold mb-6">Review Answers</h1>
        <div className="space-y-8">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="shadow-sm bg-white rounded-4xl hover:shadow-xl transition-all duration-300 p-4"
            >
              <h2 className="font-bold text-lg p-2 mb-3">
                {index + 1}. {question.question}
              </h2>
              <div className="space-y-4 px-2 pb-2">
                {question.options?.map((option) => (
                  <AnswerOption
                    key={option}
                    option={option}
                    isUserAnswer={answers[question.id] === option}
                    isCorrectAnswer={question.correctAnswer === option}
                  />
                ))}
              </div>
              {question.explanation && (
                <div className="mt-4 p-3 px-4 bg-blue-50 rounded-4xl">
                  <p className="text-sm text-blue-800">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ✅ Main Quiz Content Component
function QuizContent({ userId }: { userId: string }) {
  const [view, setView] = useState<ViewType>("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resettingQuizId, setResettingQuizId] = useState<string | null>(null);

  // ✅ Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, [userId]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCourses = await courseService.getCourses(userId);
      setCourses(userCourses);
    } catch (error) {
      console.error("Error loading courses:", error);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course: Course) => {
    try {
      setLoading(true);
      setSelectedCourse(course);
      const quizzes = await quizService.getQuizzesForCourse(course.id, userId);
      setCourseQuizzes(quizzes);
      setView("course_quizzes");
    } catch (error) {
      console.error("Error loading quizzes:", error);
      setError("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setView("quiz_in_progress");
  };

  const handleQuizComplete = async (
    score: number,
    answers: Record<string, string>,
    timeSpent: number
  ) => {
    if (!activeQuiz) return;

    try {
      await quizService.submitQuizResult(
        activeQuiz.id,
        userId,
        answers,
        score,
        activeQuiz.totalQuestions,
        timeSpent
      );

      setQuizResults({ score, answers, timeSpent });
      setView("quiz_results");

      // Refresh quizzes to update the latest result
      if (selectedCourse) {
        const updatedQuizzes = await quizService.getQuizzesForCourse(
          selectedCourse.id,
          userId
        );
        setCourseQuizzes(updatedQuizzes);
      }
    } catch (error) {
      console.error("Error submitting quiz result:", error);
      setError("Failed to submit quiz result");
    }
  };

  const handleResetQuiz = async (quiz: Quiz) => {
    if (!selectedCourse) return;

    try {
      setResettingQuizId(quiz.id);
      const newQuiz = await quizService.resetQuiz(
        selectedCourse.id,
        userId,
        quiz.difficulty
      );

      setCourseQuizzes((prevQuizzes) =>
        prevQuizzes.map((q) =>
          q.difficulty === quiz.difficulty && q.courseId === quiz.courseId
            ? ({ ...newQuiz, latestResult: undefined } as Quiz)
            : q
        )
      );
    } catch (error) {
      console.error("Error resetting quiz:", error);
      setError("Failed to reset quiz");
    } finally {
      setResettingQuizId(null);
    }
  };

  const handleReviewQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    if (quiz.latestResult) {
      const resultAnswers = quiz.latestResult.answers as Record<string, string>;
      setQuizResults({
        score: quiz.latestResult.score,
        answers: resultAnswers,
        timeSpent: quiz.latestResult.timeSpent || 0,
      });
    }
    setView("review_answers");
  };

  // ✅ Loading state
  if (loading) {
    return <LoadingSpinner message="Select a course for quiz" />;
  }

  // ✅ Error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={loadCourses} />;
  }

  // ✅ Render content based on view
  const renderContent = () => {
    switch (view) {
      case "courses":
        return (
          <CourseList courses={courses} onSelectCourse={handleSelectCourse} />
        );

      case "course_quizzes":
        return selectedCourse ? (
          <CourseQuizzes
            course={selectedCourse}
            quizzes={courseQuizzes}
            onStartQuiz={handleStartQuiz}
            onResetQuiz={handleResetQuiz}
            onReviewQuiz={handleReviewQuiz}
            onBackToCourses={() => setView("courses")}
            resettingQuizId={resettingQuizId}
          />
        ) : null;

      case "quiz_in_progress":
        return activeQuiz ? (
          <QuizInProgress
            quiz={activeQuiz}
            onQuizComplete={handleQuizComplete}
          />
        ) : null;

      case "quiz_results":
        return activeQuiz && quizResults ? (
          <QuizResults
            quiz={activeQuiz}
            score={quizResults.score}
            totalQuestions={activeQuiz.totalQuestions}
            onRestart={() => handleStartQuiz(activeQuiz)}
            onReview={() => setView("review_answers")}
            onBackToQuizzes={() => setView("course_quizzes")}
          />
        ) : null;

      case "review_answers":
        return activeQuiz && quizResults ? (
          <ReviewAnswers
            quiz={activeQuiz}
            answers={quizResults.answers}
            onBackToResults={() => setView("quiz_results")}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#f5f5f5] w-full">
      <div className="w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">{renderContent()}</div>
    </div>
  );
}

// ✅ Main Quiz Page Component with Authentication
export default function QuizPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();

  // Loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Show loading while checking authentication
  if (status === "loading") {
    return <LoadingSpinner message="Loading..." />;
  }

  // ✅ Ensure we have a valid user ID
  if (!user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Unable to access user information.
          </p>
          <button
            onClick={() => router.push("/signin")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return <QuizContent userId={user.id} />;
}
