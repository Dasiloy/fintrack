import isOnline from 'is-online';
import { TRPCClientError, type TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import type { AppRouter } from '@fintrack/trpc_app';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { INTERNET_CONNECTION_ERROR } from '@fintrack/types/constants/network.constants';

/**
 * tRPC link that catches UNAUTHORIZED (401) errors, calls the refresh route,
 * then retries the operation once. On failed refresh, redirects to login.
 * After refresh the cookie is updated, so getSession() in the headers function
 * of httpBatchStreamLink will return the new access token on retry.
 */
export const authRetryLink =
  (): TRPCLink<AppRouter> =>
  () =>
  ({ next, op }) =>
    observable((observer) => {
      let cancelled = false;
      let currentSub: { unsubscribe(): void } | undefined;

      const subscribe = (retried = false) => {
        currentSub = next(op).subscribe({
          next: observer.next.bind(observer),
          error: async (err) => {
            if (
              !cancelled &&
              !retried &&
              err instanceof TRPCClientError &&
              err.data?.httpStatus === 401
            ) {
              const res = await fetch('/api/proxy-auth/refresh', { method: 'POST' });
              if (!res.ok) {
                if (typeof window !== 'undefined') {
                  window.location.href = AUTH_ROUTES.LOGIN;
                }
                observer.error(err);
                return;
              }
              // Cookie updated — retry; getSession() in headers will pick up new token
              subscribe(true);
            } else {
              observer.error(err);
            }
          },
          complete: observer.complete.bind(observer),
        });
      };

      subscribe();
      return () => {
        cancelled = true;
        currentSub?.unsubscribe();
      };
    });

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
