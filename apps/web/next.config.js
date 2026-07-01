import 'dotenv/config';

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
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
};

export default nextConfig;
