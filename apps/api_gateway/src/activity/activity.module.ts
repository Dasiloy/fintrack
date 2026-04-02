import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ACTIVITY_NOTIFICATION_QUEUE } from '@fintrack/types/constants/queus.constants';

import { ActivityService } from './activity.service';
import { ActivityProcessor } from './activity.processor';
import { ActivityLogsRealtimeService } from './activity.realtime';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ACTIVITY_NOTIFICATION_QUEUE,
    }),
  ],
  providers: [ActivityLogsRealtimeService, ActivityService, ActivityProcessor],
})
export class ActivityModule {}
