import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { quizzes, quizResults } from '@/lib/db/schema/quizzes';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/quiz/[courseId] - Get all quizzes for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { courseId } = await params;

    // Fetch all quizzes for the course
    const courseQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.courseId, courseId))
      .orderBy(desc(quizzes.createdAt));

    // For each quiz, get the user's latest result
    const quizzesWithResults = await Promise.all(
      courseQuizzes.map(async (quiz) => {
        const latestResult = await db
          .select()
          .from(quizResults)
          .where(and(eq(quizResults.quizId, quiz.id), eq(quizResults.userId, userId)))
          .orderBy(desc(quizResults.completedAt))
          .limit(1);

        return {
          ...quiz,
          latestResult: latestResult[0] || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      quizzes: quizzesWithResults,
    });

  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
