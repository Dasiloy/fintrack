'use client';

import { useCallback, useRef, useState } from 'react';

interface RegionCheckResult {
  country: string;
  isNigeria: boolean;
}

/**
 * On-demand country check — called only when the user attempts to upgrade.
 * Caches the result in a ref so repeated clicks within a session don't
 * make multiple round-trips.
 *
 * On network failure, blocks the flow (returns isNigeria: false) to avoid
 * accidentally bypassing the region gate.
 */
export function useRegionCheck() {
  const [isPending, setIsPending] = useState(false);
  const cache = useRef<RegionCheckResult | null>(null);

  const checkRegion = useCallback(async (): Promise<RegionCheckResult> => {
    if (cache.current) return cache.current;

    setIsPending(true);
    try {
      const res = await fetch('/api/region');
      if (!res.ok) throw new Error('region check failed');
      const data: { country: string } = await res.json();
      const result: RegionCheckResult = {
        country: data.country,
        isNigeria: data.country === 'NG',
      };
      cache.current = result;
      return result;
    } catch {
      return { country: '', isNigeria: false };
    } finally {
      setIsPending(false);
    }
  }, []);

  return { checkRegion, isPending };
}
