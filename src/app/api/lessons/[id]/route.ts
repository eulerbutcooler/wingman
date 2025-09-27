import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db/drizzle";
import { lessons } from "@/services/db/schema/courses";
import { eq } from "drizzle-orm";

// PUT /api/lessons/[id] - Update a lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log("🔄 Updating lesson:", id, "with data:", body);

    // Validate lesson ID
    if (!id) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Check if lesson exists
    const existingLesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);

    if (existingLesson.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Update the lesson
    const [updatedLesson] = await db
      .update(lessons)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, id))
      .returning();

    console.log("✅ Lesson updated successfully:", updatedLesson);

    return NextResponse.json({
      success: true,
      message: "Lesson updated successfully",
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error("💥 Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// GET /api/lessons/[id] - Get a specific lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate lesson ID
    if (!id) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Get the lesson
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      lesson: lesson[0],
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[id] - Delete a lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate lesson ID
    if (!id) {
      return NextResponse.json(
        { error: "Lesson ID is required" },
        { status: 400 }
      );
    }

    // Check if lesson exists
    const existingLesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);

    if (existingLesson.length === 0) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Delete the lesson
    await db.delete(lessons).where(eq(lessons.id, id));

    return NextResponse.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
