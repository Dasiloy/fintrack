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
 * @description Persists activity log entries and fans them out to connected WebSocket clients in real time.
 *
 * ## Responsibilities
 * - Writing ActivityLogs records to the database after key metric mutations
 * - Forwarding activity payloads to the ActivityLogsRealtimeService for live delivery
 *
 * @class ActivityService
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
   * @description Returns the 20 most recent activity log entries for a user, ordered newest-first.
   *
   * @async
   * @public
   * @param {string} userId The ID of the user whose logs to fetch
   * @returns {Promise<ActivityLogs[]>} Up to 20 activity log records
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
