import Redis from 'ioredis';

import { forwardRef, Inject, Injectable } from '@nestjs/common';

import {
  AnalyticsNotificationPayload,
  JoinAnalyticsRoomPayload,
} from '@fintrack/types/interfaces/finance';
import {
  REDIS_CLIENT,
  USER_CACHE_TTL,
} from '@fintrack/types/constants/redis.costants';

import { AnalyticsRealtimeService } from './analytics.realtime';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(forwardRef(() => AnalyticsRealtimeService))
    private readonly analyticsRealtimeService: AnalyticsRealtimeService,
  ) {}

  /**
   * @description Sends realtime notification update
   * This is triggered by key metrics
   *
   * @async
   * @public
   * @param {AnalyticsNotificationPayload} payload
   * @returns {Promise<void>}
   */
  async notifyAnalytics(payload: AnalyticsNotificationPayload): Promise<void> {
    // we will do some compuation here based on what has updated, has transaction be added? => as the case may be.

    // if we have a cache , update the cache in memory,
    const cached = await this.redis.get(`analytics:${payload.userId}`);
    if (cached) {
      // update the cache in memory and automatically reset ttl
      await this.redis.setex(
        `analytics:${payload.userId}`,
        USER_CACHE_TTL,
        JSON.stringify({}),
      );
    }
    // if not, no big deal => just proceed and send users the notification
    // in a few minuites, cache will reset and once the user refreshes, the cache will get updated
    this.analyticsRealtimeService.notifyAnalytics(payload);
  }

  /**
   * @description SGet baseline Analytics data
   *
   *
   * @async
   * @public
   * @param {AnalyticsNotificationPayload} payload
   * @returns {Promise<any>}
   */
  async getAnalytics(userId, payload: JoinAnalyticsRoomPayload): Promise<any> {
    // check first if we have that data in redis
    const cached = await this.redis.get(`analytics:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // if not get realtime, computation intensive

    // cache in redis
    await this.redis.setex(
      `analytics:${userId}`,
      USER_CACHE_TTL,
      JSON.stringify({}),
    );
    return {};
  }
}
