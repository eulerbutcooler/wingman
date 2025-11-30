import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/quiz/generate-worker
 * 
 * QStash worker endpoint that handles queued quiz generation jobs.
 * This runs asynchronously after course creation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, userId, difficulties } = body;

    if (!courseId || !userId) {
      console.error("❌ [QUIZ-WORKER] Missing required fields", {
        courseId,
        userId,
      });
      return NextResponse.json(
        { error: "courseId and userId are required" },
        { status: 400 }
      );
    }

    console.log("🎯 [QUIZ-WORKER] Starting quiz generation", {
      courseId,
      userId,
      difficulties: difficulties || ["easy", "medium", "hard"],
    });

    // Import the quiz generation function
    const { generateQuizForCourse } = await import("@/lib/quiz/quiz-generator");

    const targetDifficulties: ("easy" | "medium" | "hard")[] = 
      difficulties || ["easy", "medium", "hard"];

    // ✅ Generate all quizzes in PARALLEL using Promise.allSettled
    const results = await Promise.allSettled(
      targetDifficulties.map((difficulty) =>
        generateQuizForCourse(
          courseId,
          parseInt(userId),
          difficulty
        ).then((result) => ({
          difficulty,
          success: true,
          quizId: result.quiz?.id,
          questionCount: result.quiz?.totalQuestions,
        })).catch((error) => ({
          difficulty,
          success: false,
          error: error.message,
        }))
      )
    );

    // Log results
    const successful: string[] = [];
    const failed: string[] = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const data = result.value;
        if (data.success && "quizId" in data) {
          successful.push(data.difficulty);
          console.log(
            `✅ [QUIZ-WORKER] Generated ${data.difficulty} quiz`,
            { quizId: data.quizId, questions: data.questionCount }
          );
        } else if (!data.success && "error" in data) {
          failed.push(data.difficulty);
          console.error(
            `❌ [QUIZ-WORKER] Failed to generate ${data.difficulty} quiz:`,
            data.error
          );
        }
      } else {
        failed.push("unknown");
        console.error(
          `❌ [QUIZ-WORKER] Promise rejected:`,
          result.reason
        );
      }
    });

    console.log(`🎉 [QUIZ-WORKER] Quiz generation completed`, {
      courseId,
      successful: successful.length,
      failed: failed.length,
      successfulDifficulties: successful,
      failedDifficulties: failed,
    });

    // Return success even if some failed (partial success)
    return NextResponse.json({
      success: true,
      message: "Quiz generation completed",
      results: {
        successful,
        failed,
        total: targetDifficulties.length,
      },
    });
  } catch (error) {
    console.error("❌ [QUIZ-WORKER] Error in quiz worker:", error);
    
    // Return 500 to trigger QStash retry
    return NextResponse.json(
      { 
        error: "Quiz generation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
