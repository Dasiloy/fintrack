import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET: z.string(),
    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    DATABASE_CA_CERTIFICATE: z.string(),
    API_GATEWAY_URL: z.string().url(),
    JWT_OTP_TOKEN_EXPIRATION: z.string().default('60m'),
    JWT_ACCESS_TOKEN_EXPIRATION: z.string().default('15m'),
    JWT_REFRESH_TOKEN_EXPIRATION: z.string().default('30d'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DEVICE_ID_COOKIE_MAX_AGE: z.string().default('31536000'),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
    NEXT_PUBLIC_DEVICE_ID_COOKIE_NAME: z.string(),
    NEXT_PUBLIC_API_GATEWAY_URL: z.string().url(),
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: z
      .string()
      .default(
        'BNEZGE8Kuk7mOmkmtdT2hOR71dzjbwz6X7WRLMC3q7zDUOgGZPDlIrg_ofYonUHnviKgcnZUOuawl7UhjlDT5jM',
      ),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_CA_CERTIFICATE: process.env.DATABASE_CA_CERTIFICATE,
    API_GATEWAY_URL: process.env.API_GATEWAY_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_DEVICE_ID_COOKIE_NAME: process.env.NEXT_PUBLIC_DEVICE_ID_COOKIE_NAME,
    JWT_OTP_TOKEN_EXPIRATION: process.env.JWT_OTP_TOKEN_EXPIRATION,
    JWT_ACCESS_TOKEN_EXPIRATION: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
    JWT_REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_TOKEN_EXPIRATION,
    NODE_ENV: process.env.NODE_ENV,
    DEVICE_ID_COOKIE_MAX_AGE: process.env.DEVICE_ID_COOKIE_MAX_AGE ?? '31536000',
    NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
