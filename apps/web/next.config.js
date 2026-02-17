/**
 * Load environment variables with expansion support FIRST
 * This must happen before importing env.js
 */
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load and expand root .env (two levels up from apps/web)
const rootEnv = config({ path: join(__dirname, "..", "..", ".env") });
expand(rootEnv);

// Load and expand local .env if it exists (for overrides)
const localEnv = config({ path: join(__dirname, ".env") });
expand(localEnv);

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 *
 * IMPORTANT: This import happens AFTER dotenv loading above
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const nextConfig = {};

export default nextConfig;
