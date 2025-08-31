'use client';

import React, { useState, useEffect } from 'react';
import { Quiz, Question } from '@/types';
import { quizService } from '@/lib/services/quiz-service';
import { courseService } from '@/lib/services/course-service';

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Icon components
const CheckCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const XCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const Award = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="7"></circle>
    <polyline points="8.21 13.89 7 23 12 17 17 23 15.79 13.88"></polyline>
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const Eye = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const BookOpen = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

// Mock user ID - replace with actual authentication
const MOCK_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

const QuizCard = ({ quiz, onStart, onReset, onReview }: {
  quiz: Quiz;
  onStart: () => void;
  onReset: () => void;
  onReview: () => void;
}) => {
  const isCompleted = quiz.latestResult !== null && quiz.latestResult !== undefined;
  const scorePercentage = isCompleted ? (quiz.latestResult!.score / quiz.totalQuestions) * 100 : 0;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-4 shadow-sm hover:shadow-xl transition-all duration-300 rounded-4xl">
      <div className="w-full md:w-1/3 bg-black text-white p-6 rounded-4xl flex flex-col justify-center text-center h-full">
        <h2 className="text-2xl font-bold">{quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}</h2>
        <p className="text-lg text-neutral-300">{quiz.title.split(' - ')[0]}</p>
        <p className="text-sm text-neutral-300 mt-1">{quiz.totalQuestions} questions</p>
      </div>

      <div className="w-full md:w-2/3 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">Progress</p>
          {isCompleted && <p className="font-bold text-lg">{quiz.latestResult!.score}/{quiz.totalQuestions}</p>}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div className="bg-black h-4 rounded-full transition-all duration-500" style={{ width: `${scorePercentage}%` }}></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onStart} className="flex-grow bg-black text-white font-semibold py-2 px-5 rounded-4xl cursor-pointer transition-colors">
            {isCompleted ? 'Retake Quiz' : 'Start Quiz'}
          </button>
          {isCompleted && (
            <>
              <button onClick={onReview} className="flex-grow bg-white font-semibold py-2 px-5 rounded-4xl hover:border-gray-600 transition-colors flex border-gray-300 cursor-pointer border items-center justify-center gap-2">
                <Eye className="w-4 h-4" /> View Answers
              </button>
              <button onClick={onReset} className="p-2 text-gray-500 hover:text-black transition-colors" title="Reset Progress">
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseList = ({ courses, onSelectCourse }: { courses: Course[], onSelectCourse: (course: Course) => void }) => (
  <div>
    <h1 className="text-2xl font-semibold text-left mb-8">Select a Course</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {courses.map(course => (
        <div
          key={course.id}
          onClick={() => onSelectCourse(course)}
          className="bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 rounded-4xl cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h2 className="text-xl font-bold">{course.title}</h2>
          </div>
          <p className="text-gray-600 mb-4">{course.description}</p>
          <div className="text-sm text-blue-600 font-semibold">View Quizzes →</div>
        </div>
      ))}
    </div>
  </div>
);

const CourseQuizzes = ({ course, quizzes, onStartQuiz, onResetQuiz, onReviewQuiz, onBackToCourses }: {
  course: Course;
  quizzes: Quiz[];
  onStartQuiz: (quiz: Quiz) => void;
  onResetQuiz: (quiz: Quiz) => void;
  onReviewQuiz: (quiz: Quiz) => void;
  onBackToCourses: () => void;
}) => (
  <div>
    <button onClick={onBackToCourses} className="flex items-center font-semibold text-neutral-600 cursor-pointer hover:text-black mb-6 transition-colors duration-300">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to courses
    </button>
    
    <h1 className="text-2xl font-semibold text-left mb-4">{course.title} - Quizzes</h1>
    <p className="text-gray-600 mb-8">{course.description}</p>
    
    {quizzes.length === 0 ? (
      <div className="bg-white p-8 rounded-4xl shadow-sm text-center">
        <p className="text-gray-600">Quizzes are being generated for this course. Please check back in a few moments.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-6">
        {quizzes.map(quiz => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onStart={() => onStartQuiz(quiz)}
            onReset={() => onResetQuiz(quiz)}
            onReview={() => onReviewQuiz(quiz)}
          />
        ))}
      </div>
    )}
  </div>
);

const QuizInProgress = ({ quiz, onQuizComplete }: {
  quiz: Quiz;
  onQuizComplete: (score: number, answers: Record<string, string>, timeSpent: number) => void;
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  const questions = quiz.questions as Question[];
  const question = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [question.id]: selectedAnswer };
      setAnswers(newAnswers);
      setSelectedAnswer(null);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
      } else {
        // Quiz completed
        const score = Object.keys(newAnswers).reduce((total, questionId) => {
          const q = questions.find(q => q.id === questionId);
          if (q && newAnswers[questionId] === q.correctAnswer) {
            return total + 1;
          }
          return total;
        }, 0);

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        onQuizComplete(score, newAnswers, timeSpent);
      }
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-semibold text-left mb-8">Quiz in progress...</h3>
      <div className="bg-white rounded-4xl shadow-sm mb-14 p-8 mx-auto w-full">
        <div className="mb-4">
          <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div className="bg-black h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
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
                  ? 'bg-white border-black' 
                  : 'bg-white border-gray-300'
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <button 
          onClick={handleNext} 
          disabled={selectedAnswer === null} 
          className="w-full mt-8 bg-black text-white font-bold py-3 px-4 rounded-4xl cursor-pointer disabled:bg-gray-400"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
        </button>
      </div>
    </div>
  );
};

const QuizResults = ({ quiz, score, totalQuestions, answers, onRestart, onReview, onBackToQuizzes }: {
  quiz: Quiz;
  score: number;
  totalQuestions: number;
  answers: Record<string, string>;
  onRestart: () => void;
  onReview: () => void;
  onBackToQuizzes: () => void;
}) => {
  const scorePercentage = (score / totalQuestions) * 100;
  
  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-green-500/90';
    if (scorePercentage >= 60) return 'text-yellow-500/90';
    return 'text-red-500/90';
  };

  return (
    <div className="bg-white rounded-4xl shadow-sm mt-16 mb-14 p-8 text-center mx-auto w-full">
      <Award className={cn("w-12 h-12 mx-auto mb-4", getScoreColor())} />
      <h1 className="text-2xl font-bold mb-2">Quiz complete!</h1>
      <p className="text-neutral-600 mb-6">You've successfully completed the {quiz.difficulty} quiz.</p>
      <div className="bg-white rounded-4xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 mb-6">
        <p className="text-xl font-semibold">Your Score</p>
        <p className={cn("text-2xl font-bold my-2", getScoreColor())}>
          {score} <span className="text-2xl text-neutral-600">/ {totalQuestions}</span>
        </p>
        <p className={cn("text-2xl pt-2 font-semibold", getScoreColor())}>{scorePercentage.toFixed(0)}%</p>
      </div>
      <div className="space-y-3">
        <button onClick={onReview} className="w-full text-xl bg-black text-white font-semibold py-3 px-4 cursor-pointer rounded-4xl transition-colors">
          View answers
        </button>
        <button onClick={onRestart} className="w-full text-xl bg-white text-black font-semibold py-3 px-4 cursor-pointer rounded-4xl hover:border-gray-600 border-gray-300 border duration-50 transition-all">
          Retake quiz
        </button>
        <button onClick={onBackToQuizzes} className="w-full text-xl bg-white text-black font-semibold py-3 px-4 cursor-pointer rounded-4xl hover:border-gray-600 border-gray-300 border duration-50 transition-all">
          Back to quizzes
        </button>
      </div>
    </div>
  );
};

const AnswerOption = ({ option, isUserAnswer, isCorrectAnswer }: {
  option: string;
  isUserAnswer: boolean;
  isCorrectAnswer: boolean;
}) => {
  return (
    <div className={cn(
      "p-3 rounded-4xl flex items-center gap-3 transition-all duration-200",
      isCorrectAnswer && "bg-green-100 border border-green-300",
      isUserAnswer && !isCorrectAnswer && "bg-red-100 border border-red-300",
      !isUserAnswer && !isCorrectAnswer && "bg-white border border-gray-300"
    )}>
      {isUserAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
      {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
      <span className={cn(
        isCorrectAnswer && "font-semibold text-green-700",
        isUserAnswer && !isCorrectAnswer && "font-semibold text-red-700"
      )}>
        {option}
      </span>
      {isUserAnswer && !isCorrectAnswer && <span className="text-xs text-red-600 ml-auto">Your answer</span>}
      {isCorrectAnswer && <span className="text-xs text-green-600 ml-auto">Correct answer</span>}
    </div>
  );
};

const ReviewAnswers = ({ quiz, answers, onBackToResults }: {
  quiz: Quiz;
  answers: Record<string, string>;
  onBackToResults: () => void;
}) => {
  const questions = quiz.questions as Question[];

  return (
    <div>
      <button onClick={onBackToResults} className="flex items-center font-semibold text-neutral-600 cursor-pointer hover:text-black mb-6 transition-colors duration-300">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to results
      </button>
      <div className="bg-white rounded-4xl shadow-sm p-8 mb-14 mx-auto w-full">
        <h1 className="text-2xl font-semibold mb-6">Review Answers</h1>
        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="shadow-sm rounded-4xl hover:shadow-xl transition-all duration-300 p-4">
              <h2 className="font-bold text-lg p-2 mb-3">{index + 1}. {question.question}</h2>
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
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800"><strong>Explanation:</strong> {question.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function QuizContent() {
  const [view, setView] = useState<'courses' | 'course_quizzes' | 'quiz_in_progress' | 'quiz_results' | 'review_answers'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizResults, setQuizResults] = useState<{ score: number, answers: Record<string, string>, timeSpent: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const userCourses = await courseService.getCourses(MOCK_USER_ID);
      setCourses(userCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course: Course) => {
    try {
      setLoading(true);
      setSelectedCourse(course);
      const quizzes = await quizService.getQuizzesForCourse(course.id, MOCK_USER_ID);
      setCourseQuizzes(quizzes);
      setView('course_quizzes');
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setView('quiz_in_progress');
  };

  const handleQuizComplete = async (score: number, answers: Record<string, string>, timeSpent: number) => {
    if (!activeQuiz) return;

    try {
      await quizService.submitQuizResult(
        activeQuiz.id,
        MOCK_USER_ID,
        answers,
        score,
        activeQuiz.totalQuestions,
        timeSpent
      );

      setQuizResults({ score, answers, timeSpent });
      setView('quiz_results');

      // Refresh quizzes to update the latest result
      if (selectedCourse) {
        const updatedQuizzes = await quizService.getQuizzesForCourse(selectedCourse.id, MOCK_USER_ID);
        setCourseQuizzes(updatedQuizzes);
      }
    } catch (error) {
      console.error('Error submitting quiz result:', error);
      setError('Failed to submit quiz result');
    }
  };

  const handleResetQuiz = async (quiz: Quiz) => {
    if (!selectedCourse) return;

    try {
      setLoading(true);
      await quizService.resetQuiz(selectedCourse.id, MOCK_USER_ID, quiz.difficulty);
      // Refresh quizzes
      const updatedQuizzes = await quizService.getQuizzesForCourse(selectedCourse.id, MOCK_USER_ID);
      setCourseQuizzes(updatedQuizzes);
    } catch (error) {
      console.error('Error resetting quiz:', error);
      setError('Failed to reset quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    if (quiz.latestResult) {
      // Convert the quiz result answers to our expected format
      const resultAnswers = quiz.latestResult.answers as Record<string, string>;
      setQuizResults({ 
        score: quiz.latestResult.score, 
        answers: resultAnswers, 
        timeSpent: quiz.latestResult.timeSpent || 0 
      });
    }
    setView('review_answers');
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center min-h-screen bg-[#f5f5f5] w-[100vw]'>
        <div className='w-11/12 px-6 pt-34 text-center'>
          <div className="bg-white p-8 rounded-4xl shadow-sm">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center min-h-screen bg-[#f5f5f5] w-[100vw]'>
        <div className='w-11/12 px-6 pt-34 text-center'>
          <div className="bg-white p-8 rounded-4xl shadow-sm">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadCourses();
              }}
              className="mt-4 px-4 py-2 bg-black text-white rounded-4xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'courses':
        return <CourseList courses={courses} onSelectCourse={handleSelectCourse} />;
      
      case 'course_quizzes':
        return selectedCourse ? (
          <CourseQuizzes
            course={selectedCourse}
            quizzes={courseQuizzes}
            onStartQuiz={handleStartQuiz}
            onResetQuiz={handleResetQuiz}
            onReviewQuiz={handleReviewQuiz}
            onBackToCourses={() => setView('courses')}
          />
        ) : null;

      case 'quiz_in_progress':
        return activeQuiz ? (
          <QuizInProgress
            quiz={activeQuiz}
            onQuizComplete={handleQuizComplete}
          />
        ) : null;

      case 'quiz_results':
        return activeQuiz && quizResults ? (
          <QuizResults
            quiz={activeQuiz}
            score={quizResults.score}
            totalQuestions={activeQuiz.totalQuestions}
            answers={quizResults.answers}
            onRestart={() => handleStartQuiz(activeQuiz)}
            onReview={() => setView('review_answers')}
            onBackToQuizzes={() => setView('course_quizzes')}
          />
        ) : null;

      case 'review_answers':
        return activeQuiz && quizResults ? (
          <ReviewAnswers
            quiz={activeQuiz}
            answers={quizResults.answers}
            onBackToResults={() => setView('quiz_results')}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className='flex flex-col items-center min-h-screen bg-[#f5f5f5] w-[100vw]'>
      <div className='w-11/12 px-6 pt-34'>
        {renderContent()}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return <QuizContent />;
}
