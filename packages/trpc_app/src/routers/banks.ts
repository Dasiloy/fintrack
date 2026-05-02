import { TRPCError } from '@trpc/server';

import type { NigerianBank, NigerianBankMap } from '@fintrack/types/interfaces/banks';
import { BANK_CACHE_TTL_MS } from '@fintrack/types/constants/bank.constants';

import { createTRPCRouter, protectedProcedure } from '../setup';

let _cache: { data: NigerianBankMap; expiresAt: number } | null = null;

async function fetchBankMap(): Promise<NigerianBankMap> {
  if (_cache && Date.now() < _cache.expiresAt) {
    return _cache.data;
  }

  const response = await fetch('https://nigerianbanks.xyz', {
    headers: { Accept: 'application/json' },
    // 10-second hard timeout — keeps the page load from hanging if the
    // upstream is slow or down.
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Return stale cache rather than failing the page if upstream is down
    if (_cache) return _cache.data;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch Nigerian bank list',
    });
  }

  const banks: NigerianBank[] = await response.json();

  // Key by bank code for O(1) lookup: bankMap['044'] → Access Bank
  const data: NigerianBankMap = Object.fromEntries(banks.map((b) => [b.code, b]));

  _cache = { data, expiresAt: Date.now() + BANK_CACHE_TTL_MS };
  return data;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const banksRouter = createTRPCRouter({
  /**
   * Returns all Nigerian banks as a map keyed by bank code.
   * Result is cached server-side for 24 hours; stale data is served if the
   * upstream is temporarily unavailable.
   *
   * Usage: `bankMap['044']` → `{ name: 'Access Bank', code: '044', logo: '…' }`
   */
  getNigerianBanks: protectedProcedure.query(async () => {
    return fetchBankMap();
  }),
});
