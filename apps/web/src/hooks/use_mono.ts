'use client';

import type Connect from '@mono.co/connect.js';

import { useCallback, useRef, useState } from 'react';

const key = process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY!;

interface UseMonoConnectOptions {
  onClose?: () => void;
  onError?: (error: unknown) => void;
}

export function useMonoConnect({ onClose, onError }: UseMonoConnectOptions) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const monoRef = useRef<Connect | null>(null);
  // Swapped just before open() so the single instance handles both link and reauth
  const onSuccessRef = useRef<(code: string) => void>(() => {});

  const getMono = useCallback(async () => {
    if (monoRef.current) return monoRef.current;

    const MonoConnect = (await import('@mono.co/connect.js')).default;

    monoRef.current = new MonoConnect({
      key,
      // Delegates to whatever handler was set before open() was called
      onSuccess: ({ code }) => {
        if (code) onSuccessRef.current(code);
      },
      onClose: () => onClose?.(),
      onLoad: () => setScriptLoaded(true),
    });

    return monoRef.current;
  }, [onClose]);

  /**
   * Open the Mono Connect widget for initial bank account linking.
   *
   * @param onSuccess - receives the one-time code to exchange for an account ID
   */
  const linkAccount = useCallback(
    async (onSuccess: (code: string) => void) => {
      try {
        onSuccessRef.current = onSuccess;
        const mono = await getMono();
        mono.setup();
        mono.open();
      } catch (error) {
        onError?.(error);
      }
    },
    [getMono, onError],
  );

  /**
   * Open the Mono Connect widget in reauth mode for a previously linked account.
   *
   * @param accountId - Mono accountId of the account being re-authenticated
   * @param onSuccess - receives the one-time code + accountId to call relinkMonoAccount
   */
  const reauthenticate = useCallback(
    async (accountId: string, onSuccess: (code: string, accountId: string) => void) => {
      try {
        onSuccessRef.current = (code) => onSuccess(code, accountId);
        const mono = await getMono();
        mono.reauthorise(accountId);
        mono.open();
      } catch (error) {
        onError?.(error);
      }
    },
    [getMono, onError],
  );

  return { linkAccount, reauthenticate, scriptLoaded };
}
