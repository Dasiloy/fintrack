import 'server-only';

import { env } from '@/env';
import { initAuth } from '@fintrack/next_auth';
import { parseJwtExpiration } from '@fintrack/utils/jwt';

/**
 * Initialize NextAuth using the shared package
 */
const { auth, handlers, signIn, signOut } = initAuth(
  {
    AUTH_SECRET: env.AUTH_SECRET,
    AUTH_GOOGLE_ID: env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: env.AUTH_GOOGLE_SECRET,
    API_GATEWAY_URL: env.API_GATEWAY_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    JWT_ACCESS_TOKEN_EXPIRATION: env.JWT_ACCESS_TOKEN_EXPIRATION,
  },
  {
    parseJwtExpiration,
  },
);

export { auth, handlers, signIn, signOut };
