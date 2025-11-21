"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import { useQuizStore } from "@/stores/quiz-store";

// ✅ Utility function
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

// ✅ Type definitions
type ViewType =
  | "courses"
  | "course_quizzes"
  | "quiz_in_progress"
  | "quiz_results"
  | "review_answers";

type QuizResults = {
  score: number;
  answers: Record<string, string>;
  timeSpent: number;
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
    <div className="relative z-10 text-center">
      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
    <div className="relative z-10 text-center">
      <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <p className="text-gray-800 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

// ✅ Course List Component
const CourseList = ({
  courses,
  onSelectCourse,
  loadingCourseId,
}: {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  loadingCourseId: string | null;
}) => {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide">
        <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
        <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
          <div className="text-center py-12">
            <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Courses Yet
            </h3>
            <p className="text-gray-500">
              Create a course first to start taking quizzes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide">
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
        <div>
          <h1 className="text-left text-xl md:text-2xl font-semibold">Quiz</h1>
          <p className="text-gray-600 text-left mt-2 md:mt-4 mb-4 md:mb-6 text-sm md:text-base">
            Select a course to view and take quizzes.
          </p>
        </div>

        <div className="rounded-2xl md:rounded-4xl w-full py-6 md:py-8 mb-10 md:mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {courses.map((course, index) => {
              const isLoading = loadingCourseId === course.id;
              return (
                <div
                  key={course.id}
                  onClick={() => !isLoading && onSelectCourse(course)}
                  className={cn(
                    "modern-card rounded-2xl md:rounded-4xl overflow-hidden transition-all duration-300 animate-slide-in-up hover:scale-105 relative",
                    isLoading ? "cursor-wait" : "cursor-pointer group"
                  )}
                >
                  <div className="relative h-32 md:h-40 flex items-center justify-center p-4">
                    <Image
                      src={`/image${index + 1}.jpg`}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
                    <h3 className="relative z-10 text-xl md:text-2xl font-bold text-white text-center capitalize leading-tight">
                      {course.title}
                    </h3>
                  </div>

                  <div className="p-4 md:p-6">
                    <p className="text-neutral-600 text-sm md:text-base capitalize font-medium">
                      {course.description}
                    </p>
                    <div className="w-full h-1 bg-gradient-to-r from-black to-gray-600 rounded-full mt-3 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </div>

                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl md:rounded-4xl z-20">
                      <RefreshCw className="h-8 w-8 animate-spin text-black" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Components from CourseQuizzes
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
  resettingQuizId: string | null;
}) => {
  return (
    <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide">
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
        <button
          onClick={onBackToCourses}
          className="flex items-center cursor-pointer font-semibold text-gray-600 hover:text-black mb-4 md:mb-6 transition-colors duration-300 text-sm md:text-base"
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
          Back to Courses
        </button>

        <div>
          <h1 className="text-left text-2xl md:text-4xl font-bold text-black capitalize">
            {course.title}
          </h1>
          <p className="text-gray-600 text-left mt-2 md:mt-4 mb-4 md:mb-6 text-sm md:text-base">
            Test your knowledge on this course
          </p>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Quizzes Available
            </h3>
            <p className="text-gray-500">
              Quizzes will be generated for this course.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl md:rounded-4xl w-full py-6 md:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
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
          </div>
        )}
      </div>
    </div>
  );
};

const QuizCard = ({
  quiz,
  onStart,
  onReset,
  onReview,
  isResetting,
}: {
  quiz: Quiz;
  onStart: () => void;
  onReset: () => void;
  onReview: () => void;
  isResetting: boolean;
}) => {
  const difficultyColors = {
    easy: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    hard: "bg-red-50 text-red-700 border-red-200",
  };

  const hasResult = quiz.latestResult;

  return (
    <div className="modern-card rounded-2xl md:rounded-4xl overflow-hidden transition-all duration-300 hover:scale-105">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium capitalize border",
              difficultyColors[quiz.difficulty]
            )}
          >
            {quiz.difficulty}
          </span>
          <span className="text-gray-500 text-sm">
            {quiz.totalQuestions} questions
          </span>
        </div>

        {hasResult && quiz.latestResult && (
          <div className="mb-4 p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Best Score:</span>
              <span className="font-bold text-black">
                {quiz.latestResult.score}/{quiz.totalQuestions}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={onStart}
            className="w-full px-4 py-2 bg-black text-white rounded-2xl md:rounded-4xl hover:bg-gray-800 transition-colors font-medium text-sm md:text-base"
          >
            {hasResult ? "Retake Quiz" : "Start Quiz"}
          </button>

          {hasResult && (
            <>
              <button
                onClick={onReview}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-black rounded-2xl md:rounded-4xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Eye className="w-4 h-4" /> View Answers
              </button>
              <button
                onClick={onReset}
                disabled={isResetting}
                className={cn(
                  "w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-2xl md:rounded-4xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm md:text-base",
                  isResetting && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw
                  className={cn("w-4 h-4", isResetting && "animate-spin")}
                />
                {isResetting ? "Resetting..." : "Reset Quiz"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Quiz In Progress Component
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
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
      setSelectedAnswer(null);

      if (isLastQuestion) {
        handleSubmit();
      } else {
        setCurrentQuestionIndex((i: number) => i + 1);
      }
    }
  };

  const handleSubmit = () => {
    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: selectedAnswer || "",
    };
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    let score = 0;
    questions.forEach((q) => {
      if (finalAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    onQuizComplete(score, finalAnswers, timeSpent);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide">
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
        <div className="max-w-3xl mx-auto">
          <div className="modern-card rounded-2xl md:rounded-4xl p-6 md:p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 ml-4">
                  <div
                    className="bg-black h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentQuestionIndex + 1) / questions.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-black">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3 mb-6">
              {currentQuestion.options?.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={cn(
                    "w-full p-4 text-left rounded-2xl md:rounded-4xl border-2 transition-all text-sm md:text-base",
                    selectedAnswer === option
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  )}
                >
                  <span className="font-medium">{option}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className={cn(
                "w-full py-3 rounded-2xl md:rounded-4xl font-medium transition-colors text-sm md:text-base",
                selectedAnswer
                  ? "bg-black text-white hover:bg-gray-800"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {isLastQuestion ? "Submit Quiz" : "Next Question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quiz Results Component
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
  const percentage = (score / totalQuestions) * 100;

  return (
    <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide">
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
        <div className="max-w-2xl mx-auto">
          <div className="modern-card rounded-2xl md:rounded-4xl p-6 md:p-8 text-center">
            <div className="mb-6">
              {percentage >= 70 ? (
                <CheckCircle className="h-16 w-16 md:h-20 md:w-20 mx-auto text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 md:h-20 md:w-20 mx-auto text-red-500" />
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
              Quiz Complete!
            </h2>
            <p className="text-gray-600 mb-8 text-sm md:text-base">
              {percentage >= 70 ? "Great job!" : "Keep practicing!"}
            </p>

            <div className="bg-gray-50 rounded-2xl md:rounded-4xl p-6 mb-8 border border-gray-200">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">
                {score}/{totalQuestions}
              </div>
              <div className="text-gray-600 text-sm md:text-base">
                {percentage.toFixed(0)}% Correct
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onReview}
                className="w-full px-6 py-3 bg-black text-white rounded-2xl md:rounded-4xl hover:bg-gray-800 transition-colors font-medium text-sm md:text-base"
              >
                Review Answers
              </button>
              <button
                onClick={onRestart}
                className="w-full px-6 py-3 bg-white border border-gray-300 text-black rounded-2xl md:rounded-4xl hover:bg-gray-50 transition-colors font-medium text-sm md:text-base"
              >
                Retake Quiz
              </button>
              <button
                onClick={onBackToQuizzes}
                className="w-full px-6 py-3 text-gray-600 hover:text-black transition-colors text-sm md:text-base"
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Review Answers Component
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
    <div className="flex flex-col items-center min-h-screen w-full scrollbar-hide">
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={onBackToResults}
              className="flex items-center cursor-pointer font-semibold text-gray-600 hover:text-black mb-4 md:mb-6 transition-colors duration-300 text-sm md:text-base"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Back to Results
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              Review Answers
            </h1>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className={cn(
                    "modern-card rounded-2xl md:rounded-4xl border-2 p-4 md:p-6",
                    isCorrect ? "border-green-200" : "border-red-200"
                  )}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-2">
                        Question {index + 1}
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-black mb-4">
                        {question.question}
                      </h3>

                      <div className="space-y-2">
                        {question.options?.map(
                          (option: string, optIndex: number) => (
                            <div
                              key={optIndex}
                              className={cn(
                                "p-3 rounded-2xl md:rounded-4xl border text-sm md:text-base",
                                option === question.correctAnswer
                                  ? "bg-green-50 border-green-300"
                                  : option === userAnswer && !isCorrect
                                  ? "bg-red-50 border-red-300"
                                  : "bg-gray-50 border-gray-200"
                              )}
                            >
                              <span>{option}</span>
                              {option === question.correctAnswer && (
                                <span className="ml-2 text-green-600 font-medium">
                                  ✓ Correct
                                </span>
                              )}
                              {option === userAnswer && !isCorrect && (
                                <span className="ml-2 text-red-600 font-medium">
                                  ✗ Your Answer
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN CLIENT COMPONENT
// ============================================================================

export default function QuizClient({
  userId,
  initialCourses,
}: {
  userId: string;
  initialCourses: Course[];
}) {
  // Use Zustand store
  const {
    view,
    courses,
    selectedCourse,
    courseQuizzes,
    activeQuiz,
    quizResults,
    loading,
    error,
    resettingQuizId,
    setView,
    setCourses,
    setSelectedCourse,
    setCourseQuizzes,
    setActiveQuiz,
    setQuizResults,
    setLoading,
    setError,
    setResettingQuizId,
    reset,
  } = useQuizStore();

  const [initialized, setInitialized] = useState(false);
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);

  // ✅ Initialize with server data
  useEffect(() => {
    if (initialized) return;

    setCourses(initialCourses);
    setLoading(false);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Reset quiz state when user navigates away from the quiz page
  useEffect(() => {
    return () => {
      // This cleanup function runs when component unmounts (user navigates away)
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectCourse = async (course: Course) => {
    try {
      setLoadingCourseId(course.id);
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
      setLoadingCourseId(null);
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

      setCourseQuizzes(
        courseQuizzes.map((q: Quiz) =>
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

  // ✅ Loading state (for subsequent operations)
  if (loading && !initialized) {
    return <LoadingSpinner message="Loading quizzes..." />;
  }

  // ✅ Error state
  if (error) {
    return (
      <ErrorDisplay error={error} onRetry={() => setCourses(initialCourses)} />
    );
  }

  // ✅ Render content based on view
  const renderContent = () => {
    switch (view) {
      case "courses":
        return (
          <CourseList 
            courses={courses} 
            onSelectCourse={handleSelectCourse}
            loadingCourseId={loadingCourseId}
          />
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

  return <>{renderContent()}</>;
}
