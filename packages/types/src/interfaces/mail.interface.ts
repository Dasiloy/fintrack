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

export interface ForgotPasswordEmailPayload {
  email: string;
  otp: string;
  firstName: string;
  lastName: string;
}

export interface PasswordChangeEmailPayload {
  email: string;
  firstName: string;
  lastName: string;
}
