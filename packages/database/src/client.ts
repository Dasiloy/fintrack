import 'dotenv/config';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/index.js';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const sslRootCert = join(process.cwd(), '..', '..', 'ca.pem');
const adapter = new PrismaPg({
  connectionString: `${process.env.DATABASE_URL}?sslmode=verify-full&sslrootcert=${sslRootCert}`,
  ssl: { rejectUnauthorized: false },
  max: 8,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
