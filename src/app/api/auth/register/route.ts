import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { generateOTPWithExpiry } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const { otp, expiry } = generateOTPWithExpiry();

    // Create user with unverified email
    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        emailVerified: false,
        verificationToken: otp,
        verificationTokenExpiry: expiry,
      })
      .returning();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);
    
    if (!emailResult.success) {
      // If email fails, delete the created user
      await db.delete(users).where(eq(users.id, newUser[0].id));
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email for the verification OTP.',
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
          emailVerified: false
        },
        requiresVerification: true
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
