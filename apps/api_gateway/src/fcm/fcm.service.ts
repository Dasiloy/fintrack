import * as crypto from 'crypto';
import * as admin from 'firebase-admin';

import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, Inject } from '@nestjs/common';

import { PrismaService } from '@fintrack/database/service';
import { FCM_ADMIN } from '@fintrack/types/constants/fcm.constants';
import { FcmNotificationPayload } from '@fintrack/types/interfaces/finance';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(FCM_ADMIN) private readonly admin: admin.app.App,
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
      const response = await this.admin.messaging().sendEach(messages);

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

  private generateNotificationId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
