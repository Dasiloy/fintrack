/**
 * One-time backfill — AdvisorSetting (all scopes granted)
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a default AdvisorSetting row for every user that does not already have
 * one. New users get this row at signup; this script provisions it for accounts
 * created before advisor settings existed, so the advisor can always assume a
 * row is present rather than creating one lazily.
 *
 * `grantedScopes` and `enabled` are left to their schema defaults (all scopes
 * granted, enabled), so only `userId` is supplied.
 *
 * HOW TO RUN:
 *   pnpm --filter @fintrack/database db:backfill-advisor-settings
 *
 * REQUIRED ENV VARS:
 *   DATABASE_URL
 *
 * IDEMPOTENCY:
 *   Safe to run multiple times — users who already have an AdvisorSetting row
 *   are skipped via createMany skipDuplicates.
 */

import { prisma } from '../../src/client';

const BATCH_SIZE = 500;

async function main() {
  console.log('\nBackfilling AdvisorSetting rows for users without one...\n');

  const targets = await prisma.$queryRaw<{ id: string }[]>`
    SELECT u.id
    FROM "User" u
    LEFT JOIN "AdvisorSetting" a ON u.id = a."userId"
    WHERE a."userId" IS NULL
    ORDER BY u."createdAt" ASC
  `;

  console.log(`Found ${targets.length} user(s) without an advisor setting\n`);

  if (targets.length === 0) {
    console.log('Nothing to do.\n');
    return;
  }

  let created = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(targets.length / BATCH_SIZE);
    console.log(`  Batch ${batchNum}/${totalBatches} — ${batch.length} rows`);

    try {
      const result = await prisma.advisorSetting.createMany({
        data: batch.map((u) => ({ userId: u.id })),
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
