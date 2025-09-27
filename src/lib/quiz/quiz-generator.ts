import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { db } from "@/services/db/drizzle";
import { quizzes } from "@/services/db/schema/quizzes";
import { courses } from "@/services/db/schema/courses";
import { eq, and } from "drizzle-orm";

// Schema for quiz question validation
const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple-choice", "true-false"]),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  points: z.number().default(1),
});

const QuizGenerationSchema = z.object({
  questions: z.array(QuestionSchema),
});

// Utility function for generating quizzes
export async function generateQuizForCourse(
  courseId: string,
  userId: number,
  difficulty: "easy" | "medium" | "hard",
  regenerate: boolean = false
) {
  // Get course details
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (course.length === 0) {
    throw new Error("Course not found");
  }

  const courseData = course[0];

  // If regenerating, delete the existing quiz first
  if (regenerate) {
    await db
      .delete(quizzes)
      .where(
        and(
          eq(quizzes.courseId, courseId),
          eq(quizzes.userId, userId),
          eq(quizzes.difficulty, difficulty)
        )
      );
  }

  // Check if quiz already exists
  const existingQuiz = await db
    .select()
    .from(quizzes)
    .where(
      and(
        eq(quizzes.courseId, courseId),
        eq(quizzes.userId, userId),
        eq(quizzes.difficulty, difficulty)
      )
    )
    .limit(1);

  if (existingQuiz.length > 0 && !regenerate) {
    console.log(`Quiz already exists for ${difficulty} difficulty`);
    return {
      success: true,
      quiz: existingQuiz[0],
      message: `${difficulty} quiz already exists`,
    };
  }

  // Generate AI prompt
  const prompt = `Generate a comprehensive 10-question quiz for the following course:
Title: ${courseData.title}
Description: ${courseData.description}

Requirements:
- Exactly 10 questions
- Mix of multiple-choice (4 options) and true/false questions
- Questions should test understanding of the course content
- For ${difficulty} difficulty:
  ${
    difficulty === "easy"
      ? "- Focus on basic concepts and definitions\\n  - Straightforward questions"
      : difficulty === "medium"
      ? "- Mix of concepts and application\\n  - Some analytical thinking required"
      : "- Advanced concepts and critical thinking\\n  - Complex scenarios and deep understanding"
  }
- Each question should have:
  - A clear, well-formed question
  - Appropriate options (4 for multiple-choice, 2 for true/false)
  - The correct answer (must match exactly one of the options)
  - A brief explanation of why the answer is correct
- All questions must be directly related to the course content
- Ensure variety in question types and topics covered
- Generated quiz is for students at Indian Naval Institute of Aeronautical Technology (INAT) who are doing their Masters degree in engineering.
- Fundamental Concepts: deep understanding of core aeronautical engineering and naval technology principles, including aerodynamics, propulsion, aircraft structures, and avionics.
- INAT Context: familiar with the academic programs and common course topics at INAT. 

Format each question with:
- id: unique identifier (q1, q2, etc.)
- type: "multiple-choice" or "true-false"
- question: the question text
- options: array of possible answers
- correctAnswer: the correct answer (must exactly match one option)
- explanation: brief explanation of the correct answer
- points: 1 for each question`;

  console.log("Generating quiz with AI...");

  const result = await generateObject({
    model: google("gemini-2.5-flash-lite"),
    prompt,
    schema: QuizGenerationSchema,
    temperature: 0.7,
  });

  console.log("AI generated quiz:", result.object);

  // Validate the generated quiz
  if (!result.object.questions || result.object.questions.length !== 10) {
    throw new Error("Generated quiz does not have exactly 10 questions");
  }

  // Create quiz record
  const [newQuiz] = await db
    .insert(quizzes)
    .values({
      title: `${courseData.title} - ${
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
      } Quiz`,
      courseId,
      userId,
      difficulty,
      totalQuestions: result.object.questions.length,
      questions: result.object.questions,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  console.log("Quiz created successfully:", newQuiz.id);

  return {
    success: true,
    quiz: newQuiz,
    message: `${difficulty} quiz generated successfully`,
  };
}
