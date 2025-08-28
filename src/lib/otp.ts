import { authenticator } from 'otplib';

// Configure OTP settings
authenticator.options = {
  step: 600, // 10 minutes validity
  window: 1, // Allow 1 step tolerance
};

export function generateOTP(): string {
  // Generate a simple 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateOTPWithExpiry() {
  const otp = generateOTP();
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes from now
  
  return {
    otp,
    expiry,
  };
}

export function isOTPExpired(expiry: Date): boolean {
  return new Date() > expiry;
}

export function verifyOTP(inputOTP: string, storedOTP: string, expiry: Date): boolean {
  if (isOTPExpired(expiry)) {
    return false;
  }
  
  return inputOTP === storedOTP;
}
