import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { topics, lessons } from '@/lib/db/schema/courses';
import { eq, desc } from 'drizzle-orm';

// POST /api/topics - Create a new topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, courseId } = body;

    // Validate required fields
    if (!title || !courseId) {
      return NextResponse.json(
        { error: 'Title and courseId are required' },
        { status: 400 }
      );
    }

    // Get the last order number for this course
    const lastTopic = await db
      .select({ order: topics.order })
      .from(topics)
      .where(eq(topics.courseId, courseId))
      .orderBy(desc(topics.order))
      .limit(1);

    const nextOrder = lastTopic.length > 0 ? lastTopic[0].order + 1 : 1;

    // Create the topic
    const [newTopic] = await db
      .insert(topics)
      .values({
        title,
        courseId,
        order: nextOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Topic created successfully',
      topic: newTopic,
    });

  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}

// GET /api/topics - Get topics for a course
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get topics with their lessons
    const courseTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.courseId, courseId))
      .orderBy(topics.order);

    // For each topic, get its lessons
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

    return NextResponse.json({
      success: true,
      topics: topicsWithLessons,
    });

  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

// PUT /api/topics - Update topic
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, title, order } = body;

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof topics.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (order !== undefined) updateData.order = order;

    const [updatedTopic] = await db
      .update(topics)
      .set(updateData)
      .where(eq(topics.id, topicId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Topic updated successfully',
      topic: updatedTopic,
    });

  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

// DELETE /api/topics - Delete a topic
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Delete the topic (lessons will be deleted by cascade)
    await db.delete(topics).where(eq(topics.id, topicId));

    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}
