export interface EmailVerificationPayload {
  email: string;
  otp: string;
  firstName: string;
  lastName: string;
}

export interface WelcomeEmailPayload {
  email: string;
  firstName: string;
  lastName: string;
}
