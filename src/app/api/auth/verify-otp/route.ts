import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { verifyOTP } from '@/lib/otp';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const foundUser = user[0];

    // Check if already verified
    if (foundUser.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Check if OTP exists
    if (!foundUser.verificationToken || !foundUser.verificationTokenExpiry) {
      return NextResponse.json(
        { error: 'No verification token found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = verifyOTP(
      otp,
      foundUser.verificationToken,
      foundUser.verificationTokenExpiry
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Update user as verified
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      })
      .where(eq(users.id, foundUser.id));

    // Send welcome email
    const welcomeEmailResult = await sendWelcomeEmail(foundUser.email, foundUser.name);
    
    if (!welcomeEmailResult.success) {
      // Log the error but don't fail the verification process
      console.error('Failed to send welcome email:', welcomeEmailResult.error);
    }

    return NextResponse.json(
      { 
        message: 'Email verified successfully! Welcome to Wingman.',
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          emailVerified: true
        },
        welcomeEmailSent: welcomeEmailResult.success,
        // Add a verification success flag for auto-signin
        verificationSuccess: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
