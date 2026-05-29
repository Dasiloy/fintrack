/**
 * Load environment variables with expansion support FIRST
 * This must happen before importing env.js
 */
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load and expand root .env (two levels up from apps/web)
const rootEnv = config({ path: join(__dirname, '..', '..', '.env') });
expand(rootEnv);

// Load and expand local .env if it exists (for overrides)
const localEnv = config({ path: join(__dirname, '.env') });
expand(localEnv);

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 *
 * IMPORTANT: This import happens AFTER dotenv loading above
 */
await import('./src/env.js');

/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ['@fintrack/ui'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nigerianbanks.xyz',
        pathname: '/logo/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // HTML documents must never be served from cache after a deployment —
        // stale HTML references old chunk hashes that 404, causing a reload loop.
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // Next.js immutable static assets are content-addressed (hash in filename)
        // and safe to cache forever in the browser.
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
