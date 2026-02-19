'use client';

import { useState } from 'react';

import SuperJSON from 'superjson';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchStreamLink, loggerLink } from '@trpc/client';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';

import { api_client } from '@/lib/trpc_app/api_client';
import { type AppRouter } from '@fintrack/trpc_app';
import { createQueryClient } from '@fintrack/react_query';

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api_client.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + '/api/trpc',
          headers: () => {
            const headers = new Headers();
            headers.set('x-trpc-source', 'nextjs-react');
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api_client.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api_client.Provider>
    </QueryClientProvider>
  );
}

const getQueryClient = () => {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }
  return ((globalThis as any).appQueryClient ??= createQueryClient());
};

function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
