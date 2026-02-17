import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

/**
 * Load and expand environment variables from root and local .env files
 *
 * Call this at the very top of your main.ts file, before any other imports
 * that depend on environment variables (especially NestJS modules).
 *
 * @example
 * ```typescript
 * import { loadEnv } from '@fintrack/common/env';
 *
 * // CRITICAL: Call FIRST, before any other imports
 * loadEnv();
 *
 * // Now safe to import modules that need env vars
 * import { NestFactory } from '@nestjs/core';
 * import { AppModule } from './app.module';
 * ```
 */
export function loadEnv(): void {
  // OPTIMIZATION: In production, environment variables are typically injected by the platform
  // (Docker, Kubernetes, Vercel, etc.) so we don't need to load/expand .env files.
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Load root .env (two levels up from packages/common)
  const rootEnv = config({ path: '../../.env' });
  expand(rootEnv);

  // Load local .env (if exists)
  const localEnv = config({ path: '.env' });
  expand(localEnv);
}
