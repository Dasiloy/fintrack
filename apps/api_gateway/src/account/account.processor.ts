import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { Category } from '@fintrack/database/types';
import { PrismaService } from '@fintrack/database/service';
import {
  MONO_QUEUE,
  SYNC_ACCOUNT_JOB,
} from '@fintrack/types/constants/queus.constants';
import {
  MonoAccountSybJobPayload,
  MonoTransaction,
  MonoTransactionPage,
} from '@fintrack/types/interfaces/mono';
import {
  TransactionSource,
  TransactionType,
} from '@fintrack/types/protos/finance/transaction';

import { FcmService } from '../fcm/fcm.service';
import { TransactionService } from '../transaction/transaction.service';
import { formatDate } from '@fintrack/utils/date';
import { AccountService } from './account.service';

// ---------------------------------------------------------------------------
// Token-scoring categorisation — no static name or slug maps.
//
// How it works:
//   Each DB category is tokenised from its name + slug.
//   Each transaction produces two token sets:
//     • Mono's category enum value (e.g. "food_and_drinks" → ["food","drinks"])
//     • The narration string           (e.g. "SHOPRITE IKEJA" → ["shoprite","ikeja"])
//   Mono tokens are weighted 2× because they are a curated signal.
//   The category with the highest aggregate score wins.
//   If nothing scores, the first category whose name/slug contains
//   "misc", "general", or "other" is used as a dynamic fallback.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'into',
  'or',
  'of',
  'to',
  'a',
  'an',
  'in',
  'on',
  'at',
  'by',
  'cat',
  'per',
  'ltd',
  'plc',
  'nig',
  'nigeria',
]);

interface CategoryTokenSet {
  id: string;
  tokens: Set<string>;
}

@Processor(MONO_QUEUE)
export class MonoAccountSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(MonoAccountSyncProcessor.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly accountService: AccountService,
    private readonly fcmService: FcmService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case SYNC_ACCOUNT_JOB:
        await this.handleSyncAccount(job.data);
        break;
      default:
        this.logger.error(`Job ${job.id} (${job.name}) not handled`);
    }
  }

  // ---------------------------------------------------------------------------
  // Handler
  // ---------------------------------------------------------------------------

  private async handleSyncAccount(
    data: MonoAccountSybJobPayload,
  ): Promise<void> {
    try {
      const { account, id, userId, startDate } = data;
      const accountId = account._id;
      this.logger.log(`Starting transaction sync for account ${accountId}`);

      // Step 1 — load categories once; build token sets once for the whole job
      const categories = await this.prisma.category.findMany({
        where: { OR: [{ userId, isSystem: false }, { isSystem: true }] },
      });
      const catTokenSets = this.buildCategoryTokenSets(categories);
      const fallbackId = this.findFallbackCategoryId(categories);

      // Step 2 — fetch all pages (start + end required by Mono)
      const start = formatDate(new Date(startDate));
      const end = formatDate(new Date());

      const transactions: MonoTransaction[] = [];
      let nextUrl: string | null =
        `https://api.withmono.com/v2/accounts/${accountId}/transactions?paginate=true&start=${start}&end=${end}`;

      while (nextUrl) {
        try {
          const page = await this.fetchTransactionPage(nextUrl);
          transactions.push(...page.data);
          nextUrl = page.meta.next;
        } catch (error) {
          this.logger.error(
            `Page fetch failed (${nextUrl}): ${error instanceof Error ? error.message : JSON.stringify(error)}`,
          );
          break;
        }
      }

      if (transactions.length === 0) {
        this.logger.log(`No new transactions for account ${accountId}`);
        await this.accountService.updateMonoBankAccount(account, id);
        return;
      }

      this.logger.log(
        `Fetched ${transactions.length} transactions — persisting…`,
      );

      // Step 3 — single batch gRPC call; skipDuplicates handles idempotency
      const { created, skipped } =
        await this.transactionService.batchCreateMonoTransactions(userId, {
          transactions: transactions.map((tx) => ({
            amount: String(tx.amount),
            date: tx.date,
            type:
              tx.type === 'credit'
                ? TransactionType.INCOME
                : TransactionType.EXPENSE,
            description: tx.narration,
            categoryId: this.resolveCategory(tx, catTokenSets, fallbackId),
            source: TransactionSource.BANK,
            sourceId: tx.id,
            monoBankAccountId: id,
          })),
        });

      this.logger.log(
        `Sync done for ${accountId}: ${created} created, ${skipped} skipped`,
      );

      // Step 4 — update lastSyncedAt
      await this.accountService.updateMonoBankAccount(account, id);

      // Step 5 — single FCM push
      if (created > 0) {
        await this.fcmService.sendToUser({
          userId,
          title: 'Transactions synced',
          body: `${created} new transaction${created !== 1 ? 's' : ''} imported from your bank account`,
          data: { type: 'bank_sync', accountId: id },
        });
      }
    } catch (err) {
      this.logger.error('handleSyncAccount error', JSON.stringify(err));
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-categorisation — pure token scoring, no static maps
  // ---------------------------------------------------------------------------

  /**
   * Resolves the best matching category ID for a transaction.
   *
   * Scores each loaded category against two signals:
   *  1. Mono's category enum value  (weight ×2 — curated signal)
   *  2. The transaction narration   (weight ×1 — free-text signal)
   *
   * Matching is token-level: exact match or one token being a prefix/suffix
   * of the other (e.g. "drink" ↔ "drinks", "grocer" ↔ "groceries").
   *
   * @param tx            - Mono transaction
   * @param catTokenSets  - Pre-built token sets for all user categories
   * @param fallbackId    - ID of the best "miscellaneous" category in the loaded list
   */
  private resolveCategory(
    tx: MonoTransaction,
    catTokenSets: CategoryTokenSet[],
    fallbackId: string,
  ): string {
    const monoTokens =
      tx.category === 'unknown' ? [] : this.tokenize(tx.category);
    const narrationTokens = this.tokenize(tx.narration);

    let bestId = fallbackId;
    let bestScore = 0;

    for (const { id, tokens } of catTokenSets) {
      let score = 0;

      for (const t of monoTokens) {
        if (this.tokenMatches(t, tokens)) score += 2;
      }
      for (const t of narrationTokens) {
        if (this.tokenMatches(t, tokens)) score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    return bestId;
  }

  /**
   * Pre-computes token sets from each category's name and slug.
   * Called once per sync job — not once per transaction.
   */
  private buildCategoryTokenSets(categories: Category[]): CategoryTokenSet[] {
    return categories.map((c) => ({
      id: c.id,
      tokens: new Set([...this.tokenize(c.name), ...this.tokenize(c.slug)]),
    }));
  }

  /**
   * Finds the fallback category ID by looking for "misc", "general", or
   * "other" in the name or slug — dynamic, not hardcoded.
   */
  private findFallbackCategoryId(categories: Category[]): string {
    const fallback = categories.find(
      (c) =>
        /misc|general|other/i.test(c.name) || /misc|general|other/.test(c.slug),
    );
    return fallback?.id ?? categories[0]?.id ?? '';
  }

  /**
   * Returns true if `token` exactly matches or is a substring/prefix of any
   * token in `catTokens` (and vice-versa), with minimum length 4 for partial
   * matches to avoid noise ("the" ↔ "therapy" false positive).
   */
  private tokenMatches(token: string, catTokens: Set<string>): boolean {
    if (catTokens.has(token)) return true;
    if (token.length < 4) return false;
    for (const ct of catTokens) {
      if (ct.length >= 4 && (ct.includes(token) || token.includes(ct)))
        return true;
    }
    return false;
  }

  /**
   * Splits text into lowercase, stopword-filtered tokens.
   * Handles snake_case, kebab-case, spaces, and common punctuation.
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[_\-&/\\]+/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z]/g, ''))
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async fetchTransactionPage(
    url: string,
  ): Promise<MonoTransactionPage> {
    const secretKey = this.configService.getOrThrow<string>('MONO_SECRET_KEY');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': secretKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Mono transactions fetch failed (${response.status}): ${text}`,
      );
    }

    return response.json() as Promise<MonoTransactionPage>;
  }
}
