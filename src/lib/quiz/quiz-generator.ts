import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { db } from "@/services/db/drizzle";
import { quizzes } from "@/services/db/schema/quizzes";
import { courses, documentChunks, topics, lessons, files } from "@/services/db/schema/courses";
import { eq, and, sql } from "drizzle-orm";
import { generateEmbedding } from "@/lib/rag/embeddings";

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
    // Use semantic search with a quiz-focused query to find the most relevant content
    // This ensures we get content with examples, problems, formulas, and exercises
    const quizSearchQuery = "examples problems exercises calculations formulas numerical questions definitions theorems";
    const queryEmbedding = await generateEmbedding(quizSearchQuery);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    console.log("🎯 Fetching quiz-relevant chunks using semantic search...");

    // Semantic search: Find chunks most relevant to quiz content (examples, problems, etc.)
    // Filter by courseId and exclude lesson plans
    const chunks = await db.execute(sql`
      SELECT 
        dc.chunk_text,
        dc.page_number,
        dc.chunk_type,
        dc.heading_text,
        f.original_name as file_name,
        t.title as topic_title,
        1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
      FROM document_chunks dc
      INNER JOIN files f ON dc.file_id = f.id
      INNER JOIN lessons l ON f.id = l.file_id
      INNER JOIN topics t ON l.topic_id = t.id
      WHERE dc.course_id = ${courseId}
        AND dc.embedding IS NOT NULL
        AND t.title NOT ILIKE '%Lesson plan%'
      ORDER BY dc.embedding <=> ${embeddingStr}::vector
      LIMIT 150
    `);

    if (chunks.length === 0) {
      console.log("⚠️ No chunks found with semantic search, falling back to random sampling...");
      // Fallback: Random sampling if no embeddings
      const fallbackChunks = await db
        .select({
          chunkText: documentChunks.chunkText,
          pageNumber: documentChunks.pageNumber,
          fileName: files.originalName,
          topicTitle: topics.title,
          chunkType: documentChunks.chunkType,
          headingText: documentChunks.headingText,
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
        .orderBy(sql`RANDOM()`)
        .limit(100);
      
      if (fallbackChunks.length === 0) {
        return "";
      }

      // Format fallback chunks
      const contextText = fallbackChunks
        .map((chunk, idx) => {
          const source = chunk.fileName 
            ? `[${chunk.fileName}${chunk.pageNumber ? `, p.${chunk.pageNumber}` : ''}]`
            : '';
          const heading = chunk.headingText ? `\n## ${chunk.headingText}` : '';
          return `--- Chunk ${idx + 1} ${source} ---${heading}\n${chunk.chunkText}`;
        })
        .join("\n\n");

      console.log(`📚 Fallback: Selected ${fallbackChunks.length} random chunks for quiz generation`);
      return contextText;
    }

    // Map results from raw SQL
    const mappedChunks = chunks.map((row: Record<string, unknown>) => ({
      chunkText: row.chunk_text as string,
      pageNumber: row.page_number as number | null,
      fileName: row.file_name as string,
      topicTitle: row.topic_title as string,
      chunkType: row.chunk_type as string | null,
      headingText: row.heading_text as string | null,
      similarity: parseFloat(row.similarity as string),
    }));

    // Score chunks by relevance for quiz generation (on top of semantic similarity)
    const scoredChunks = mappedChunks.map((chunk) => {
      let score = chunk.similarity * 10; // Start with semantic similarity score
      const text = chunk.chunkText.toLowerCase();
      
      // High priority: Questions and examples with numbers
      if (/question\s+\d+/i.test(text)) score += 15;
      if (/example\s+\d+(\.\d+)?/i.test(text)) score += 12;
      if (/problem\s+\d+/i.test(text)) score += 12;
      if (/exercise\s+\d+/i.test(text)) score += 10;
      
      // Medium priority: Theory and formulas
      if (/theorem|definition|formula|equation/i.test(text)) score += 8;
      if (/calculate|determine|find|derive/i.test(text)) score += 7;
      
      // Boost chunks with numerical content
      if (/\d+\s*(m\/s|kg|newton|meter|km|pascal|watt)/i.test(text)) score += 6;
      
      // Chunk type bonuses
      if (chunk.chunkType === 'formula') score += 10;
      if (chunk.chunkType === 'text') score += 3;
      
      // Heading context bonus
      if (chunk.headingText && /chapter|section|unit/i.test(chunk.headingText)) score += 4;
      
      return { ...chunk, score };
    });

    // Sort by score and take top 60 chunks for better coverage
    const bestChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);

    // Format chunks into readable context
    const contextText = bestChunks
      .map((chunk, idx) => {
        const source = chunk.fileName 
          ? `[${chunk.fileName}${chunk.pageNumber ? `, p.${chunk.pageNumber}` : ''}]`
          : '';
        const heading = chunk.headingText ? `\n## ${chunk.headingText}` : '';
        return `--- Chunk ${idx + 1} ${source} ---${heading}\n${chunk.chunkText}`;
      })
      .join("\n\n");

    console.log(`Fetched ${chunks.length} chunks, selected top ${bestChunks.length} for quiz generation (filtered out Lesson plan topics)`);
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
  difficulty: "easy" | "medium" | "hard"
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

  // ALWAYS delete existing quiz of same difficulty before creating new one
  // This ensures only one quiz per course per difficulty exists
  const existingQuizzes = await db
    .select()
    .from(quizzes)
    .where(
      and(
        eq(quizzes.courseId, courseId),
        eq(quizzes.difficulty, difficulty)
      )
    );

  if (existingQuizzes.length > 0) {
    console.log(`Deleting ${existingQuizzes.length} existing ${difficulty} quiz(es) for course ${courseId}`);
    await db
      .delete(quizzes)
      .where(
        and(
          eq(quizzes.courseId, courseId),
          eq(quizzes.difficulty, difficulty)
        )
      );
  }

  // Generate AI prompt with course content context
  const basePrompt = `Generate a comprehensive 30-question quiz for the following course:
Title: ${courseData.title}
Description: ${courseData.description}

${courseContext ? `\n=== COURSE CONTENT (Primary Reference Material) ===\n${courseContext}\n=== END COURSE CONTENT ===\n` : ''}

Requirements:
- Exactly 30 questions
- Mix of multiple-choice (4 options) and true/false questions
- Use the course content above as your primary reference material
- You may supplement with your general knowledge to create well-formed, clear questions
- Prioritize questions based on examples, problems, and numerical exercises found in the course content
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
  - A clear, well-formed question that is self-contained (include all necessary context)
  - Appropriate options (4 for multiple-choice)
  - The correct answer (must match exactly one of the options)
  - A brief explanation showing the calculation steps or reasoning
- Questions should be relevant to the course topics and material
- Ensure variety in question types and topics covered
- Make questions complete and understandable without requiring reference to "the text" or "given information"
- Generated quiz is for students at Indian Naval Institute of Aeronautical Technology (NIAT) who are doing their Masters degree in engineering.
- Fundamental Concepts: deep understanding of core aeronautical engineering and naval technology principles, including aerodynamics, propulsion, aircraft structures, and avionics.
- NIAT Context: familiar with the academic programs and common course topics at NIAT.
- Draw specific examples, formulas, and numerical values from the course content when available.

Format each question with:
- id: unique identifier (q1, q2, q3... q30) - MUST be sequential and unique
- type: "multiple-choice"
- question: the question text (for numerical questions, include all given values)
- options: array of possible answers
- correctAnswer: the correct answer (must exactly match one option)
- explanation: brief explanation showing the calculation steps or reasoning
- points: 1 for each question

CRITICAL RULES:
- Generate EXACTLY 30 questions, no more and no less
- Each question MUST have a unique sequential ID (q1 through q30)
- Do NOT duplicate or recalculate any question - if you make an error, continue to the next question
- Do NOT include alternate versions of questions (like q8_recalc or q5_v2)`;

  const prompt = basePrompt;

  console.log("Generating quiz with AI using Gemini 2.5 Flash...");

  const result = await generateObject({
    model: google("gemini-2.5-flash"),
    prompt,
    schema: QuizGenerationSchema,
    temperature: 0.7,
  });

  console.log("AI generated quiz:", result.object);

  // Process and validate the generated quiz
  let questions = result.object.questions || [];
  
  // Remove duplicate questions (by id or by question text)
  const seenIds = new Set<string>();
  const seenQuestions = new Set<string>();
  questions = questions.filter((q) => {
    const questionKey = q.question.toLowerCase().trim().substring(0, 100);
    if (seenIds.has(q.id) || seenQuestions.has(questionKey)) {
      console.log(`Removing duplicate question: ${q.id}`);
      return false;
    }
    seenIds.add(q.id);
    seenQuestions.add(questionKey);
    return true;
  });

  // If we have more than 30 questions, take only the first 30
  if (questions.length > 30) {
    console.log(`Generated ${questions.length} questions, trimming to 30`);
    questions = questions.slice(0, 30);
  }

  // Re-index question IDs to ensure sequential order
  questions = questions.map((q, idx) => ({
    ...q,
    id: `q${idx + 1}`,
  }));

  // Validate we have exactly 30 questions
  if (questions.length !== 30) {
    throw new Error(`Generated quiz has ${questions.length} questions instead of 30`);
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
      totalQuestions: questions.length,
      questions: questions,
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
