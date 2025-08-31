import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { quizzes } from '@/lib/db/schema/quizzes';
import { courses } from '@/lib/db/schema/courses';
import { eq, and } from 'drizzle-orm';

// Schema for quiz question validation
const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple-choice', 'true-false']),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  points: z.number().default(1),
});

const QuizGenerationSchema = z.object({
  questions: z.array(QuestionSchema),
});

// Exported function for generating quizzes
export async function generateQuizForCourse(
  courseId: string,
  userId: string,
  difficulty: 'easy' | 'medium' | 'hard',
  regenerate: boolean = false
) {
  // Get course details
  const course = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (course.length === 0) {
    throw new Error('Course not found');
  }

  const courseData = course[0];

  // If regenerating, delete the existing quiz first
  if (regenerate) {
    await db
      .delete(quizzes)
      .where(and(eq(quizzes.courseId, courseId), eq(quizzes.difficulty, difficulty)));
  } else {
    // Check if quiz already exists for this course and difficulty
    const existingQuiz = await db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.courseId, courseId), eq(quizzes.difficulty, difficulty)))
      .limit(1);

    if (existingQuiz.length > 0) {
      return {
        success: true,
        quiz: existingQuiz[0],
        message: 'Quiz already exists for this course and difficulty',
      };
    }
  }

  // Generate quiz content using AI
  const prompt = `Generate a ${difficulty} difficulty quiz with exactly 10 questions based on the following course:

Title: ${courseData.title}
Description: ${courseData.description}

Requirements:
- Create exactly 10 questions
- Mix of multiple-choice (4 options) and true/false questions
- Questions should test understanding of the course content
- For ${difficulty} difficulty:
  ${difficulty === 'easy' ? '- Focus on basic concepts and definitions\n  - Straightforward questions' : 
    difficulty === 'medium' ? '- Mix of concepts and application\n  - Some analytical thinking required' :
    '- Advanced concepts and critical thinking\n  - Complex scenarios and deep understanding'}
- Each question should have:
  - A clear, well-formed question
  - Appropriate options (4 for multiple-choice, 2 for true/false)
  - The correct answer (must match exactly one of the options)
  - A brief explanation of why the answer is correct
- All questions must be directly related to the course content
- Ensure variety in question types and topics covered
- Genererated quiz is for students at Indian Naval Institute of Aeronautical Technology (INAT) who are doing there Masters degree in engineering.
, Fundamental Concepts: deep understanding of core aeronautical engineering and naval technology principles, including aerodynamics, propulsion, aircraft structures, and avionics.
, INAT Context: familiar with the academic programs and common course topics at INAT. 

Format each question with:
- id: unique identifier (q1, q2, etc.)
- type: "multiple-choice" or "true-false"
- question: the question text
- options: array of possible answers
- correctAnswer: the correct answer (must exactly match one option)
- explanation: brief explanation of the correct answer
- points: 1 for each question`;

  console.log('Generating quiz with AI...');
  
  const result = await generateObject({
    model: google('gemini-1.5-flash'),
    prompt,
    schema: QuizGenerationSchema,
    temperature: 0.7,
  });

  console.log('AI generated quiz:', result.object);

  // Validate that we have exactly 10 questions
  if (result.object.questions.length !== 10) {
    throw new Error('Failed to generate exactly 10 questions');
  }

  // Create quiz in database
  const [newQuiz] = await db
    .insert(quizzes)
    .values({
      title: `${courseData.title} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
      description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty quiz for ${courseData.title}`,
      courseId,
      userId,
      difficulty,
      totalQuestions: 10,
      questions: result.object.questions,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return {
    success: true,
    quiz: newQuiz,
    message: 'Quiz generated successfully',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, userId, difficulty, regenerate = false } = body;

    if (!courseId || !userId || !difficulty) {
      return NextResponse.json(
        { error: 'Course ID, User ID, and difficulty are required' },
        { status: 400 }
      );
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulty must be easy, medium, or hard' },
        { status: 400 }
      );
    }

    const result = await generateQuizForCourse(
      courseId, 
      userId, 
      difficulty as 'easy' | 'medium' | 'hard', 
      regenerate
    );
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
