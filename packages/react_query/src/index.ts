import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';
import SuperJSON from 'superjson';
import { INTERNET_CONNECTION_ERROR } from '@fintrack/types/constants/network.constants';

/**
 * Retry predicate for both tRPC and raw React Query.
 * - Skip retry for the networkCheckLink "no internet" error (user-facing, not transient)
 * - Skip retry for 4xx client errors (except 408 Request Timeout)
 * - Retry up to 3× for 5xx server errors and transient network failures
 */
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 3) return false;

  // Don't retry our explicit "no internet" error
  if (error instanceof Error && error.message === INTERNET_CONNECTION_ERROR) return false;

  // tRPC errors expose httpStatus on error.data
  const status = (error as any)?.data?.httpStatus ?? (error as any)?.response?.status;

  if (status && status >= 400 && status < 500 && status !== 408) return false;

  return true;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        networkMode: 'offlineFirst', // serve cached data offline; refetch on reconnect
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 60_000), // 1s → 2s → 4s
      },
      mutations: {
        // Fail immediately offline — user sees error and retries explicitly.
        // Safer than queuing for financial transactions.
        networkMode: 'always',
        retry: false,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
