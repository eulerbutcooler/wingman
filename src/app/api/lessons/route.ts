import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { lessons, files } from '@/lib/db/schema/courses';
import { eq } from 'drizzle-orm';

// POST /api/lessons - Create a new lesson
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, topicId, fileId, duration } = body;

    // Validate required fields
    if (!title || !type || !topicId) {
      return NextResponse.json(
        { error: 'Title, type, and topicId are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['video', 'pdf', 'pptx'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "video", "pdf", or "pptx"' },
        { status: 400 }
      );
    }

    // Get the last order number for this topic
    const lastLesson = await db
      .select({ order: lessons.order })
      .from(lessons)
      .where(eq(lessons.topicId, topicId))
      .orderBy(lessons.order)
      .limit(1);

    const nextOrder = lastLesson.length > 0 ? lastLesson[0].order + 1 : 1;

    // If fileId is provided, get the file URL
    let fileUrl = null;
    if (fileId) {
      const fileRecord = await db
        .select({ url: files.url })
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1);

      if (fileRecord.length > 0) {
        fileUrl = fileRecord[0].url;
      }
    }

    // Create the lesson
    const [newLesson] = await db
      .insert(lessons)
      .values({
        title,
        type,
        fileUrl,
        duration: type === 'video' ? duration : null,
        topicId,
        order: nextOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update the file record to link it to this lesson
    if (fileId) {
      await db
        .update(files)
        .set({ lessonId: newLesson.id })
        .where(eq(files.id, fileId));
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson created successfully',
      lesson: newLesson,
    });

  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}

// GET /api/lessons - Get lessons for a topic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const topicLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.topicId, topicId))
      .orderBy(lessons.order);

    return NextResponse.json({
      success: true,
      lessons: topicLessons,
    });

  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// PUT /api/lessons - Update lesson order or details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, title, order, duration, fileUrl } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof lessons.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (order !== undefined) updateData.order = order;
    if (duration) updateData.duration = duration;
    if (fileUrl) updateData.fileUrl = fileUrl;

    const [updatedLesson] = await db
      .update(lessons)
      .set(updateData)
      .where(eq(lessons.id, lessonId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Lesson updated successfully',
      lesson: updatedLesson,
    });

  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons - Delete a lesson
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Delete the lesson (files will be handled by cascade)
    await db.delete(lessons).where(eq(lessons.id, lessonId));

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
