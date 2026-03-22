export interface EmailVerificationPayload {
  email: string;
  otp: string;
  firstName: string;
  lastName: string;
}

export interface WelcomeEmailPayload {
  email: string;
  id: string;
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

export interface EmailChangePayload {
  email: string; // the new email address — OTP is sent here
  otp: string;
  firstName: string;
  lastName: string;
}

export interface EmailChangedPayload {
  oldEmail: string; // security alert goes to the old address
  newEmail: string;
  firstName: string;
  lastName: string;
}

export interface CheckoutSessionEmailPayload {
  email: string;
  firstName: string;
  planName: string;
  billingInterval: string;
  currency: string;
  amount: number;
}
