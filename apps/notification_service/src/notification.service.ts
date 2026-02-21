import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

import {
  EmailVerificationPayload,
  WelcomeEmailPayload,
  ForgotPasswordEmailPayload,
  PasswordChangeEmailPayload,
} from '@fintrack/types/interfaces/mail.interface';

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
}
