import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/services/db/drizzle";
import { quizzes, quizResults } from "@/services/db/schema/quizzes";
import { eq, desc, and } from "drizzle-orm";

// GET /api/quiz/[courseId] - Get all quizzes for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // ✅ Get user from auth
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { courseId } = await params;

    console.log(
      `🔍 Fetching quizzes for course ${courseId} and user ${userId}`
    );

    // Fetch all quizzes for the course
    const courseQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.courseId, courseId))
      .orderBy(desc(quizzes.createdAt));

    console.log(
      `📊 Found ${courseQuizzes.length} quizzes for course ${courseId}`
    );

    // For each quiz, get the user's latest result
    const quizzesWithResults = await Promise.all(
      courseQuizzes.map(async (quiz) => {
        const latestResult = await db
          .select()
          .from(quizResults)
          .where(
            and(eq(quizResults.quizId, quiz.id), eq(quizResults.userId, userId))
          )
          .orderBy(desc(quizResults.completedAt))
          .limit(1);

        const hasResult = latestResult.length > 0;
        console.log(
          `📝 Quiz ${quiz.id} (${quiz.difficulty}) - User has result: ${hasResult}`
        );

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
    console.error("💥 Error fetching quizzes:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch quizzes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
