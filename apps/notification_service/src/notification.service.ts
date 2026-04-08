import { MailerService } from '@nestjs-modules/mailer';

import { Injectable, Logger } from '@nestjs/common';

import {
  EmailVerificationPayload,
  WelcomeEmailPayload,
  ForgotPasswordEmailPayload,
  PasswordChangeEmailPayload,
  EmailChangePayload,
  EmailChangedPayload,
  CheckoutSessionEmailPayload,
  InvoicePaidEmailPayload,
  PaymentFailedEmailPayload,
  SubscriptionActivatedEmailPayload,
  SubscriptionCancelledEmailPayload,
  SubscriptionEndedEmailPayload,
  NewUsageTrackersCreatedEmailPayload,
  AccountDeletionEmailPayload,
  RecurringTransactionsEmailPayload,
} from '@fintrack/types/interfaces/mail.interface';

/**
 * NotificationService.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Sends a verification email with an OTP
   * @param {EmailVerificationPayload} data email, otp, firstName, lastName
   */
  async sendVerificationEmail(data: EmailVerificationPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Verify your email - Fintrack',
        template: './email_verification',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
          otp: data.otp,
          email: data.email,
        },
      });
      this.logger.log(`Verification email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a welcome email after account verification
   * @param {WelcomeEmailPayload} data email, firstName, lastName
   */
  async sendWelcomeEmail(data: WelcomeEmailPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Welcome to Fintrack! Your account is verified',
        template: './welcome',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
      });
      this.logger.log(`Welcome email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to create stripe customer for user ${data.id}`,
        error.stack,
      );
      throw error;
    }

    //2. Send a welcome email to the user
    try {
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a password reset email with an OTP
   * @param {ForgotPasswordEmailPayload} data email, otp, firstName, lastName
   */
  async sendForgotPasswordEmail(data: ForgotPasswordEmailPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Reset your password - Fintrack',
        template: './password_reset',
        context: {
          firstName: data.firstName,
          otp: data.otp,
        },
      });
      this.logger.log(`Password reset email sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends an OTP to confirm a new email address during an in-app email change
   * @param {EmailChangePayload} data new email (recipient), otp, firstName, lastName
   */
  async sendEmailChangeEmail(data: EmailChangePayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Confirm your new email address - Fintrack',
        template: './email_change',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
          otp: data.otp,
        },
      });
      this.logger.log(`Email change confirmation sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email change confirmation to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a security alert to the old address after an email change is confirmed
   * @param {EmailChangedPayload} data oldEmail, newEmail, firstName, lastName
   */
  async sendEmailChangedEmail(data: EmailChangedPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.oldEmail,
        subject: 'Security Alert: Email Address Changed - Fintrack',
        template: './email_changed',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
          newEmail: data.newEmail,
        },
      });
      this.logger.log(`Email changed alert sent to ${data.oldEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email changed alert to ${data.oldEmail}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a password change confirmation email
   * @param {PasswordChangeEmailPayload} data email, firstName, lastName
   */
  async sendPasswordChangeEmail(data: PasswordChangeEmailPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Security Alert: Password Changed - Fintrack',
        template: './password_change',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });
      this.logger.log(`Password change confirmation sent to ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password change confirmation to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a checkout session email
   * @param {CheckoutSessionEmailPayload} data email, firstName, lastName
   */
  async sendCheckoutSessionEmail(data: CheckoutSessionEmailPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Subscription Activated - Fintrack',
        template: './stripe_checkout',
        context: {
          firstName: data.firstName,
          planName: data.planName,
          billingInterval: data.billingInterval,
          currency: data.currency,
          amount: data.amount,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send checkout session email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a invoice paid email
   * @param {InvoicePaidEmailPayload} data email, firstName, lastName
   */
  async sendInvoicePaidEmail(data: InvoicePaidEmailPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Invoice Paid - Fintrack',
        template: './invoice_paid',
        context: {
          firstName: data.firstName,
          currency: data.currency,
          amountPaid: data.amountPaid,
          invoiceNumber: data.invoiceNumber,
          planName: data.planName,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          paymentDate: data.paymentDate,
          hostedInvoiceUrl: data.hostedInvoiceUrl,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send invoice paid email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a payment failed email
   * @param {PaymentFailedEmailPayload} data email, firstName, lastName
   */
  async sendPaymentFailedEmail(data: PaymentFailedEmailPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Payment Failed - Fintrack',
        template: './payment_failed',
        context: {
          firstName: data.firstName,
          currency: data.currency,
          amountDue: data.amountDue,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send payment failed email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a subscription activated email
   * @param {SubscriptionActivatedEmailPayload} data email, firstName, lastName
   */
  async sendSubscriptionActivatedEmail(
    data: SubscriptionActivatedEmailPayload,
  ) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Subscription Activated - Fintrack',
        template: './subscription_activated',
        context: {
          firstName: data.firstName,
          planName: data.planName,
          nextBillingDate: data.nextBillingDate,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send subscription activated email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a subscription cancelled email
   * @param {SubscriptionCancelledEmailPayload} data email, firstName, lastName
   */
  async sendSubscriptionCancelledEmail(
    data: SubscriptionCancelledEmailPayload,
  ) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Subscription Cancelled - Fintrack',
        template: './subscription_cancelled',
        context: {
          firstName: data.firstName,
          planName: data.planName,
          accessEndsAt: data.accessEndsAt,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send subscription cancelled email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a subscription ended email
   * @param {SubscriptionEndedEmailPayload} data email, firstName, lastName
   */
  async sendSubscriptionEndedEmail(data: SubscriptionEndedEmailPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Subscription Ended - Fintrack',
        template: './subscription_ended',
        context: {
          firstName: data.firstName,
          previousPlanName: data.previousPlanName,
          endedAt: data.endedAt,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send subscription ended email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a new usage trackers created email
   * @param {NewUsageTrackersCreatedEmailPayload} data email, firstName, lastName
   */
  async sendNewUsageTrackersCreatedEmail(
    data: NewUsageTrackersCreatedEmailPayload,
  ) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'New usage trackers created - Fintrack',
        template: './new_usage_trackers_created',
        context: {
          firstName: data.firstName,
          email: data.email,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send new usage trackers created email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a account deletion email
   * @param {AccountDeletionEmailPayload} data email, firstName, lastName
   */
  async sendAccountDeletionEmail(data: AccountDeletionEmailPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Account Deletion - Fintrack',
        template: './account_deletion',
        context: {
          firstName: data.firstName,
          email: data.email,
          deletionDate: data.deletionDate,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send account deletion email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends a summary email listing all recurring transactions created in a scheduler run
   * @param {RecurringTransactionsEmailPayload} data email, firstName, lastName, date, items
   */
  async sendRecurringTransactionsEmail(
    data: RecurringTransactionsEmailPayload,
  ) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Your recurring transactions have been processed - Fintrack',
        template: './recurring_transactions',
        context: {
          firstName: data.firstName,
          lastName: data.lastName,
          date: data.date,
          items: data.items,
          count: data.items.length,
        },
      });
      this.logger.log(
        `Recurring transactions email sent to ${data.email} (${data.items.length} item(s))`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send recurring transactions email to ${data.email}`,
        error.stack,
      );
      throw error;
    }
  }
}
