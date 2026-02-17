// Load environment variables from root .env with variable expansion support
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { join } from 'path';

// Load and expand root .env (two levels up from packages/database)
const rootEnv = config({ path: join(__dirname, '..', '..', '.env') });
expand(rootEnv);

// Also load and expand local .env if it exists (for overrides)
const localEnv = config({ path: join(__dirname, '.env') });
expand(localEnv);

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
