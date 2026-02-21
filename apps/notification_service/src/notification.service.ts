import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

import { EmailVerificationPayload } from '@fintrack/types/interfaces/mail.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Sends a verification email with an OTP
   * @param data email, otp, firstName, lastName
   */
  async sendVerificationEmail(data: EmailVerificationPayload) {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Verify your email - Fintrack',
        template: './verification',
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
   * @param data email, firstName, lastName
   */
  async sendWelcomeEmail(data: {
    email: string;
    firstName: string;
    lastName: string;
  }) {
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
}
