import { Job } from 'bullmq';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Category, Merchant } from '@fintrack/database/types';
import { PrismaService } from '@fintrack/database/service';
import {
  MONO_QUEUE,
  SYNC_ACCOUNT_JOB,
} from '@fintrack/types/constants/queus.constants';
import {
  MonoAccountSybJobPayload,
  MonoTransaction,
  MonoTransactionPage,
  CategoryMap,
} from '@fintrack/types/interfaces/mono';
import {
  TransactionSource,
  TransactionType,
} from '@fintrack/types/protos/finance/transaction';
import { STOPWORDS } from '@fintrack/types/constants/mono.contants';

import { FcmService } from '../fcm/fcm.service';
import { TransactionService } from '../transaction/transaction.service';
import { formatDate } from '@fintrack/utils/date';
import { genBankSourceId } from '@fintrack/utils/format';
import { AccountService } from './account.service';

/**
 * BullMQ processor that consumes `MONO_QUEUE` jobs produced by the account
 * webhook handler when a Mono bank account needs to be synchronised.
 *
 * ## Job handled
 * | Job name          | Payload                      | Handler                |
 * |-------------------|------------------------------|------------------------|
 * | `SYNC_ACCOUNT_JOB`| `MonoAccountSybJobPayload`   | `handleSyncAccount()`  |
 *
 * ## `handleSyncAccount` pipeline
 * 1. **Load context** — fetch the user's categories (system + personal) and
 *    all merchants in parallel; pre-compute token sets for both once per job.
 * 2. **Fetch transactions** — paginate through Mono's transaction API for the
 *    date range `[startDate, today]`, collecting all pages.
 * 3. **Token-scoring categorisation** — for each transaction, score every
 *    category by matching Mono's category enum tokens (weight 2×), merchant
 *    hint tokens (weight 2×), and narration tokens (weight 1×) against the
 *    category's token set.  High-scoring transactions go into `resolved`;
 *    the rest go into `unresolved`.
 * 4. **AI classification** — if `unresolved` is non-empty, a single gRPC call
 *    to `AiService.ClassifyTransactions` classifies the remainder.  Resolved
 *    IDs are tracked in `aiClassifiedIds` for the correction feedback loop.
 * 5. **Batch create** — one gRPC call to `FinanceService.BatchCreateTransactions`
 *    with `skipDuplicates`; returns `created` and `skipped` counts.
 * 6. **Post-sync** — updates `lastSyncedAt` on the Mono account record and
 *    sends an FCM push notification if any transactions were created.
 */
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

  /** Routes incoming BullMQ jobs to the appropriate handler by job name. */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case SYNC_ACCOUNT_JOB:
        await this.handleSyncAccount(job.data);
        break;
      default:
        this.logger.error(`Job ${job.id} (${job.name}) not handled`);
    }
  }

  /**
   * Executes the full 6-step sync pipeline for a single Mono bank account.
   * See the class-level doc for the complete pipeline description.
   * Errors are logged then re-thrown so BullMQ can retry the job.
   */
  private async handleSyncAccount(
    data: MonoAccountSybJobPayload,
  ): Promise<void> {
    try {
      const { account, id, userId, startDate } = data;

      this.logger.log(`Starting transaction sync for account ${account._id}`);

      // Step 1 — load categories and merchants  once; build token sets once for the whole job
      const [categories, merchants] = await Promise.all([
        this.prisma.category.findMany({
          where: { OR: [{ isSystem: true }, { userId }] },
        }),
        this.prisma.merchant.findMany(),
      ]);
      const catTokenSets = this.buildCategoryTokenSetsMap(categories);
      const catIdNameMap = new Map(categories.map((cat) => [cat.id, cat.name]));
      const merchantTokenSets = this.buildMerchantTokenSetsMap(merchants);
      const fallbackCategoryId =
        categories.find((c) => /misc|general|other/i.test(c.name + c.slug))
          ?.id ?? categories[0]?.id;

      // Step 2 — fetch all pages (start + end required by Mono)
      const transactions = await this.fetchAllTransactions(startDate, account);
      if (transactions.length === 0) {
        this.logger.log(`No new transactions for account ${account._id}`);
        await this.accountService.updateMonoBankAccount(account, id);
        return;
      }

      this.logger.log(
        `Fetched ${transactions.length} transactions — persisting…`,
      );

      // step 3- Ressolve transaction categories
      const rawTxMap = new Map<string, MonoTransaction>(
        transactions.map((tx) => [tx.id, tx]),
      );
      const ressolved: MonoTransaction[] = [];
      const unressolved: MonoTransaction[] = [];

      for (const transaction of transactions) {
        const carTokens = this.tokenize(transaction.category);
        const narTokens = this.tokenize(transaction.narration);
        const merchantHintTokens = this.lookupMerchantHintTokens(
          narTokens,
          merchantTokenSets,
        );

        let highestscore = 0;
        let category: CategoryMap | null = null;

        catTokenSets.forEach((cm) => {
          let score = 0;

          // check mono category token => if this current category has some keywords that matches, score it
          for (const ct of carTokens)
            if (this.tokenMatches(ct, cm.tokens)) score += 2;

          // check merchant hinnt tokens, is it present in this current category tokens? score it
          for (const mt of merchantHintTokens)
            if (this.tokenMatches(mt, cm.tokens)) score += 2;

          // fallback omn narration if tokens in naration matches with those in this current user category score it
          for (const nt of narTokens)
            if (this.tokenMatches(nt, cm.tokens)) score += 1;

          if (score > highestscore) {
            highestscore = score;
            category = cm;
          }
        });

        highestscore > 0
          ? ressolved.push({ ...transaction, category: category!.id as any })
          : unressolved.push(transaction);
      }
      this.logger.log(
        `Ressolved transactions ${ressolved.length}- Unressolved transactions ${unressolved.length}`,
      );

      // step 4 - Optional unressolved ai batch call
      const aiClassifiedIds = new Set<string>();
      if (unressolved.length > 0) {
        const { classifications } =
          await this.transactionService.classifyTransactions(userId, {
            categories: categories.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: c.name,
              tags: c.tags,
            })),
            transactions: unressolved.map((t) => ({
              id: t.id,
              narration: t.narration ?? '',
              category: t.category ?? '',
            })),
          });

        const classifiedMap = new Map<string, string>(
          classifications.map((cl) => [cl.transactionId, cl.categoryId]),
        );

        unressolved.forEach((untrx) => {
          const resolvedId = classifiedMap.get(untrx.id) ?? fallbackCategoryId;
          if (!resolvedId) return;
          aiClassifiedIds.add(untrx.id);
          ressolved.push({ ...untrx, category: resolvedId as any });
        });
      }

      // Step 5 — single batch gRPC call; skipDuplicates handles idempotency
      const { created, skipped } =
        await this.transactionService.batchCreateMonoTransactions(userId, {
          transactions: ressolved.map((tx) => ({
            date: tx.date,
            amount: String(tx.amount),
            description: tx.narration,
            narration: tx.narration,
            categoryId: tx.category as string,
            categoryName: catIdNameMap.get(tx.category as string)!,
            source: TransactionSource.BANK,
            sourceId: genBankSourceId(tx.id, tx.date),
            bankTransactionId: tx.id,
            monoBankAccountId: id,
            aiClassified: aiClassifiedIds.has(tx.id),
            type:
              tx.type === 'credit'
                ? TransactionType.INCOME
                : TransactionType.EXPENSE,
            sourceData: JSON.stringify(rawTxMap.get(tx.id)),
          })),
        });

      this.logger.log(
        `Sync done for ${account._id}: ${created} created, ${skipped} skipped`,
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

  /**
   * Pre-computes a `slug → CategoryMap` lookup with each category's token set
   * (name tokens + tags, all lower-cased).  Called once per sync job so the
   * O(categories) work is amortised across all transactions in the batch.
   */
  private buildCategoryTokenSetsMap(
    categories: Category[],
  ): Map<string, CategoryMap> {
    return new Map(
      categories.map((c) => [
        c.slug,
        {
          id: c.id,
          tokens: new Set([
            ...this.tokenize(c.name),
            ...c.tags.map((tag) => tag.toLowerCase()),
          ]),
        },
      ]),
    );
  }

  /**
   * Pre-computes a `merchantName/alias → categoryHint tokens` lookup from the
   * merchant table.  Both canonical names and aliases map to the same hint token
   * set, so a narration like "SHOPRITE" resolves to its `Food` category hint even
   * when the transaction spells out an alias.
   */
  private buildMerchantTokenSetsMap(
    merchants: Merchant[],
  ): Map<string, string[]> {
    const mercsMap = new Map(merchants.map((m) => [m.name, m.categoryHint]));

    const tokenSets = new Map<string, string[]>();

    merchants.forEach((merchant) => {
      const hintTokens = this.tokenize(mercsMap.get(merchant.name)!);

      // canonical name → token set
      tokenSets.set(merchant.name, hintTokens);

      merchant.aliases.forEach((alias) => {
        tokenSets.set(alias, hintTokens);
      });
    });

    return tokenSets;
  }

  /**
   * Checks each narration token against the merchant map and returns the hint
   * tokens for the first match found.  Returns an empty array when no known
   * merchant name appears in the narration.
   */
  private lookupMerchantHintTokens(
    narrationTokens: string[],
    merchantsMap: Map<string, string[]>,
  ): string[] {
    narrationTokens.forEach((nt) => {
      // use naration token as a projected merchant anme
      const merchantTokens = merchantsMap.get(nt);

      // if merchant found => return its hint tokens
      if (merchantTokens) return merchantTokens;
    });

    return [];
  }

  /**
   * Paginates through Mono's transaction API until `meta.next` is null,
   * accumulating all transactions for the date range `[startDate, today]`.
   * Page fetch errors are logged and break the loop — partial results are
   * returned rather than failing the whole sync.
   */
  private async fetchAllTransactions(
    startDate: Date,
    account: MonoAccountSybJobPayload['account'],
  ): Promise<MonoTransaction[]> {
    const start = formatDate(new Date(startDate));
    const end = formatDate(new Date());

    const transactions: MonoTransaction[] = [];
    let nextUrl: string | null =
      `https://api.withmono.com/v2/accounts/${account._id}/transactions?paginate=true&start=${start}&end=${end}`;

    while (nextUrl) {
      try {
        const page = await this.fetchTransactionPage(nextUrl);
        if (page.data) transactions.push(...page.data);
        nextUrl = page.meta?.next;
      } catch (error) {
        this.logger.error(
          `Page fetch failed (${nextUrl}): ${error instanceof Error ? error.message : JSON.stringify(error)}`,
        );
        break;
      }
    }

    return transactions;
  }

  /**
   * Fetches a single page of Mono transactions from the given URL.
   * Throws an `Error` with the HTTP status and body text when the response
   * is not OK — the caller breaks out of the pagination loop on error.
   */
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

  /**
   * Returns `true` if `token` is an exact member of `catTokens`.
   * Exact matching is intentional — partial/fuzzy matches produce false
   * positives that degrade precision.  Gaps are intentionally left to AI
   * classification rather than papered over with substring heuristics.
   */
  private tokenMatches(token: string, catTokens: Set<string>): boolean {
    if (catTokens.has(token)) return true;
    return false;
  }

  /**
   * Normalises `text` into a lowercase, stopword-filtered token array.
   * Handles snake_case, kebab-case, slashes, and common punctuation by
   * converting separators to spaces before splitting.  Returns `[]` for
   * null/undefined/empty input — safe to call with Mono's optional fields.
   */
  private tokenize(text: string | null | undefined): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[_\-&/\\]+/g, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z]/g, ''))
      .filter((w) => !STOPWORDS.has(w));
  }
}
