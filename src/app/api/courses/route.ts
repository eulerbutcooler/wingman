import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db/drizzle";
import { courses, topics, lessons, files } from "@/services/db/schema/courses";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { generateCourseSummary } from "@/lib/actions/course/course-summary";

// GET /api/courses - Fetch all courses
export async function GET() {
  try {
    // Fetch courses with their topics and lessons
    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        gendesc: courses.gendesc, // Include AI-generated description
        imageUrl: courses.imageUrl,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        userId: courses.userId,
      })
      .from(courses)
      .orderBy(desc(courses.createdAt));

    // For each course, fetch topics and lessons
    const coursesWithContent = await Promise.all(
      allCourses.map(async (course) => {
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
            // Get lessons with file URLs by joining with files table
            const topicLessons = await db
              .select({
                id: lessons.id,
                title: lessons.title,
                type: lessons.type,
                fileId: lessons.fileId,
                topicId: lessons.topicId,
                order: lessons.order,
                createdAt: lessons.createdAt,
                updatedAt: lessons.updatedAt,
                fileUrl: files.publicUrl, // Get the file URL from files table
              })
              .from(lessons)
              .leftJoin(files, eq(lessons.fileId, files.id)) // Left join to include lessons without files
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
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [COURSE] Starting course creation process");

    console.log("📥 [COURSE] Parsing request body");
    const body = await request.json();
    const { title, description, imageUrl, topics: courseTopics } = body;

    // Get current user from auth
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("📋 [COURSE] Request data received", {
      title,
      description: description?.substring(0, 100) + "...",
      imageUrl,
      userId: user.id, // Use database integer ID
      topicsCount: courseTopics?.length || 0,
      hasTopics: !!courseTopics,
    });

    // Validate required fields
    console.log("🔍 [COURSE] Validating required fields");
    if (!title || !description) {
      console.error("❌ [COURSE] Missing required fields", {
        hasTitle: !!title,
        hasDescription: !!description,
      });
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    console.log("✅ [COURSE] Field validation passed");

    // Generate AI description
    console.log("🤖 [COURSE] Generating AI course summary");
    let aiDescription: string;
    try {
      aiDescription = await generateCourseSummary(title, description);
      console.log("✅ [COURSE] AI summary generated successfully");
    } catch (error) {
      console.error("❌ [COURSE] Failed to generate AI summary:", error);
      aiDescription =
        "This course will provide valuable insights to enhance your understanding of aeronautical engineering principles.";
    }

    // Start transaction
    console.log("🔄 [COURSE] Starting database transaction");
    const result = await db.transaction(async (tx) => {
      // Create course
      console.log("🏗️ [COURSE] Creating course record");
      const [newCourse] = await tx
        .insert(courses)
        .values({
          title,
          description,
          gendesc: aiDescription, // Store AI-generated description
          imageUrl:
            imageUrl ||
            `https://placehold.co/600x400/000000/FFFFFF?text=${encodeURIComponent(
              title
            )}`,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log("✅ [COURSE] Course created successfully", {
        courseId: newCourse.id,
        title: newCourse.title,
        userId: newCourse.userId,
      });

      // Create topics and lessons if provided
      if (courseTopics && courseTopics.length > 0) {
        console.log("📚 [COURSE] Creating topics and lessons", {
          topicsCount: courseTopics.length,
        });

        for (let i = 0; i < courseTopics.length; i++) {
          const topic = courseTopics[i];

          console.log(
            `📖 [COURSE] Creating topic ${i + 1}/${courseTopics.length}`,
            {
              topicTitle: topic.title,
              lessonsCount: topic.lessons?.length || 0,
            }
          );

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

          console.log(`✅ [COURSE] Topic created successfully`, {
            topicId: newTopic.id,
            title: newTopic.title,
            order: newTopic.order,
          });

          // Create lessons for this topic
          if (topic.lessons && topic.lessons.length > 0) {
            console.log(
              `📄 [COURSE] Creating lessons for topic ${newTopic.title}`,
              {
                lessonsCount: topic.lessons.length,
              }
            );

            for (let j = 0; j < topic.lessons.length; j++) {
              const lesson = topic.lessons[j];

              console.log(
                `📝 [COURSE] Creating lesson ${j + 1}/${topic.lessons.length}`,
                {
                  lessonTitle: lesson.title,
                  lessonType: lesson.type,
                  hasFileId: !!lesson.fileId,
                }
              );

              await tx.insert(lessons).values({
                title: lesson.title,
                type: lesson.type,
                fileId: lesson.fileId || null,
                topicId: newTopic.id,
                order: j + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              console.log(`✅ [COURSE] Lesson created successfully`, {
                title: lesson.title,
                type: lesson.type,
                order: j + 1,
              });
            }

            console.log(
              `✅ [COURSE] All lessons created for topic ${newTopic.title}`,
              {
                lessonsCreated: topic.lessons.length,
              }
            );
          } else {
            console.log(
              `ℹ️ [COURSE] No lessons to create for topic ${newTopic.title}`
            );
          }
        }

        console.log("✅ [COURSE] All topics and lessons created successfully", {
          topicsCreated: courseTopics.length,
          totalLessons: courseTopics.reduce(
            (acc: number, topic: { lessons?: unknown[] }) =>
              acc + (topic.lessons?.length || 0),
            0
          ),
        });
      } else {
        console.log("ℹ️ [COURSE] No topics provided - creating course only");
      }

      return newCourse;
    });

    console.log("🎉 [COURSE] Transaction completed successfully", {
      courseId: result.id,
      title: result.title,
    });

    // After creating the course, fetch it with topics and lessons to return complete data
    console.log(
      "🔍 [COURSE] Fetching complete course data with topics and lessons"
    );
    const courseWithContent = await db
      .select()
      .from(courses)
      .where(eq(courses.id, result.id))
      .limit(1);

    if (courseWithContent.length === 0) {
      console.error("❌ [COURSE] Course not found after creation", {
        courseId: result.id,
      });
      throw new Error("Course not found after creation");
    }

    const course = courseWithContent[0];
    console.log("✅ [COURSE] Course fetched successfully", {
      courseId: course.id,
    });

    // Get topics for this course
    console.log("📚 [COURSE] Fetching topics for course");
    const courseTopicsData = await db
      .select()
      .from(topics)
      .where(eq(topics.courseId, course.id))
      .orderBy(topics.order);

    console.log("📋 [COURSE] Topics fetched", {
      topicsCount: courseTopicsData.length,
    });

    // Get lessons for each topic
    console.log("📄 [COURSE] Fetching lessons for each topic");
    const topicsWithLessons = await Promise.all(
      courseTopicsData.map(async (topic) => {
        const topicLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.topicId, topic.id))
          .orderBy(lessons.order);

        console.log(`📝 [COURSE] Lessons fetched for topic ${topic.title}`, {
          lessonsCount: topicLessons.length,
        });

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

    console.log("✅ [COURSE] Complete course data assembled", {
      courseId: course.id,
      topicsCount: topicsWithLessons.length,
      totalLessons: topicsWithLessons.reduce(
        (acc: number, topic: { lessons: unknown[] }) =>
          acc + topic.lessons.length,
        0
      ),
    });

    // After course creation, generate quizzes for all difficulties
    // This is done asynchronously to not block the response
    if (result.id) {
      console.log("🎯 [COURSE] Starting async quiz generation", {
        courseId: result.id,
        userId: user.id,
        title,
        description: description.substring(0, 50) + "...",
      });

      generateQuizzesForCourse(
        result.id,
        user.id.toString(),
        title,
        description
      ).catch((error) => {
        console.error("❌ [COURSE] Quiz generation failed:", {
          error: error.message,
          courseId: result.id,
          userId: user.id,
        });
        console.error(error);
      });
    }

    console.log("🎉 [COURSE] Course creation process completed successfully");

    return NextResponse.json({
      success: true,
      message: "Course created successfully",
      course: courseWithTopicsAndLessons,
    });
  } catch (error) {
    console.error("💥 [COURSE] Error creating course:", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      timestamp: new Date().toISOString(),
    });
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses - Delete a course
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Find the course to be deleted
    const course = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (course.length === 0) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Perform the deletion
    await db.delete(courses).where(eq(courses.id, courseId));

    console.log(`🗑️ Course with ID ${courseId} deleted successfully.`);

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
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
  // Import the quiz generation function directly
  const { generateQuizForCourse } = await import("@/lib/quiz/quiz-generator");

  const difficulties: ("easy" | "medium" | "hard")[] = [
    "easy",
    "medium",
    "hard",
  ];

  for (const difficulty of difficulties) {
    try {
      console.log(`🎯 Generating ${difficulty} quiz for course ${courseId}`);

      // Call the quiz generation function directly
      const result = await generateQuizForCourse(
        courseId,
        parseInt(userId), // Convert string to number
        difficulty,
        false // not regenerating
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
