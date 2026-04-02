import { Injectable, Logger } from '@nestjs/common';

import { ActivityNotificationPayload } from '@fintrack/types/interfaces/finance';

import { ActivityLogsRealtimeService } from './activity.realtime';
import { PrismaService } from '@fintrack/database/service';

/**
 * ActivityService.
 */
@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private readonly activityLogsRealtimeService: ActivityLogsRealtimeService,
    private readonly prismaService: PrismaService,
  ) {}

  async notifyActivity(payload: ActivityNotificationPayload): Promise<void> {
    this.activityLogsRealtimeService.notifyActivity(payload);
    await this.prismaService.activityLogs.create({
      data: {
        ...payload,
      },
    });
  }
}
