import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/index.js';
import { normalizePostgresConnectionString } from './connection_url.js';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: normalizePostgresConnectionString(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.DB_POOL_MAX ?? '1', 10),
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 60000,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
