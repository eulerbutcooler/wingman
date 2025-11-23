import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { qstashClient } from "@/lib/qstash";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    console.log("🎯 [QUIZ] Triggering quiz generation for existing course", {
      courseId,
      userId: user.id,
    });

    // Use the same queue system as course creation
    if (qstashClient) {
      try {
        await qstashClient.publishJSON({
          url: `${process.env.NEXT_PUBLIC_URL}/api/quiz/generate-worker`,
          body: {
            courseId,
            userId: user.id.toString(),
            difficulties: ["easy", "medium", "hard"],
          },
          retries: 3,
          timeout: 120, // 2 minutes timeout for quiz generation
          failureCallback: `${process.env.NEXT_PUBLIC_URL}/api/quiz/failed`,
        });

        console.log("✅ [QUIZ] Quiz generation queued successfully");
        
        return NextResponse.json({
          success: true,
          message: "Quiz generation started. This may take a few moments.",
        });
      } catch (queueError) {
        console.error("❌ [QUIZ] Failed to queue quiz generation:", queueError);
        // Fallback: Generate quizzes directly
        console.log("🏠 [QUIZ] Falling back to direct quiz generation");
        await generateQuizzesForCourse(courseId, user.id.toString());
        
        return NextResponse.json({
          success: true,
          message: "Quizzes generated successfully",
        });
      }
    } else {
      // Fallback for localhost/development without QStash
      console.log("🏠 [QUIZ] No QStash - generating quizzes directly");
      await generateQuizzesForCourse(courseId, user.id.toString());
      
      return NextResponse.json({
        success: true,
        message: "Quizzes generated successfully",
      });
    }
  } catch (error) {
    console.error("Error triggering quiz generation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to trigger quiz generation",
      },
      { status: 500 }
    );
  }
}

// Helper function to generate all quizzes for a course (same as in courses/route.ts)
async function generateQuizzesForCourse(courseId: string, userId: string) {
  const { generateQuizForCourse } = await import("@/lib/quiz/quiz-generator");

  const difficulties: ("easy" | "medium" | "hard")[] = [
    "easy",
    "medium",
    "hard",
  ];

  for (const difficulty of difficulties) {
    try {
      console.log(`🎯 Generating ${difficulty} quiz for course ${courseId}`);

      const result = await generateQuizForCourse(
        courseId,
        parseInt(userId),
        difficulty,
        false
      );

      console.log(
        `✅ Successfully generated ${difficulty} quiz for course ${courseId}:`,
        { quizId: result.quiz?.id, questionCount: result.quiz?.totalQuestions }
      );
    } catch (error) {
      console.error(
        `❌ Error generating ${difficulty} quiz for course ${courseId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

