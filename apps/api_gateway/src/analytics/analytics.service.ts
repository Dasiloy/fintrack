import { Injectable } from '@nestjs/common';
import { AnalyticsRealtimeService } from './analytics.realtime';
import { AnalyticsNotificationPayload } from '@fintrack/types/interfaces/finance';

/**
 * AnalyticsService.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticsRealtimeService: AnalyticsRealtimeService,
  ) {}

  async notifyAnalytics(payload: AnalyticsNotificationPayload): Promise<void> {
    this.analyticsRealtimeService.notifyAnalytics(payload);
  }
}
