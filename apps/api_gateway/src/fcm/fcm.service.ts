import * as crypto from 'crypto';

import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@fintrack/database/service';
import { FcmNotificationPayload } from '@fintrack/types/interfaces/finance';

type FcmMessage = {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data: Record<string, string>;
  webpush: {
    fcmOptions: {
      link: string;
    };
  };
};

type FirebaseApp = {
  messaging(): {
    sendEach(messages: FcmMessage[]): Promise<{
      responses: Array<{
        success: boolean;
        error?: {
          code?: string;
        };
      }>;
    }>;
  };
};

/**
 * Service responsible for sending FCM notifications to users
 * Handles sending notifications to all devices of a user,
 *
 *
 * Only sends background notificatins using this, all foreground notification is delivered vai websocket
 * @class FcmService
 */
@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private firebaseApp: FirebaseApp | null = null;
  private firebaseAppPromise: Promise<FirebaseApp> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * @description Send a notification to all devices of a user
   *
   * @async
   * @public
   * @param userId - The ID of the user to send the notification to
   * @param payload - The payload of the notification
   *
   * @throws {Error} If the notification fails to send
   * @returns {Promise<void>}
   */
  async sendToUser(payload: FcmNotificationPayload): Promise<void> {
    try {
      // always save notification to databse

      const devices = await this.prisma.fcmDevice.findMany({
        where: { userId: payload.userId },
      });

      if (devices.length === 0) return;

      const createdAt = new Date();
      const notificationId = this.generateNotificationId();
      const messages = devices.map((device) => ({
        token: device.fcmToken!,
        notification: { title: payload.title, body: payload.body },
        data: {
          ...payload.data,
          notificationId,
          createdAt: createdAt.toISOString(),
          url: this.configService.getOrThrow('NEXT_PUBLIC_APP_URL'),
        },
        webpush: {
          fcmOptions: {
            link: this.configService.getOrThrow('NEXT_PUBLIC_APP_URL'),
          },
        },
      }));

      // sendEach sends to all tokens — does not fail if one token is stale
      const firebaseApp = await this.getFirebaseApp();
      const response = await firebaseApp.messaging().sendEach(messages);

      // Clean up stale tokens — FCM returns an error for invalid tokens
      const staleTokens: string[] = [];
      response.responses.forEach((res, index) => {
        if (
          !res.success &&
          res.error?.code === 'messaging/registration-token-not-registered'
        ) {
          staleTokens.push(devices[index].fcmToken!);
        }
      });

      if (staleTokens.length > 0) {
        await this.prisma.fcmDevice.deleteMany({
          where: { userId: payload.userId, fcmToken: { in: staleTokens } },
        });
        this.logger.log('Removed ' + staleTokens.length + ' stale FCM tokens');
      }

      await this.prisma.notification.create({
        data: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          userId: payload.userId,
          createdAt,
          notificationId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error sending notification to user ${payload.userId}: ${error.message}`,
      );
    }
  }

  /**
   * @description Generates a cryptographically random 32-character hex notification ID.
   *
   * @private
   * @returns {string} Unique notification ID
   */
  private generateNotificationId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async getFirebaseApp(): Promise<FirebaseApp> {
    if (this.firebaseApp) {
      return this.firebaseApp;
    }

    this.firebaseAppPromise ??= this.createFirebaseApp();
    this.firebaseApp = await this.firebaseAppPromise;

    return this.firebaseApp;
  }

  private async createFirebaseApp(): Promise<FirebaseApp> {
    const admin = await import('firebase-admin');
    const app =
      admin.apps.length > 0
        ? admin.app()
        : admin.initializeApp({
            credential: admin.credential.cert(
              JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!) as Parameters<
                typeof admin.credential.cert
              >[0],
            ),
          });

    return app as FirebaseApp;
  }
}
