// Quiz Management API Client
// Client-side service for interacting with quiz-related API routes

import type { Quiz, QuizResult } from "@/types";

// Base API URL for quiz operations
const BASE_URL = "/api/quiz";

// ============================================================================
// QUIZ MANAGEMENT
// ============================================================================

// Get all quizzes for a course
export async function getQuizzesForCourse(
  courseId: string | number,
  userId: string
): Promise<Quiz[]> {
  const response = await fetch(`${BASE_URL}/${courseId}?userId=${userId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch quizzes");
  }

  const result = await response.json();
  return result.quizzes;
}

// Generate new quiz for a course
export async function generateQuiz(
  courseId: string | number,
  userId: string,
  difficulty: "easy" | "medium" | "hard",
  regenerate = false
): Promise<Quiz> {
  const response = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      courseId,
      userId,
      difficulty,
      regenerate,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate quiz");
  }

  const result = await response.json();
  return result.quiz;
}

// Submit quiz result
export async function submitQuizResult(
  quizId: string,
  userId: string,
  answers: Record<string, string>,
  score: number,
  totalQuestions: number,
  timeSpent?: number
): Promise<QuizResult> {
  const response = await fetch(`${BASE_URL}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quizId,
      userId,
      answers,
      score,
      totalQuestions,
      timeSpent,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit quiz result");
  }

  const result = await response.json();
  return result.result;
}

// Reset quiz (regenerate with same difficulty)
export async function resetQuiz(
  courseId: string | number,
  userId: string,
  difficulty: "easy" | "medium" | "hard"
): Promise<Quiz> {
  // Generate new quiz with regenerate=true to replace the existing one
  return generateQuiz(courseId, userId, difficulty, true);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Calculate quiz score percentage
export function calculateScorePercentage(
  score: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round((score / totalQuestions) * 100);
}

// Format quiz time spent
export function formatTimeSpent(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

// Get quiz difficulty color for UI
export function getDifficultyColor(
  difficulty: "easy" | "medium" | "hard"
): string {
  switch (difficulty) {
    case "easy":
      return "text-green-600";
    case "medium":
      return "text-yellow-600";
    case "hard":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

// Get grade based on score percentage
export function getGrade(scorePercentage: number): string {
  if (scorePercentage >= 90) return "A+";
  if (scorePercentage >= 85) return "A";
  if (scorePercentage >= 80) return "B+";
  if (scorePercentage >= 75) return "B";
  if (scorePercentage >= 70) return "C+";
  if (scorePercentage >= 65) return "C";
  if (scorePercentage >= 60) return "D";
  return "F";
}
