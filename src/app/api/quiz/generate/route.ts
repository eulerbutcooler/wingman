import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { generateQuizForCourse } from "@/lib/quiz/quiz-generator";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { courseId, difficulty, regenerate = false } = await request.json();

    if (!courseId || !difficulty) {
      return NextResponse.json(
        { error: "Course ID and difficulty are required" },
        { status: 400 }
      );
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Difficulty must be easy, medium, or hard" },
        { status: 400 }
      );
    }

    const result = await generateQuizForCourse(
      courseId,
      user.id,
      difficulty as "easy" | "medium" | "hard",
      regenerate
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate quiz",
      },
      { status: 500 }
    );
  }
}
