import { Redis } from 'ioredis';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';
import {
  ORACLE_MACRO_CACHE_KEY,
  ORACLE_MACRO_CACHE_TTL,
} from '@fintrack/types/constants/redis.costants';
import { FetcherService } from '@fintrack/common/services/fetcher.service';

import { AlphaVantageFxResponse, MacroContext } from './insights.types';

/**
 * InsightsOracleService — serves Nigerian macro-economic context.
 *
 * Data provided:
 *   - NGN/USD exchange rate  — Alpha Vantage CURRENCY_EXCHANGE_RATE (free, 25/day)
 *   - Food CPI YoY           — NBS data (hardcoded until scraper phase)
 *   - CBN policy rate        — CBN data (hardcoded until scraper phase)
 *
 * ## Read vs refresh
 * The live third-party fetch is **decoupled from the request path**. A scheduled
 * `ORACLE_REFRESH_JOB` (hourly) calls `refreshMacroContext()`, which fetches fresh
 * data and writes it to Redis (`oracle:macro_context`, TTL 25h).
 *
 * `getMacroContext()` is **read-through**: it reads the cache and, on a miss or
 * Redis failure, performs a one-off live fetch that also repopulates the cache,
 * so it self-heals rather than serving stale static values. Because the cron keeps
 * the cache warm, this live path only triggers on a cold start (fresh deploy or
 * cache eviction) — there is no per-chat fetching in steady state.
 */
@Injectable()
export class InsightsOracleService {
  private readonly logger = new Logger(InsightsOracleService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly fetcher: FetcherService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Read-through macro context for the request path. Returns the cron-populated
   * cached value when present. On a cache miss or Redis failure it performs a
   * one-off live fetch (which also repopulates the cache) rather than serving
   * stale static values — so a cold cache self-heals. In steady state the cron
   * keeps the cache warm, so this rarely fetches live.
   */
  async getMacroContext(): Promise<MacroContext> {
    try {
      const cached = await this.redis.get(ORACLE_MACRO_CACHE_KEY);
      if (cached) return JSON.parse(cached) as MacroContext;
    } catch (err) {
      this.logger.warn('Redis macro context read failed', err);
    }

    // Cache cold (cron has not run yet, or Redis read failed) — fetch live and
    // repopulate the cache. refreshMacroContext never throws: fetchFresh applies
    // per-field fallbacks if the external API is unavailable.
    this.logger.warn('Macro context cache miss — fetching live to self-heal');
    return this.refreshMacroContext();
  }

  /**
   * Fetches fresh macro context from external sources and writes it to Redis.
   * Invoked only by the scheduled `ORACLE_REFRESH_JOB` — never on the request path.
   */
  async refreshMacroContext(): Promise<MacroContext> {
    const ctx = await this.fetchFresh();

    try {
      await this.redis.setex(
        ORACLE_MACRO_CACHE_KEY,
        ORACLE_MACRO_CACHE_TTL,
        JSON.stringify(ctx),
      );
    } catch (err) {
      this.logger.warn('Failed to cache refreshed macro context', err);
    }

    return ctx;
  }

  /**
   * Fetches a fresh MacroContext from external sources.
   * Falls back to well-known Nigerian economic values on any error so that
   * insight generation is never blocked by a third-party API outage.
   */
  private async fetchFresh(): Promise<MacroContext> {
    return {
      ngnUsdRate: await this.fetchNgnUsdRate(),
      // TODO Phase N: scrape NBS for live food CPI YoY
      foodCpiYoY: null,
      // TODO Phase N: scrape CBN MPC page for live policy rate
      cbnPolicyRate: null,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetches the live USD/NGN rate via the shared FetcherService.
   * Returns null when the API key is absent, the request fails, or the response
   * is unparseable — never throws and never substitutes a hardcoded value.
   */
  private async fetchNgnUsdRate(): Promise<number | null> {
    const apiKey = this.config.get<string>('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) return null;

    try {
      const { data } = await this.fetcher.get<AlphaVantageFxResponse>(
        'https://www.alphavantage.co/query',
        {
          params: {
            function: 'CURRENCY_EXCHANGE_RATE',
            from_currency: 'USD',
            to_currency: 'NGN',
            apikey: apiKey,
          },
          timeoutMs: 8_000,
        },
      );

      const rate = parseFloat(
        data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'] ?? '',
      );
      return isNaN(rate) ? null : rate;
    } catch (err) {
      this.logger.warn('Alpha Vantage NGN rate fetch failed', err);
      return null;
    }
  }
}
