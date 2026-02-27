import isOnline from 'is-online';
import { TRPCClientError, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import type { AppRouter } from '@fintrack/trpc_app';
import { INTERNET_CONNECTION_ERROR } from '@fintrack/types/constants/network.constants';

/**
 * tRPC link that runs `isOnline()` before every operation.
 * Throws a typed TRPCClientError immediately if offline.
 *
 * This means:
 *  - Client components: error.message === 'No internet connection.'
 *  - RSC: throws → caught by nearest error boundary
 */
export const networkCheckLink =
  (): TRPCLink<AppRouter> =>
  () =>
  ({ next, op }) => {
    return observable((observer) => {
      let cancelled = false;
      let sub: { unsubscribe(): void } | undefined;

      isOnline().then((connected) => {
        if (cancelled) return;

        if (!connected) {
          observer.error(new TRPCClientError(INTERNET_CONNECTION_ERROR));
          return;
        }

        sub = next(op).subscribe(observer);
      });

      return () => {
        cancelled = true;
        sub?.unsubscribe();
      };
    });
  };
