/**
 * One-time backfill — Subscription (FREE default)
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a default FREE/ACTIVE Subscription row for every user whose email
 * has been verified and who has no subscription row yet.
 *
 * Run this immediately after the production DB migration that dropped all
 * existing subscription rows (required to unblock the migration).
 *
 * HOW TO RUN:
 *   pnpm --filter @fintrack/database db:backfill-subscriptions
 *
 * REQUIRED ENV VARS:
 *   DATABASE_URL
 *
 * IDEMPOTENCY:
 *   Safe to run multiple times — users who already have a Subscription row
 *   are skipped via createMany skipDuplicates.
 */

import { prisma } from '../../src/client';

const BATCH_SIZE = 500;

async function main() {
  console.log('\nBackfilling FREE subscriptions for verified users...\n');

  // Fetch all verified users who have no subscription row
  const targets = await prisma.$queryRaw<{ id: string; email: string }[]>`
    SELECT u.id, u.email
    FROM "User" u
    LEFT JOIN "Subscription" s ON u.id = s."userId"
    WHERE u."emailVerified" = true
      AND s."userId" IS NULL
    ORDER BY u."createdAt" ASC
  `;

  console.log(`Found ${targets.length} user(s) without a subscription\n`);

  if (targets.length === 0) {
    console.log('Nothing to do.\n');
    return;
  }

  let created = 0;
  let failed = 0;

  // Process in batches to avoid overwhelming the DB connection pool
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(targets.length / BATCH_SIZE);
    console.log(`  Batch ${batchNum}/${totalBatches} — ${batch.length} rows`);

    try {
      const result = await prisma.subscription.createMany({
        data: batch.map((u) => ({
          userId: u.id,
          plan: 'FREE',
          status: 'ACTIVE',
        })),
        skipDuplicates: true,
      });
      created += result.count;
      console.log(`    ✓ Created ${result.count}`);
    } catch (err) {
      console.error(`    ✗ Batch failed`, err);
      failed += batch.length;
    }
  }

  console.log(`\nDone — ${created} created, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
