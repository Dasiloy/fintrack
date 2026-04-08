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

export interface InvoicePaidEmailPayload {
  firstName: string;
  currency: string;
  amountPaid: string;
  invoiceNumber: string;
  planName: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  email: string;
  hostedInvoiceUrl: string;
}

export interface PaymentFailedEmailPayload {
  firstName: string;
  currency: string;
  amountDue: string;
  email: string;
}

export interface SubscriptionActivatedEmailPayload {
  firstName: string;
  planName: string;
  nextBillingDate: string;
  email: string;
}

export interface SubscriptionCancelledEmailPayload {
  firstName: string;
  planName: string;
  accessEndsAt: string;
  email: string;
}

export interface SubscriptionEndedEmailPayload {
  firstName: string;
  previousPlanName: string;
  endedAt: string;
  email: string;
}

export interface NewUsageTrackersCreatedEmailPayload {
  firstName: string;
  email: string;
  periodStart: string;
  periodEnd: string;
}

export interface AccountDeletionEmailPayload {
  firstName: string;
  email: string;
  deletionDate: string;
}

export interface RecurringTransactionItem {
  name: string;
  amount: string;
  frequency: string;
  type: string;
}

export interface RecurringTransactionsEmailPayload {
  email: string;
  firstName: string;
  lastName: string;
  date: string;
  items: RecurringTransactionItem[];
}
