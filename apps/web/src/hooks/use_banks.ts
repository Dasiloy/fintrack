'use client';

import type { NigerianBank, NigerianBankMap } from '@fintrack/types/interfaces/banks';
import { api_client } from '@/lib/trpc_app/api_client';
import { BANK_CACHE_TTL_MS } from '@fintrack/types/constants/bank.constants';

export type { NigerianBank, NigerianBankMap };

/**
 * Returns the full Nigerian bank map keyed by bank code.
 * Data is cached server-side for 24 h and served from a single tRPC query
 * instance via React Query's deduplication — safe to call in multiple components.
 *
 * @example
 * const { bankMap, getBank } = useBanks();
 * const bank = getBank(account.bankId);   // O(1)
 * // bank?.logo  → logo URL
 * // bank?.name  → "Access Bank"
 */
export function useBanks() {
  const { data: bankMap = {}, isLoading } = api_client.banks.getNigerianBanks.useQuery(undefined, {
    staleTime: BANK_CACHE_TTL_MS,
    gcTime: BANK_CACHE_TTL_MS,
  });

  const getBank = (code: string | null | undefined): NigerianBank | undefined => {
    if (!code) return undefined;
    return (bankMap as NigerianBankMap)[code];
  };

  return { bankMap: bankMap as NigerianBankMap, getBank, isLoading };
}
