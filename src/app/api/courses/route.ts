import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { courses, topics, lessons } from '@/lib/db/schema/courses';
import { eq, desc } from 'drizzle-orm';

// GET /api/courses - Fetch all courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch courses with their topics and lessons
    const userCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        imageUrl: courses.imageUrl,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        userId: courses.userId,
      })
      .from(courses)
      .where(eq(courses.userId, userId))
      .orderBy(desc(courses.createdAt));

    // For each course, fetch topics and lessons
    const coursesWithContent = await Promise.all(
      userCourses.map(async (course) => {
        const courseTopics = await db
          .select({
            id: topics.id,
            title: topics.title,
            order: topics.order,
          })
          .from(topics)
          .where(eq(topics.courseId, course.id))
          .orderBy(topics.order);

        const topicsWithLessons = await Promise.all(
          courseTopics.map(async (topic) => {
            const topicLessons = await db
              .select()
              .from(lessons)
              .where(eq(lessons.topicId, topic.id))
              .orderBy(lessons.order);

            return {
              ...topic,
              lessons: topicLessons,
            };
          })
        );

        return {
          ...course,
          topics: topicsWithLessons,
        };
      })
    );

    return NextResponse.json({
      success: true,
      courses: coursesWithContent,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, imageUrl, userId, topics: courseTopics } = body;

    // Validate required fields
    if (!title || !description || !userId) {
      return NextResponse.json(
        { error: 'Title, description, and userId are required' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create course
      const [newCourse] = await tx
        .insert(courses)
        .values({
          title,
          description,
          imageUrl: imageUrl || `https://placehold.co/600x400/000000/FFFFFF?text=${encodeURIComponent(title)}`,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create topics and lessons if provided
      if (courseTopics && courseTopics.length > 0) {
        for (let i = 0; i < courseTopics.length; i++) {
          const topic = courseTopics[i];
          
          const [newTopic] = await tx
            .insert(topics)
            .values({
              title: topic.title,
              courseId: newCourse.id,
              order: i + 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          // Create lessons for this topic
          if (topic.lessons && topic.lessons.length > 0) {
            for (let j = 0; j < topic.lessons.length; j++) {
              const lesson = topic.lessons[j];
              
              await tx.insert(lessons).values({
                title: lesson.title,
                type: lesson.type,
                fileUrl: lesson.fileUrl || null,
                duration: lesson.duration || null,
                topicId: newTopic.id,
                order: j + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        }
      }

      return newCourse;
    });

    // After creating the course, fetch it with topics and lessons to return complete data
    const courseWithContent = await db
      .select()
      .from(courses)
      .where(eq(courses.id, result.id))
      .limit(1);

    if (courseWithContent.length === 0) {
      throw new Error('Course not found after creation');
    }

    const course = courseWithContent[0];

    // Get topics for this course
    const courseTopicsData = await db
      .select()
      .from(topics)
      .where(eq(topics.courseId, course.id))
      .orderBy(topics.order);

    // Get lessons for each topic
    const topicsWithLessons = await Promise.all(
      courseTopicsData.map(async (topic) => {
        const topicLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.topicId, topic.id))
          .orderBy(lessons.order);

        return {
          ...topic,
          lessons: topicLessons,
        };
      })
    );

    const courseWithTopicsAndLessons = {
      ...course,
      topics: topicsWithLessons,
    };

    // After course creation, generate quizzes for all difficulties
    // This is done asynchronously to not block the response
    if (result.id) {
      generateQuizzesForCourse(result.id, userId, title, description).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      course: courseWithTopicsAndLessons,
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses?courseId=xxx - Delete a course and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First verify the course exists and belongs to the user
    const existingCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (existingCourse.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (existingCourse[0].userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this course' }, { status: 403 });
    }

    // Delete the course - cascade delete will handle quizzes, topics, and lessons automatically
    const deletedCourse = await db
      .delete(courses)
      .where(eq(courses.id, courseId))
      .returning();

    if (deletedCourse.length === 0) {
      return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }

    console.log(`Successfully deleted course ${courseId} and all associated data`);

    return NextResponse.json({
      success: true,
      message: 'Course and all associated data deleted successfully',
      deletedCourse: deletedCourse[0],
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

// Helper function to generate quizzes for a course
async function generateQuizzesForCourse(
  courseId: string, 
  userId: string, 
  title: string, 
  description: string
) {
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  
  for (const difficulty of difficulties) {
    try {
      // Make internal API call to quiz generation endpoint
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          userId,
          difficulty,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Successfully generated ${difficulty} quiz for course ${courseId}`);
      } else {
        console.error(`Failed to generate ${difficulty} quiz for course ${courseId}`);
      }
    } catch (error) {
      console.error(`Error generating ${difficulty} quiz for course ${courseId}:`, error);
    }
  }
}
