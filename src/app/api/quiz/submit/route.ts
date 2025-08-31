import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { quizResults } from '@/lib/db/schema/quizzes';

// POST /api/quiz/submit - Submit quiz results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, userId, answers, score, totalQuestions, timeSpent } = body;

    if (!quizId || !userId || !answers || score === undefined || !totalQuestions) {
      return NextResponse.json(
        { error: 'Quiz ID, User ID, answers, score, and total questions are required' },
        { status: 400 }
      );
    }

    // Save quiz result
    const [result] = await db
      .insert(quizResults)
      .values({
        quizId,
        userId,
        score,
        totalQuestions,
        answers,
        timeSpent: timeSpent || null,
        completedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      result,
      message: 'Quiz result saved successfully',
    });

  } catch (error) {
    console.error('Error submitting quiz result:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz result' },
      { status: 500 }
    );
  }
}
