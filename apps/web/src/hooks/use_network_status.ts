'use client';

import { useCallback, useEffect, useState } from 'react';
import isOnline from 'is-online';

export function useNetworkStatus() {
  // Optimistic default — immediately verified on mount
  const [online, setOnline] = useState(true);

  const check = useCallback(async () => {
    const result = await isOnline();
    setOnline(result);
  }, []);

  useEffect(() => {
    // Verify on mount
    check();

    // Trust 'offline' events immediately (device disconnected — no need to verify)
    const handleOffline = () => setOnline(false);
    window.addEventListener('offline', handleOffline);

    // Verify 'online' events with is-online (router may be up but no internet)
    const handleOnline = () => check();
    window.addEventListener('online', handleOnline);

    // Periodic background check every 300 s (catches silent failures)
    const interval = setInterval(check, 30_000);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [check]);

  return { online };
}
