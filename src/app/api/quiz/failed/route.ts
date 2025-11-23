import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/quiz/failed
 * 
 * QStash calls this endpoint when quiz generation fails after all retries.
 * This is the Dead Letter Queue (DLQ) handler for quiz generation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, userId, difficulties } = body;

    if (!courseId) {
      console.error("❌ [QUIZ-FAILED] No courseId provided in failure callback");
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }

    console.log(`🚨 [QUIZ-FAILED] Quiz generation failed after retries`, {
      courseId,
      userId,
      difficulties: difficulties || ["unknown"],
    });

    // TODO: Implement proper failure tracking
    // Options:
    // 1. Add a quiz_generation_jobs table to track status
    // 2. Send notification to user
    // 3. Store failure reason for debugging
    // 4. Allow manual retry from admin panel

    // For now, just log the failure
    console.error(`💥 [QUIZ-FAILED] Failed to generate quizzes for course ${courseId}`);

    // Return 200 to acknowledge the failure (don't retry failure callback)
    return NextResponse.json({
      success: true,
      message: "Failure recorded successfully",
    });
  } catch (error) {
    console.error("❌ [QUIZ-FAILED] Error handling failure callback:", error);
    
    // Return 200 anyway to prevent QStash from retrying this callback
    return NextResponse.json({
      success: false,
      error: "Error handling failure, but acknowledged",
    });
  }
}
