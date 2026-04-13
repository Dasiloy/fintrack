import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/index.js';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};
const databaseCaCertificate = process.env.DATABASE_CA_CERTIFICATE;
if (!databaseCaCertificate) {
  throw new Error('DATABASE_CA_CERTIFICATE is not set');
}

const sslRootCert = Buffer.from(databaseCaCertificate, 'base64').toString('utf-8');
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false, ca: sslRootCert },
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
