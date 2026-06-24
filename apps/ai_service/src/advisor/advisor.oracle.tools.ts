import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Redis } from 'ioredis';

import { ORACLE_MACRO_CACHE_KEY } from '@fintrack/types/constants/redis.costants';
import { MacroContext } from '@fintrack/types/interfaces/insights';

/**
 * Advisor oracle tools — public Nigerian macro indicators.
 *
 * Unlike the Postgres tools, these read no user data, so they carry NO scope and
 * are never gated. Crucially they are **pure cache reads**: the value is fetched
 * and refreshed hourly by the scheduler's oracle job (Phase 0b) and stored at
 * `oracle:macro_context`. The advisor never makes a live third-party call on the
 * request path — it only reads what the cron has already cached.
 */

/** Formats a cached macro context, omitting any field with no live value. */
function formatMarketContext(ctx: MacroContext): string {
  const parts: string[] = [];
  if (ctx.ngnUsdRate != null) {
    parts.push(`USD/NGN: ₦${ctx.ngnUsdRate.toLocaleString()}`);
  }
  if (ctx.foodCpiYoY != null) {
    parts.push(`Food inflation (CPI, YoY): ${ctx.foodCpiYoY}%`);
  }
  if (ctx.cbnPolicyRate != null) {
    parts.push(`CBN policy rate: ${ctx.cbnPolicyRate}%`);
  }

  if (!parts.length) return 'Live market data is not available right now.';

  const asOf = ctx.fetchedAt ? ` (as of ${ctx.fetchedAt})` : '';
  return `Nigerian market context${asOf}:\n${parts.map((p) => `  ${p}`).join('\n')}`;
}

/**
 * Builds the oracle toolset, binding the shared Redis client. Pass the result
 * alongside the Postgres tools to both `bindTools` and the `ToolNode`.
 */
export function createOracleTools(redis: Redis) {
  const getMarketContext = tool(
    async () => {
      try {
        const cached = await redis.get(ORACLE_MACRO_CACHE_KEY);
        if (!cached) return 'Live market data is not available right now.';
        return formatMarketContext(JSON.parse(cached) as MacroContext);
      } catch {
        return 'Live market data is not available right now.';
      }
    },
    {
      name: 'get_market_context',
      description:
        'Get current Nigerian macro indicators: the USD/NGN exchange rate, food ' +
        'inflation (CPI year-over-year), and the CBN policy rate. Use when the user ' +
        'asks about the dollar rate, inflation, or interest rates. This is public ' +
        'data and always available — no permission needed.',
      schema: z.object({}),
    },
  );

  return [getMarketContext];
}
