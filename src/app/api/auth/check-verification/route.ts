import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db
      .select({ emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { verified: false, userExists: false },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        verified: user[0].emailVerified || false,
        userExists: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
