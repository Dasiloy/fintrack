import NextAuth, { type NextAuthResult } from 'next-auth';
import { cache } from 'react';
import { createAuthConfig, type AuthEnv, type AuthHelpers } from './config';

export type { AuthEnv, AuthHelpers };

/**
 * Singleton pattern for NextAuth to handle HMR in development.
 */
const globalForAuth = globalThis as unknown as {
  authResult?: NextAuthResult;
};

/**
 * Shared 'auth' function that can be imported by other packages (like @fintrack/trpc_app).
 * It delegates to the singleton instance initialized by the host application.
 */
export const auth: NextAuthResult['auth'] = (...args: any[]) => {
  const instance = globalForAuth.authResult?.auth;
  if (!instance) {
    throw new Error(
      'NextAuth not initialized. Ensure you call "initAuth" in your main application (e.g., apps/web) before using shared auth imports.',
    );
  }
  // @ts-expect-error - args spreads are hard to type for NextAuthResult['auth']
  return instance(...args);
};

/**
 * Initialize NextAuth for the host application and hydrate the global singleton.
 */
export const initAuth = (env: AuthEnv, helpers: AuthHelpers): NextAuthResult => {
  // Return existing instance in dev if already initialized to prevent multiple instances
  if (globalForAuth.authResult && process.env.NODE_ENV !== 'production') {
    return globalForAuth.authResult;
  }

  const result = NextAuth(createAuthConfig(env, helpers));

  const authResult: NextAuthResult = {
    ...result,
    auth: cache(result.auth),
    handlers: result.handlers,
    signIn: result.signIn,
    signOut: result.signOut,
  };

  globalForAuth.authResult = authResult;

  return authResult;
};
