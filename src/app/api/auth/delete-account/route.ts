import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema/users";
import { courses } from "@/lib/db/schema/courses";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// DELETE /api/auth/delete-account - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to delete account" },
        { status: 400 }
      );
    }

    // Trim whitespace from password
    const trimmedPassword = password.trim();

    // Find the user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const foundUser = user[0];

    // Check if user has a password (users created via OAuth might not have one)
    if (!foundUser.password) {
      return NextResponse.json(
        { error: "Account deletion not available for OAuth users. Please contact support." },
        { status: 400 }
      );
    }

    // Debug: Log password verification attempt (without exposing actual passwords)
    console.log("Password verification attempt for user:", session.user.email);
    console.log("User found:", !!foundUser);
    console.log("User has password:", !!foundUser.password);
    console.log("Password provided:", !!trimmedPassword);

    // Verify password before deletion
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(trimmedPassword, foundUser.password);
    } catch (bcryptError) {
      console.error("Bcrypt comparison error:", bcryptError);
      return NextResponse.json(
        { error: "Password verification failed" },
        { status: 500 }
      );
    }
    
    console.log("Password validation result:", isPasswordValid);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Delete user account and all associated data (cascading deletes will handle courses, topics, lessons, files)
    await db.transaction(async (tx) => {
      // Note: Foreign key constraints with CASCADE will automatically delete:
      // - courses (user_id references users.id)
      // - topics (course_id references courses.id) 
      // - lessons (topic_id references topics.id)
      // - files (user_id and lesson_id references)
      
      await tx
        .delete(users)
        .where(eq(users.id, foundUser.id));
    });

    // Create response with success message
    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    });

    // Clear NextAuth session cookies after successful account deletion
    const nextAuthCookies = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ];

    // Clear each cookie to invalidate the session
    nextAuthCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    console.log("Account and session deleted for user:", session.user.email);

    return response;

  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
