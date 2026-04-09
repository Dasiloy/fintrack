import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { ActivityLogsRealtimeService } from './activity.realtime';
import { PrismaService } from '@fintrack/database/service';
import { ActivityLogs } from '@fintrack/database/types';

/**
 * ActivityService.
 */
@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @Inject(forwardRef(() => ActivityLogsRealtimeService))
    private readonly activityLogsRealtimeService: ActivityLogsRealtimeService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * @description Sends Activity Logs to the frontend after key metric creation
   *
   * @public
   * @param {ActivityNotificationPayload} payload
   * @returns {Promise<void>}
   */
  async notifyActivity(payload: ActivityLogs): Promise<void> {
    this.activityLogsRealtimeService.notifyActivity(payload);
    await this.prismaService.activityLogs.create({
      data: {
        ...(payload as any),
      },
    });
  }

  /**
   *
   */
  async getActivityLogs(userId: string): Promise<ActivityLogs[]> {
    try {
      return await this.prismaService.activityLogs.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });
    } catch (error) {
      throw new InternalServerErrorException('an error occured');
    }
  }
}
