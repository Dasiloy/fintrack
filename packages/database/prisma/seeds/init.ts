/**
 * FinTrack Database Seed
 * ─────────────────────────────────────────────────────────────────────────────
 * Populates a user account with realistic demo data for developer onboarding.
 *
 * QUICK START:
 *   1. Run migrations:   pnpm --filter @fintrack/database db:migrate
 *   2. Generate types:   pnpm --filter @fintrack/database db:generate
 *   3. Sign up:          http://localhost:3000/signup
 *   4. Add to .env:      SEED_USER_EMAIL=your@email.com
 *   5. Run seed:         pnpm --filter @fintrack/database db:seed
 *
 * REQUIRED ENV VAR:
 *   SEED_USER_EMAIL — the email address of the account to seed.
 *   The seed will stop immediately if this is not set.
 *
 * WHAT GETS SEEDED:
 *   ✓ 10 system categories  — Food, Transport, Bills, Entertainment, etc.
 *   ✓ 68 merchants          — Nigerian brands used for AI auto-classification
 *   ✓ 42 transactions       — income & expenses across Nov 2025 – May 2026
 *   ✓  6 budgets            — monthly/quarterly/yearly with limit-change history
 *   ✓  5 goals              — ACTIVE, ON_HOLD, and COMPLETED with contributions
 *   ✓ 10 recurring items    — salary, rent, subscriptions (all frequencies)
 *   ✓ 20 activity logs      — timeline of key events across all features
 *   ✓  3 splits             — OPEN / PARTIALLY_SETTLED / SETTLED with participants & settlements
 *
 * IDEMPOTENCY:
 *   Safe to re-run. Each section checks for existing records and skips if
 *   the data already exists for the target user.
 *
 * JSON FIXTURES (packages/database/prisma/json/):
 *   categories.json    — system categories (slug-keyed, shared across users)
 *   merchants.json     — merchant registry for AI classification
 *   transactions.json  — 42 transactions with categorySlug references
 *   budgets.json       — 6 budgets with full BudgetHistory entries
 *   goals.json         — 5 goals with embedded contribution arrays
 *   recurring_items.json — 10 recurring items (bills + income)
 *   splits.json        — 3 splits with participants and settlements
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { openSync, readFileSync } from 'fs';
import { join } from 'path';
import { ReadStream } from 'tty';
import { fileURLToPath } from 'url';
import { prisma } from '../../src/client';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─── Section registry ─────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 1, label: 'System categories', hint: '10 categories for AI classification' },
  { id: 2, label: 'Merchant registry', hint: '69 merchants for auto-classification' },
  { id: 3, label: 'Budgets', hint: '6 budgets with limit-change history' },
  { id: 4, label: 'Transactions', hint: '42 transactions, Nov 2025 – May 2026' },
  { id: 5, label: 'Goals', hint: '5 goals with contributions' },
  { id: 6, label: 'Recurring items', hint: '10 recurring items (bills + income)' },
  { id: 7, label: 'Activity logs', hint: '20 activity log entries' },
  { id: 8, label: 'Splits', hint: '3 splits with participants & settlements' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

// ─── Upfront section selector ─────────────────────────────────────────────────
// Shows a numbered menu once, before any seeding begins. Returns the set of
// section IDs the user chose. Requires an interactive terminal — exits
// immediately in CI or piped environments to prevent accidental data mutation.
function selectSections(): Promise<Set<SectionId>> {
  // Open /dev/tty directly so the menu works even when stdin is piped.
  // Falls back to an error if no controlling terminal exists (true CI / headless environments).
  let tty: ReadStream;
  try {
    tty = new ReadStream(openSync('/dev/tty', 'r+'));
  } catch {
    console.error('\n❌  Seeding requires an interactive terminal.');
    console.error('    Run the seed locally, not in CI or a piped context.\n');
    process.exit(1);
  }

  const DIM = '\x1b[2m',
    RESET = '\x1b[0m',
    CYAN = '\x1b[36m',
    BOLD = '\x1b[1m';
  const CLEAR = '\x1b[2K\r';

  const checked = new Set(SECTIONS.map((s) => s.id as SectionId)); // all on by default
  const labelWidth = Math.max(...SECTIONS.map((s) => s.label.length));
  let cursor = 0;

  function renderLines(): string[] {
    return SECTIONS.map((s, i) => {
      const on = checked.has(s.id);
      const focused = i === cursor;
      const pointer = focused ? `${CYAN}›${RESET}` : ' ';
      const box = on ? `${CYAN}◉${RESET}` : `${DIM}◯${RESET}`;
      const label = focused ? `${BOLD}${s.label}${RESET}` : s.label;
      return `  ${pointer} ${box}  ${label.padEnd(labelWidth)}   ${DIM}${s.hint}${RESET}`;
    });
  }

  return new Promise((resolve) => {
    process.stdout.write(
      `\n  Select data to seed  ${DIM}↑↓ navigate · Space toggle · Enter confirm${RESET}\n\n`,
    );
    process.stdout.write(renderLines().join('\n') + '\n');

    tty.setRawMode(true);
    tty.resume();
    tty.setEncoding('utf8');

    tty.on('data', function onKey(key: string) {
      if (key === '\x03') {
        // Ctrl+C
        tty.setRawMode(false);
        tty.destroy();
        process.stdout.write('\n');
        process.exit(0);
      } else if (key === '\x1b[A') {
        // ↑
        cursor = (cursor - 1 + SECTIONS.length) % SECTIONS.length;
      } else if (key === '\x1b[B') {
        // ↓
        cursor = (cursor + 1) % SECTIONS.length;
      } else if (key === ' ') {
        // Space — toggle
        const id = SECTIONS[cursor]!.id;
        if (checked.has(id)) checked.delete(id);
        else checked.add(id);
      } else if (key === '\r' || key === '\n') {
        // Enter — confirm
        tty.setRawMode(false);
        tty.destroy();
        process.stdout.write('\n');
        resolve(checked.size > 0 ? checked : new Set(SECTIONS.map((s) => s.id as SectionId)));
        return;
      }

      // Redraw: move up N lines and repaint in place
      process.stdout.write(`\x1b[${SECTIONS.length}A`);
      for (const line of renderLines()) process.stdout.write(CLEAR + line + '\n');
    });
  });
}

// ─── JSON fixture loader ──────────────────────────────────────────────────────
function loadFixture<T>(filename: string): T {
  return JSON.parse(readFileSync(join(__dirname, '..', 'json', filename), 'utf-8')) as T;
}

// ─── Fixture types ────────────────────────────────────────────────────────────

interface CategoryFixture {
  name: string;
  slug: string;
  color: string;
  description: string;
  icon: string;
  tags: string[];
}

interface MerchantFixture {
  name: string;
  aliases: string[];
  categoryHint: string;
}

interface TransactionFixture {
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  categorySlug: string;
  description: string;
  merchant: string | null;
  source: 'MANUAL' | 'RECURRING' | 'BANK' | 'OCR' | 'SPLIT';
  notes: string | null;
}

interface BudgetHistoryEntry {
  limit: number;
  startDate: string;
  endDate: string | null;
}

interface BudgetFixture {
  name: string;
  categorySlug: string;
  period: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY' | 'YEARLY';
  description: string;
  alertThreshold: number;
  history: BudgetHistoryEntry[];
}

interface ContributionFixture {
  amount: number;
  date: string;
  description: string;
}

interface GoalFixture {
  name: string;
  targetAmount: number;
  targetDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  contributions: ContributionFixture[];
}

interface RecurringItemFixture {
  name: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  categorySlug: string;
  startDate: string;
  nextRunAt: string;
  lastRunAt: string | null;
  isActive: boolean;
  description: string | null;
  merchant: string | null;
  notes: string | null;
}

interface SplitParticipantFixture {
  name: string;
  email: string;
  amount: number;
}

interface SplitSettlementFixture {
  participantIndex: number;
  paidAmount: number;
  paidAt: string;
}

interface SplitFixture {
  name: string;
  amount: number;
  status: 'OPEN' | 'PARTIALLY_SETTLED' | 'SETTLED';
  createdAt: string;
  participants: SplitParticipantFixture[];
  settlements: SplitSettlementFixture[];
}

// ─── Source ID generator ──────────────────────────────────────────────────────
// Format mirrors the finance service convention: TXN-YYMMDD-XXXXXX
let _idCounter = 1;
function genSourceId(prefix: 'TXN' | 'REC', date: Date): string {
  const y = String(date.getFullYear()).slice(2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(_idCounter++).padStart(6, '0');
  return `${prefix}-${y}${m}${d}-${seq}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await prisma.$connect();

  // ── Require SEED_USER_EMAIL ───────────────────────────────────────────────
  //
  // This is mandatory. The seed does not auto-discover users — it targets the
  // exact account you specify so there's no risk of polluting the wrong user.
  //
  const seedEmail = process.env['SEED_USER_EMAIL'];

  if (!seedEmail) {
    console.error('\n❌  SEED_USER_EMAIL is not set.');
    console.error('    Add it to your .env file and re-run:\n');
    console.error('    SEED_USER_EMAIL=your@email.com\n');
    process.exit(1);
  }

  // ── Locate the target account ─────────────────────────────────────────────
  console.log(`\n👤 Looking up user: ${seedEmail}`);

  const user = await prisma.user.findUnique({ where: { email: seedEmail } });

  if (!user) {
    console.error(`\n❌  No account found for "${seedEmail}".`);
    console.error('    Sign up at http://localhost:3000/signup first, then re-run the seed.\n');
    process.exit(1);
  }

  console.log(`   ✓ Found: ${user.firstName} ${user.lastName}`);
  const userId = user.id;

  // ── Prompt for sections upfront ───────────────────────────────────────────
  const selected = await selectSections();
  const run = (id: SectionId) => selected.has(id);

  // ── 1. System categories ──────────────────────────────────────────────────
  //
  // Shared across all users (isSystem: true, no userId). Used by transactions,
  // budgets, and recurring items for classification. Each category carries a
  // tags array that powers the AI auto-classification engine.
  //
  console.log('\n📦 System categories');
  if (run(1)) {
    const categoryFixtures = loadFixture<CategoryFixture[]>('categories.json');
    const { count: categoryCount } = await prisma.category.createMany({
      data: categoryFixtures.map((c) => ({ ...c, isSystem: true })),
      skipDuplicates: true,
    });
    console.log(
      `   ✓ ${categoryCount} created (${categoryFixtures.length - categoryCount} already existed)`,
    );
  } else {
    console.log('   ⏭  skipped');
  }

  // Always build the slug → id lookup regardless of whether we just seeded,
  // so that later sections (budgets, transactions, recurring items) can resolve
  // category slugs even when this section was skipped.
  const allCategories = await prisma.category.findMany({
    where: { isSystem: true },
    select: { id: true, slug: true },
  });
  const catBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  function resolveCat(slug: string): string {
    const id = catBySlug.get(slug);
    if (!id) throw new Error(`Unknown category slug: "${slug}" — seed categories first.`);
    return id;
  }

  // ── 2. Merchant registry ──────────────────────────────────────────────────
  //
  // Global (not per-user). The AI classification pipeline looks up narration
  // fragments against this registry to auto-assign categories and merchant
  // names to imported bank transactions.
  //
  console.log('\n🏪 Merchant registry');
  if (run(2)) {
    const merchantFixtures = loadFixture<MerchantFixture[]>('merchants.json');
    const { count: merchantCount } = await prisma.merchant.createMany({
      data: merchantFixtures,
      skipDuplicates: true,
    });
    console.log(
      `   ✓ ${merchantCount} created (${merchantFixtures.length - merchantCount} already existed)`,
    );
  } else {
    console.log('   ⏭  skipped');
  }

  // ── 3. Budgets ────────────────────────────────────────────────────────────
  //
  // One budget per category+period (enforced by a unique constraint). Each
  // budget carries a BudgetHistory table that records limit changes over time
  // (SCD — slowly changing dimension). The entry with endDate=null is current.
  //
  console.log('\n💰 Budgets');
  if (run(3)) {
    const budgetFixtures = loadFixture<BudgetFixture[]>('budgets.json');
    let budgetsCreated = 0;
    let budgetsSkipped = 0;

    for (const fixture of budgetFixtures) {
      const categoryId = resolveCat(fixture.categorySlug);

      const existing = await prisma.budget.findFirst({
        where: { userId, categoryId, period: fixture.period },
      });

      if (existing) {
        budgetsSkipped++;
        continue;
      }

      // The current limit is the most-recent history entry (the one with endDate=null).
      const currentLimit = fixture.history.at(-1)!.limit;

      const budget = await prisma.budget.create({
        data: {
          name: fixture.name,
          amount: currentLimit,
          description: fixture.description,
          period: fixture.period,
          alertThreshold: fixture.alertThreshold,
          categoryId,
          userId,
        },
      });

      await prisma.budgetHistory.createMany({
        data: fixture.history.map((h) => ({
          budgetId: budget.id,
          limit: h.limit,
          startDate: new Date(h.startDate),
          endDate: h.endDate ? new Date(h.endDate) : null,
        })),
        skipDuplicates: true,
      });

      budgetsCreated++;
    }

    console.log(`   ✓ ${budgetsCreated} created, ${budgetsSkipped} already existed`);
  } else {
    console.log('   ⏭  skipped');
  }

  // ── 4. Transactions ───────────────────────────────────────────────────────
  //
  // 42 transactions covering November 2025 – May 2026. Includes salary income,
  // freelance payments, and expenses across every budget category. Source IDs
  // use the TXN-YYMMDD-XXXXXX format produced by the finance service.
  //
  console.log('\n💳 Transactions');
  if (run(4)) {
    const transactionFixtures = loadFixture<TransactionFixture[]>('transactions.json');
    const { count: txnsCreated } = await prisma.transaction.createMany({
      data: transactionFixtures.map((fixture) => {
        const txnDate = new Date(fixture.date);
        return {
          amount: fixture.amount,
          date: txnDate,
          type: fixture.type,
          description: fixture.description,
          merchant: fixture.merchant,
          notes: fixture.notes,
          source: fixture.source,
          sourceId: genSourceId('TXN', txnDate),
          categoryId: resolveCat(fixture.categorySlug),
          userId,
        };
      }),
      skipDuplicates: true,
    });
    console.log(`   ✓ ${txnsCreated} transactions created`);
  } else {
    console.log('   ⏭  skipped');
  }

  // ── 5. Goals + contributions ──────────────────────────────────────────────
  //
  // 5 goals across all statuses and priorities. Contributions are distributed
  // across 10 consecutive months (Aug 2025 – May 2026), producing a 10-month
  // saving streak which unlocks the Diamond Saver milestone badge.
  //
  //   ACTIVE  HIGH   — Emergency Fund   ₦600k / ₦1.5M  (40%)
  //   ACTIVE  MEDIUM — MacBook Pro M4   ₦420k / ₦900k  (47%)
  //   ACTIVE  LOW    — Dubai Vacation   ₦100k / ₦600k  (17%)
  //   ON_HOLD HIGH   — Wedding Fund     ₦550k / ₦3M    (18%)
  //   COMPLETED      — iPhone 15 Pro    ₦500k / ₦500k  (100%)
  //
  // goalIds is always populated (from DB when skipped) so activity logs can
  // resolve "goal:<name>" refs even if this section was skipped.
  //
  const goalIds: Record<string, string> = {};

  console.log('\n🎯 Goals & contributions');
  if (run(5)) {
    const goalFixtures = loadFixture<GoalFixture[]>('goals.json');
    let goalsCreated = 0;
    let goalsSkipped = 0;

    for (const fixture of goalFixtures) {
      const existing = await prisma.goal.findFirst({ where: { userId, name: fixture.name } });

      if (existing) {
        goalIds[fixture.name] = existing.id;
        goalsSkipped++;
        continue;
      }

      const goal = await prisma.goal.create({
        data: {
          name: fixture.name,
          targetAmount: fixture.targetAmount,
          targetDate: new Date(fixture.targetDate),
          status: fixture.status,
          priority: fixture.priority,
          description: fixture.description,
          userId,
        },
      });

      goalIds[fixture.name] = goal.id;

      if (fixture.contributions.length > 0) {
        await prisma.goalContribution.createMany({
          data: fixture.contributions.map((c) => ({
            goalId: goal.id,
            amount: c.amount,
            date: new Date(c.date),
            description: c.description,
          })),
        });
      }

      goalsCreated++;
    }

    console.log(`   ✓ ${goalsCreated} created, ${goalsSkipped} already existed`);
  } else {
    const existing = await prisma.goal.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    for (const g of existing) goalIds[g.name] = g.id;
    console.log('   ⏭  skipped');
  }

  // ── 6. Recurring items ────────────────────────────────────────────────────
  //
  // 10 items spanning all RecurringItemFrequency values. Covers both INCOME
  // (salary) and EXPENSE (rent, subscriptions, bills). One item is inactive
  // (weekly groceries) to demonstrate the paused/disabled state in the UI.
  //
  // recurringIds is always populated (from DB when skipped) so activity logs
  // can resolve "recurring:<name>" refs even if this section was skipped.
  //
  const recurringIds: Record<string, string> = {};

  console.log('\n🔄 Recurring items');
  if (run(6)) {
    const recurringFixtures = loadFixture<RecurringItemFixture[]>('recurring_items.json');
    let recurringCreated = 0;
    let recurringSkipped = 0;

    for (const fixture of recurringFixtures) {
      const existing = await prisma.recurringItem.findFirst({
        where: { userId, name: fixture.name },
      });

      if (existing) {
        recurringIds[fixture.name] = existing.id;
        recurringSkipped++;
        continue;
      }

      const item = await prisma.recurringItem.create({
        data: {
          name: fixture.name,
          amount: fixture.amount,
          type: fixture.type,
          frequency: fixture.frequency,
          startDate: new Date(fixture.startDate),
          nextRunAt: new Date(fixture.nextRunAt),
          lastRunAt: fixture.lastRunAt ? new Date(fixture.lastRunAt) : null,
          isActive: fixture.isActive,
          description: fixture.description,
          merchant: fixture.merchant,
          notes: fixture.notes,
          categoryId: resolveCat(fixture.categorySlug),
          userId,
        },
      });

      recurringIds[fixture.name] = item.id;
      recurringCreated++;
    }

    console.log(`   ✓ ${recurringCreated} created, ${recurringSkipped} already existed`);
  } else {
    const existing = await prisma.recurringItem.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    for (const r of existing) recurringIds[r.name] = r.id;
    console.log('   ⏭  skipped');
  }

  // ── 7. Activity logs ──────────────────────────────────────────────────────
  //
  // 20 log entries loaded from activity_logs.json. Each entry uses an entityRef
  // field that gets resolved to a real DB id at seed time:
  //
  //   "txn"                    → most recent transaction for this user
  //   "budget"                 → first budget for this user
  //   "goal:<name>"            → goal seeded above with that name
  //   "recurring:<name>"       → recurring item seeded above with that name
  //
  console.log('\n📋 Activity logs');
  if (run(7)) {
    const anyTransaction = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    const anyBudget = await prisma.budget.findFirst({ where: { userId } });

    function resolveEntityRef(ref: string): string {
      if (ref === 'txn') return anyTransaction?.id ?? userId;
      if (ref === 'budget') return anyBudget?.id ?? userId;
      if (ref.startsWith('goal:')) return goalIds[ref.slice(5)] ?? userId;
      if (ref.startsWith('recurring:')) return recurringIds[ref.slice(10)] ?? userId;
      return userId;
    }

    interface ActivityLogFixture {
      event: string;
      entityRef: string;
      entityType: string;
      createdAt: string;
      data: object;
    }

    const logFixtures = loadFixture<ActivityLogFixture[]>('activity_logs.json');

    const { count: logsCreated } = await prisma.activityLogs.createMany({
      data: logFixtures.map((l) => ({
        event: l.event,
        entityId: resolveEntityRef(l.entityRef),
        entityType: l.entityType,
        createdAt: new Date(l.createdAt),
        data: l.data,
        userId,
      })),
      skipDuplicates: true,
    });
    console.log(`   ✓ ${logsCreated} activity logs created`);
  } else {
    console.log('   ⏭  skipped');
  }

  // ── 8. Splits ─────────────────────────────────────────────────────────────
  //
  // 3 splits covering all statuses: OPEN, PARTIALLY_SETTLED, SETTLED.
  // Each has 3 participants. Settlements reference participants by their
  // index in the fixture array, resolved to DB ids at seed time.
  //
  console.log('\n🔀 Splits');
  if (run(8)) {
    const splitFixtures = loadFixture<SplitFixture[]>('splits.json');
    let splitsCreated = 0;
    let splitsSkipped = 0;

    for (const fixture of splitFixtures) {
      const existing = await prisma.split.findFirst({ where: { userId, name: fixture.name } });

      if (existing) {
        splitsSkipped++;
        continue;
      }

      const split = await prisma.split.create({
        data: {
          name: fixture.name,
          amount: fixture.amount,
          status: fixture.status,
          createdAt: new Date(fixture.createdAt),
          userId,
        },
      });

      const participants = await Promise.all(
        fixture.participants.map((p) =>
          prisma.splitParticipant.create({
            data: { name: p.name, email: p.email, amount: p.amount, splitId: split.id },
          }),
        ),
      );

      if (fixture.settlements.length > 0) {
        await prisma.splitSettlement.createMany({
          data: fixture.settlements.map((s) => ({
            splitId: split.id,
            participantId: participants[s.participantIndex]!.id,
            paidAmount: s.paidAmount,
            paidAt: new Date(s.paidAt),
          })),
        });
      }

      splitsCreated++;
    }

    console.log(`   ✓ ${splitsCreated} created, ${splitsSkipped} already existed`);
  } else {
    console.log('   ⏭  skipped');
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log(`   Account:   ${user.firstName} ${user.lastName} (${user.email})`);
  console.log('   Dashboard: http://localhost:3000/dashboard');
  console.log('   Budgets:   http://localhost:3000/finance/budgets');
  console.log('   Goals:     http://localhost:3000/planning/goals');
  console.log('   Splits:     http://localhost:3000/planning/splits');
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('\n❌ Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
