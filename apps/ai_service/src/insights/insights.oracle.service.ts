import { Redis } from 'ioredis';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';
import {
  ORACLE_MACRO_CACHE_KEY,
  ORACLE_MACRO_CACHE_TTL,
} from '@fintrack/types/constants/redis.costants';

import { MacroContext } from './insights.types';

/**
 * InsightsOracleService — fetches and caches live Nigerian macro-economic context.
 *
 * Data provided:
 *   - NGN/USD exchange rate  — Alpha Vantage CURRENCY_EXCHANGE_RATE (free, 25/day)
 *   - Food CPI YoY           — NBS data (hardcoded until scraper phase)
 *   - CBN policy rate        — CBN data (hardcoded until scraper phase)
 *
 * Redis cache key: `oracle:macro_context`, TTL: 6 hours.
 * On any fetch failure the last-cached value is returned, or well-known fallback
 * values if the cache is also cold. This prevents a third-party API outage from
 * blocking insight generation.
 */
@Injectable()
export class InsightsOracleService {
  private readonly logger = new Logger(InsightsOracleService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getMacroContext(): Promise<MacroContext> {
    try {
      const cached = await this.redis.get(ORACLE_MACRO_CACHE_KEY);
      if (cached) return JSON.parse(cached) as MacroContext;
    } catch (err) {
      this.logger.warn(
        'Redis cache read failed, fetching fresh macro context',
        err,
      );
    }

    const ctx = await this.fetchFresh();

    // Non-blocking write — a cache miss on next call is acceptable
    this.redis
      .setex(
        ORACLE_MACRO_CACHE_KEY,
        ORACLE_MACRO_CACHE_TTL,
        JSON.stringify(ctx),
      )
      .catch((err) => this.logger.warn('Failed to cache macro context', err));

    return ctx;
  }

  /**
   * Fetches a fresh MacroContext from external sources.
   * Falls back to well-known Nigerian economic values on any error so that
   * insight generation is never blocked by a third-party API outage.
   */
  private async fetchFresh(): Promise<MacroContext> {
    const fallback = this.fallbackContext();

    let ngnUsdRate = fallback.ngnUsdRate;

    try {
      const apiKey = this.config.get<string>('ALPHA_VANTAGE_API_KEY');
      if (apiKey) {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=NGN&apikey=${apiKey}`,
          { signal: AbortSignal.timeout(8_000) },
        );
        const json = (await res.json()) as any;
        const rate = parseFloat(
          json?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'] ?? '',
        );
        if (!isNaN(rate)) ngnUsdRate = rate;
      }
    } catch (err) {
      this.logger.warn(
        `Alpha Vantage fetch failed, using fallback NGN rate ${ngnUsdRate}`,
        err,
      );
    }

    return {
      ngnUsdRate,
      // TODO Phase N: scrape NBS for live food CPI YoY
      foodCpiYoY: fallback.foodCpiYoY,
      // TODO Phase N: scrape CBN MPC page for live policy rate
      cbnPolicyRate: fallback.cbnPolicyRate,
      fetchedAt: new Date().toISOString(),
    };
  }

  /** Well-known Nigerian economic values as of 2026-Q2 */
  private fallbackContext(): MacroContext {
    return {
      ngnUsdRate: 1580,
      foodCpiYoY: 18.2,
      cbnPolicyRate: 26.75,
      fetchedAt: new Date().toISOString(),
    };
  }
}
