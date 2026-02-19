import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@fintrack/trpc_app';

export const api_client = createTRPCReact<AppRouter>();
