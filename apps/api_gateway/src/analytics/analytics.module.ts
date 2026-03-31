import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ANALYTICS_NOTIFICATION_QUEUE } from '@fintrack/types/constants/queus.constants';

import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from './analytics.processor';
import { AnalyticsRealtimeService } from './analytics.realtime';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ANALYTICS_NOTIFICATION_QUEUE,
    }),
  ],
  providers: [AnalyticsService, AnalyticsRealtimeService, AnalyticsProcessor],
})
export class AnalyticsModule {}
