import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { db } from "@/services/db/drizzle";
import { quizzes } from "@/services/db/schema/quizzes";
import { courses, documentChunks, topics, lessons, files } from "@/services/db/schema/courses";
import { eq, and, sql } from "drizzle-orm";

// Schema for quiz question validation
const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple-choice"]),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  points: z.number().default(1),
});

const QuizGenerationSchema = z.object({
  questions: z.array(QuestionSchema),
});

// Helper function to fetch course content for quiz generation
async function getQuizGenerationContext(courseId: string): Promise<string> {
  try {
    // Fetch chunks, excluding those from topics with "Lesson plan" in their title
    // We'll fetch more chunks (50) to ensure we have enough content including numerical problems
    const chunks = await db
      .select({
        chunkText: documentChunks.chunkText,
        pageNumber: documentChunks.pageNumber,
        fileName: files.originalName,
        topicTitle: topics.title,
      })
      .from(documentChunks)
      .innerJoin(files, eq(documentChunks.fileId, files.id))
      .innerJoin(lessons, eq(files.id, lessons.fileId))
      .innerJoin(topics, eq(lessons.topicId, topics.id))
      .where(
        and(
          eq(documentChunks.courseId, courseId),
          sql`${topics.title} NOT ILIKE '%Lesson plan%'`
        )
      )
      .limit(50);

    if (chunks.length === 0) {
      return "";
    }

    // Format chunks into readable context
    const contextText = chunks
      .map((chunk, idx) => {
        const source = chunk.fileName 
          ? `[${chunk.fileName}${chunk.pageNumber ? `, p.${chunk.pageNumber}` : ''}]`
          : '';
        return `--- Chunk ${idx + 1} ${source} ---\n${chunk.chunkText}`;
      })
      .join("\n\n");

    console.log(`Fetched ${chunks.length} chunks for quiz generation (filtered out Lesson plan topics)`);
    return contextText;
  } catch (error) {
    console.error("Error fetching quiz generation context:", error);
    return "";
  }
}

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

  // Fetch course content chunks for context (excluding "Lesson plan" topics)
  const courseContext = await getQuizGenerationContext(courseId);

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

  // Generate AI prompt with course content context
  const basePrompt = `Generate a comprehensive 30-question quiz for the following course:
Title: ${courseData.title}
Description: ${courseData.description}

${courseContext ? `\n=== COURSE CONTENT (Use this material to create specific, content-based questions) ===\n${courseContext}\n=== END COURSE CONTENT ===\n` : ''}

Requirements:
- Exactly 30 questions
- Mix of multiple-choice (4 options) and true/false questions
- Questions MUST be based on the actual course content provided above
- For ${difficulty} difficulty:
  ${
    difficulty === "easy"
      ? "- Focus on basic concepts and definitions from the course materials\n  - Straightforward questions with clear answers\n  - Include at least 3-4 numerical/calculation questions with simple formulas"
      : difficulty === "medium"
      ? "- Mix of concepts and application from course content\n  - Some analytical thinking required\n  - Include at least 5-6 numerical/calculation questions requiring multi-step problem solving"
      : "- Detailed advanced concepts and critical thinking from course materials\n  - Complex scenarios requiring deep understanding\n  - Include at least 8-10 numerical/calculation questions with multi-step derivations, unit conversions, and complex problem solving\n  - Numerical questions should test application of formulas, principles, and calculations covered in the course content"
  }
- NUMERICAL QUESTIONS: These should include specific values, require calculations, and have numerical answers. Examples:
  * "Calculate the lift force if wing area = 20 m², velocity = 50 m/s, and Cl = 0.8 (ρ = 1.225 kg/m³)"
  * "What is the thrust-to-weight ratio for an aircraft with mass 15,000 kg and thrust 45,000 N?"
  * "Determine the range if fuel consumption = 0.8 kg/s, L/D = 12, and fuel mass = 2000 kg"
- Each question should have:
  - A clear, well-formed question
  - Appropriate options (4 for multiple-choice)
  - The correct answer (must match exactly one of the options)
  - A brief explanation showing the calculation or reasoning
- All questions must be directly related to the actual course content provided above
- Ensure variety in question types and topics covered
- Generated quiz is for students at Indian Naval Institute of Aeronautical Technology (NIAT) who are doing their Masters degree in engineering.
- Fundamental Concepts: deep understanding of core aeronautical engineering and naval technology principles, including aerodynamics, propulsion, aircraft structures, and avionics.
- NIAT Context: familiar with the academic programs and common course topics at NIAT.
- Draw specific examples, formulas, and numerical values from the course content when available.

Format each question with:
- id: unique identifier (q1, q2, etc.)
- type: "multiple-choice"
- question: the question text (for numerical questions, include all given values)
- options: array of possible answers
- correctAnswer: the correct answer (must exactly match one option)
- explanation: brief explanation showing the calculation steps or reasoning
- points: 1 for each question`;

  const prompt = basePrompt;

  console.log("Generating quiz with AI...");

  const result = await generateObject({
    model: google("gemini-2.5-flash-lite"),
    prompt,
    schema: QuizGenerationSchema,
    temperature: 0.7,
  });

  console.log("AI generated quiz:", result.object);

  // Validate the generated quiz
  if (!result.object.questions || result.object.questions.length !== 30) {
    throw new Error("Generated quiz does not have exactly 30 questions");
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
