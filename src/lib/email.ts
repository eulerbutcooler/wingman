import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(to: string, otp: string, name: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Verify Your Email - Wingman',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #000080; margin: 0;">Wingman</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to Wingman, ${name}!</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              Please verify your email address by entering the following OTP:
            </p>
            
            <div style="background-color: #000080; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This OTP will expire in 10 minutes. If you didn't create an account with Wingman, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2025 Wingman. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Welcome to Wingman, ${name}! Your verification OTP is: ${otp}. This OTP will expire in 10 minutes.`,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Welcome to Wingman! Your Account is Now Active',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #000080; margin: 0;">Wingman</h1>
          </div>
          
          <div style="background-color: #f0f8ff; padding: 30px; border-radius: 10px;">
            <h2 style="color: #000080; margin-bottom: 20px; text-align: center;">🎉 Welcome to Wingman, ${name}!</h2>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Congratulations! Your email has been successfully verified and your account is now active.
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #000080;">
              <h3 style="color: #000080; margin-top: 0;">What's next?</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li>📚 <strong>Explore your Library</strong> - Upload and manage your documents</li>
                <li>💬 <strong>Start Chatting</strong> - Ask questions about your documents with AI</li>
                <li>🎓 <strong>Begin Learning</strong> - Generate quizzes and study materials</li>
                <li>📊 <strong>Track Progress</strong> - Monitor your learning journey</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                 style="background-color: #000080; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin-top: 20px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>💡 Pro Tip:</strong> Start by uploading your first document to see Wingman's AI-powered features in action!
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              Need help getting started? 
              <a href="mailto:${process.env.EMAIL_FROM}" style="color: #000080;">Contact our support team</a>
            </p>
            <p style="color: #999; font-size: 12px;">
              © 2025 Wingman. All rights reserved.
            </p>
          </div>
        </div>
      `,
      text: `Welcome to Wingman, ${name}! Your email has been successfully verified and your account is now active. 

What's next?
- Explore your Library - Upload and manage your documents
- Start Chatting - Ask questions about your documents with AI  
- Begin Learning - Generate quizzes and study materials
- Track Progress - Monitor your learning journey

Access your dashboard at: ${process.env.NEXTAUTH_URL}/dashboard

Need help? Contact us at ${process.env.EMAIL_FROM}`,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return { success: false, error: 'Failed to send welcome email' };
  }
}

export async function verifyEmailTransporter() {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
