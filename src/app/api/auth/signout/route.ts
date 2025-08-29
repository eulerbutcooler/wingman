import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

// POST /api/auth/signout - Custom signout endpoint with session deletion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Log the signout attempt
    if (session?.user?.email) {
      console.log("User signing out:", session.user.email);
    }

    // Clear NextAuth session cookies
    const cookieStore = cookies();
    
    // Clear all NextAuth related cookies
    const nextAuthCookies = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ];

    // Create response with cleared cookies
    const response = NextResponse.json({
      success: true,
      message: "Successfully signed out"
    });

    // Clear each cookie
    nextAuthCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    // Additional cleanup logic for:
    // - User-specific cached data
    // - Temporary files
    // - Session-related cleanup
    console.log("Session cleared for user:", session?.user?.email || "unknown");

    return response;

  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

// GET /api/auth/signout - Handle GET requests to signout endpoint
export async function GET(request: NextRequest) {
  // Redirect to NextAuth signout
  const url = new URL("/api/auth/signout", request.url);
  return NextResponse.redirect(url);
}
