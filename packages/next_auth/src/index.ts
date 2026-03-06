import NextAuth, { type NextAuthResult } from 'next-auth';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import { createAuthConfig, type AuthEnv, type AuthHelpers } from './config';

export type { AuthEnv, AuthHelpers };
export { createAuthConfig };

const nextAuth = NextAuth(
  createAuthConfig(
    {
      AUTH_SECRET: process.env.AUTH_SECRET!,
      AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID!,
      AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET!,
      API_GATEWAY_URL: process.env.API_GATEWAY_URL!,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
      JWT_REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_TOKEN_EXPIRATION!,
    },
    { parseJwtExpiration },
  ),
) as NextAuthResult;

export const auth: NextAuthResult['auth'] = nextAuth.auth;
export const handlers: NextAuthResult['handlers'] = nextAuth.handlers;
export const signIn: NextAuthResult['signIn'] = nextAuth.signIn;
export const signOut: NextAuthResult['signOut'] = nextAuth.signOut;
