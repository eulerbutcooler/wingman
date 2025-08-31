import { Quiz, QuizResult } from '@/types';

class QuizService {
  private baseUrl = '/api/quiz';

  // Get all quizzes for a course
  async getQuizzesForCourse(courseId: string, userId: string): Promise<Quiz[]> {
    const response = await fetch(`${this.baseUrl}/${courseId}?userId=${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch quizzes');
    }

    const result = await response.json();
    return result.quizzes;
  }

  // Generate new quiz for a course
  async generateQuiz(courseId: string, userId: string, difficulty: 'easy' | 'medium' | 'hard', regenerate = false): Promise<Quiz> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error(error.error || 'Failed to generate quiz');
    }

    const result = await response.json();
    return result.quiz;
  }

  // Submit quiz result
  async submitQuizResult(
    quizId: string,
    userId: string,
    answers: Record<string, string>,
    score: number,
    totalQuestions: number,
    timeSpent?: number
  ): Promise<QuizResult> {
    const response = await fetch(`${this.baseUrl}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error(error.error || 'Failed to submit quiz result');
    }

    const result = await response.json();
    return result.result;
  }

  // Reset quiz (regenerate with same difficulty)
  async resetQuiz(courseId: string, userId: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<Quiz> {
    // Generate new quiz with regenerate=true to replace the existing one
    return this.generateQuiz(courseId, userId, difficulty, true);
  }
}

// Export singleton instance
export const quizService = new QuizService();
