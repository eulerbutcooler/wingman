"use client";

import React, { useState, useEffect } from "react";
import { Quiz, Question } from "@/types";
import * as quizService from "@/services/quiz-service";

interface QuizTakerProps {
  quiz: Quiz;
  userId: string;
  onComplete: (score: number, answers: Record<string, string>) => void;
  onBack: () => void;
}

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

const QuizTaker: React.FC<QuizTakerProps> = ({
  quiz,
  userId,
  onComplete,
  onBack,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [startTime] = useState(Date.now());

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage =
    ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    // Reset selected answer when question changes
    setSelectedAnswer(answers[currentQuestion?.id] || "");
  }, [currentQuestionIndex, currentQuestion?.id, answers]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    const newAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer("");
    } else {
      // Quiz completed, calculate score
      const score = questions.reduce((total, question) => {
        const userAnswer = newAnswers[question.id];
        return total + (userAnswer === question.correctAnswer ? 1 : 0);
      }, 0);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      try {
        await quizService.submitQuizResult(
          quiz.id,
          userId,
          newAnswers,
          score,
          questions.length,
          timeSpent
        );
      } catch (error) {
        console.error("Failed to submit quiz result:", error);
      }

      onComplete(score, newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">No questions available for this quiz.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
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
    <div>
      <button
        onClick={onBack}
        className="flex items-center font-semibold text-neutral-600 cursor-pointer hover:text-black mb-6 transition-colors duration-300"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to quizzes
      </button>

      <h3 className="text-2xl font-semibold text-left mb-8">
        Quiz in progress...
      </h3>

      <div className="bg-white rounded-4xl shadow-sm mb-14 p-8 mx-auto w-full">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <span
              className={`px-3 py-1 rounded-full text-xs text-white ${getDifficultyColor(
                quiz.difficulty
              )}`}
            >
              {quiz.difficulty}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${getDifficultyColor(
                quiz.difficulty
              )}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>

        <div className="space-y-3 mb-8">
          {currentQuestion.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-left p-4 rounded-4xl transition-all duration-150 cursor-pointer hover:border-gray-600 border ${
                selectedAnswer === option
                  ? "bg-white border-black"
                  : "bg-white border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    selectedAnswer === option
                      ? "border-black bg-black"
                      : "border-gray-300"
                  }`}
                >
                  {selectedAnswer === option && (
                    <div className="w-full h-full rounded-full bg-white scale-50" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-4xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className={`px-6 py-2 text-white font-bold rounded-4xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getDifficultyColor(
              quiz.difficulty
            )}`}
          >
            {currentQuestionIndex < questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;
