import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db/drizzle";
import { quizResults, quizzes } from "@/services/db/schema/quizzes";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { eq } from "drizzle-orm";

// POST /api/quiz/submit - Submit quiz results
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { quizId, userId, answers, score, totalQuestions, timeSpent } =
      await request.json();

    if (
      !quizId ||
      !userId ||
      !answers ||
      score === undefined ||
      !totalQuestions
    ) {
      return NextResponse.json(
        {
          error:
            "Quiz ID, User ID, answers, score, and total questions are required",
        },
        { status: 400 }
      );
    }

    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Save quiz result
    const [result] = await db
      .insert(quizResults)
      .values({
        quizId,
        userId: user.id,
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
      message: "Quiz result saved successfully",
    });
  } catch (error) {
    console.error("Error submitting quiz result:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz result" },
      { status: 500 }
    );
  }
}
