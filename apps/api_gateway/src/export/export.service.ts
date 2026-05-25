import dayjs from '@fintrack/utils/date';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { ClientGrpc } from '@nestjs/microservices';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { User } from '@fintrack/database/types';
import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  Transaction,
  TransactionType,
} from '@fintrack/types/protos/finance/transaction';
import { PLAN_LIMITS } from '@fintrack/types/constants/plan.constants';
import { UsageService } from '../usage/usage.service';

import {
  ExportDocType,
  ExportFormat,
  ExportPreviewData,
  ExportResult,
  FILE_EXTENSIONS,
  GenerateExportDto,
  MIME_TYPES,
  SUPPORTED_FORMATS,
} from './dto/generate_export.dto';
import { ExportCacheService } from './export.cache.service';
import { formatNGN } from './export.format';
import { generateTransactionCsv } from './generators/csv.generator';
import {
  generateTransactionXlsx,
  generateBudgetXlsx,
  generateGoalXlsx,
} from './generators/xlsx.generator';
import {
  generateBudgetPerformancePdf,
  generateGoalProgressPdf,
  generateMonthlySummaryPdf,
  generateNetWorthPdf,
  generateSpendingBreakdownPdf,
} from './generators/pdf.generator';
import {
  generateSpendingBreakdownImage,
  generateNetWorthImage,
} from './generators/image.generator';

/**
 * Orchestrates export generation for all six analytics document types.
 *
 * Responsibilities:
 * - Silently cap FREE user `startDate` to ANALYTICS_MONTHS_LIMIT × 30 days
 * - Check and write the Redis export cache via {@link ExportCacheService}
 * - Fetch raw data from the Finance microservice via gRPC
 * - Dispatch to the correct format generator (CSV, XLSX, PDF, or PNG)
 *
 * @class ExportService
 */
@Injectable()
export class ExportService implements OnModuleInit {
  private readonly logger = new Logger(ExportService.name);
  private financeService: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly financeClient: ClientGrpc,
    private readonly cache: ExportCacheService,
    private readonly usageService: UsageService,
  ) {}

  /**
   * @description Initialise the gRPC Finance stub on module startup.
   *
   * @public
   * @returns {void}
   */
  onModuleInit() {
    this.financeService =
      this.financeClient.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  // ================================================================
  //. Public API
  // ================================================================

  /**
   * @description Generate an export or return a matching Redis cache entry.
   *
   * Flow: validate type/format pair → apply FREE plan date cap → cache lookup (unless `force`)
   * → fetch Finance data and run generator → fire-and-forget cache write → return result.
   *
   * @async
   * @public
   * @param {GenerateExportDto} dto Export type, format, date filters, and optional `force` flag
   * @param {User} user Authenticated user; scopes gRPC `x-user-id` metadata and cache keys
   * @returns {Promise<ExportResult>} File buffer, download filename, MIME type, timestamp, and `cached` flag
   */
  async generate(dto: GenerateExportDto, user: User): Promise<ExportResult> {
    this.validateFormatSupported(dto.type, dto.format);

    const effectiveDto = await this.applyPlanCap(dto, user);

    const cacheKey = this.cache.buildKey(user.id, effectiveDto);
    if (!effectiveDto.force) {
      const hit = await this.cache.get(cacheKey);
      if (hit) return hit;
    }

    const { buffer, previewData } = await this.generateBufferAndPreview(
      effectiveDto,
      user,
    );
    const now = new Date().toISOString();
    const filename = this.buildFilename(
      effectiveDto.type,
      effectiveDto.format,
      now,
    );

    const result: ExportResult = {
      buffer,
      filename,
      mimeType: MIME_TYPES[effectiveDto.format],
      generatedAt: now,
      cached: false,
      previewData,
    };

    this.cache
      .set(cacheKey, result)
      .catch((err) =>
        this.logger.warn(`Cache set error: ${(err as Error).message}`),
      );

    return result;
  }

  /**
   * @description Remove all cached exports for a user (`export:{userId}:*`).
   *
   * Used by `DELETE /api/export/cache` and tRPC `export.invalidateCache`.
   * Domain mutations (transactions, budgets, goals, recurring) also invalidate
   * the same key pattern fire-and-forget via local helpers in those services.
   *
   * @async
   * @public
   * @param {string} userId Authenticated user ID
   * @returns {Promise<void>}
   */
  async invalidateCache(userId: string): Promise<void> {
    await this.cache.invalidateUser(userId);
  }

  // ================================================================
  //. Plan enforcement
  // ================================================================

  /**
   * @description Clamp `startDate` for FREE plans so exports cannot exceed the analytics window.
   *
   * Uses `PLAN_LIMITS.FREE.ANALYTICS_MONTHS_LIMIT × 30` days as the earliest allowed start.
   * PRO and other plans receive the DTO unchanged.
   *
   * @async
   * @private
   * @param {GenerateExportDto} dto Original request (may include an earlier `startDate`)
   * @param {User} user Used to resolve plan via {@link UsageService.getGatedUsage}
   * @returns {Promise<GenerateExportDto>} DTO with `startDate` raised to the cutoff when on FREE
   */
  private async applyPlanCap(
    dto: GenerateExportDto,
    user: User,
  ): Promise<GenerateExportDto> {
    const usage = await this.usageService.getGatedUsage(user.id);
    if (usage.plan !== 'FREE') return dto;

    const monthsLimit = PLAN_LIMITS.FREE.ANALYTICS_MONTHS_LIMIT as number;
    const freeDays = monthsLimit * 30;
    const cutoff = dayjs().subtract(freeDays, 'days').format('YYYY-MM-DD');
    const clampedStart =
      dto.startDate && dto.startDate > cutoff ? dto.startDate : cutoff;

    return { ...dto, startDate: clampedStart };
  }

  // ================================================================
  //. Buffer dispatch
  // ================================================================

  /**
   * @description Fetch Finance data and dispatch to the generator for the requested document type.
   *
   * Attaches `x-user-id` gRPC metadata and builds a human-readable `periodLabel` for PDF/image covers.
   *
   * @async
   * @private
   * @param {GenerateExportDto} dto Effective export request (after plan cap)
   * @param {User} user Authenticated user
   * @returns {Promise<Buffer>} Raw file bytes ready for base64 encoding in the controller
   * @throws {BadRequestException} When `dto.type` is not one of the six supported document types
   */
  private async generateBufferAndPreview(
    dto: GenerateExportDto,
    user: User,
  ): Promise<{ buffer: Buffer; previewData: ExportPreviewData | null }> {
    const meta = new Metadata();
    meta.add('x-user-id', user.id);

    const periodLabel = this.periodLabel(dto);

    switch (dto.type) {
      case 'transaction-history':
        return this.generateTransactionExport(dto, meta);

      case 'monthly-summary':
        return this.generateMonthlySummaryExport(dto, meta, periodLabel);

      case 'spending-breakdown':
        return this.generateSpendingBreakdownExport(dto, meta, periodLabel);

      case 'budget-performance':
        return this.generateBudgetPerformanceExport(dto, meta, periodLabel);

      case 'goal-progress':
        return this.generateGoalProgressExport(dto, meta, periodLabel);

      case 'net-worth':
        return this.generateNetWorthExport(dto, meta);

      default:
        throw new BadRequestException(
          `Unknown export type: ${dto.type as string}`,
        );
    }
  }

  // ────────────────────────── transaction-history ──────────────────

  private async generateTransactionExport(
    dto: GenerateExportDto,
    meta: Metadata,
  ): Promise<{ buffer: Buffer; previewData: ExportPreviewData }> {
    const transactions = await this.fetchAllTransactions(dto, meta);
    const buffer =
      dto.format === 'csv'
        ? generateTransactionCsv(transactions)
        : await generateTransactionXlsx(transactions);

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + parseFloat(t.amount ?? '0'), 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + parseFloat(t.amount ?? '0'), 0);

    return {
      buffer,
      previewData: {
        summary: [
          { label: 'Total Transactions', value: String(transactions.length) },
          {
            label: 'Total Income',
            value: this.fmt(totalIncome),
            color: 'green',
          },
          {
            label: 'Total Expense',
            value: this.fmt(totalExpense),
            color: 'red',
          },
        ],
        headers: ['Date', 'Description', 'Amount', 'Type'],
        rows: transactions
          .slice(0, 10)
          .map((t) => [
            t.date ?? '',
            t.description ?? t.merchant ?? '—',
            this.fmt(parseFloat(t.amount ?? '0')),
            t.type === 'INCOME' ? 'Income' : 'Expense',
          ]),
      },
    };
  }

  /**
   * @description Page through `getTransactions` until all rows in the date window are collected.
   *
   * Fetches 1000 transactions per page and stops when a page returns fewer than `PAGE_SIZE` rows.
   *
   * @async
   * @private
   * @param {GenerateExportDto} dto Date range and optional `txType` filter
   * @param {Metadata} meta gRPC metadata with `x-user-id`
   * @returns {Promise<Transaction[]>} Full transaction list for the export window
   */
  private async fetchAllTransactions(
    dto: GenerateExportDto,
    meta: Metadata,
  ): Promise<Transaction[]> {
    const PAGE_SIZE = 500;
    let page = 1;
    const allTx: Transaction[] = [];

    while (true) {
      const res = await lastValueFrom(
        this.financeService.getTransactions(
          {
            page,
            limit: PAGE_SIZE,
            startDate: dto.startDate,
            endDate: dto.endDate,
            categorySlug: [],
            type: dto.txType
              ? [TransactionType[dto.txType as keyof typeof TransactionType]]
              : [],
            source: [],
          },
          meta,
        ),
      );

      const batch = res.transactions ?? [];
      allTx.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      page++;
    }

    return allTx;
  }

  // ────────────────────────── monthly-summary ──────────────────────

  /**
   * @description Export monthly income/expense summary as PDF.
   *
   * Calls `getTransactionSummary`, filters `monthlySeries` by `startDate`/`endDate`, then
   * renders via {@link generateMonthlySummaryPdf}.
   *
   * @async
   * @private
   * @param {GenerateExportDto} dto Optional `startDate` and `endDate` (YYYY-MM-DD)
   * @param {Metadata} meta gRPC metadata with `x-user-id`
   * @param {string} periodLabel Cover subtitle shown on the PDF
   * @returns {Promise<Buffer>} PDF bytes
   */
  private async generateMonthlySummaryExport(
    dto: GenerateExportDto,
    meta: Metadata,
    periodLabel: string,
  ): Promise<{ buffer: Buffer; previewData: ExportPreviewData }> {
    const summary = await lastValueFrom(
      this.financeService.getTransactionSummary({}, meta),
    );
    const series = (summary.monthlySeries ?? []).filter((m) =>
      this.inDateRange(m.month, dto.startDate, dto.endDate),
    );

    const totalIncome = series.reduce((s, m) => s + parseFloat(m.income), 0);
    const totalExpense = series.reduce((s, m) => s + parseFloat(m.expense), 0);
    const netSaved = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? ((netSaved / totalIncome) * 100).toFixed(1) : '0';

    return {
      buffer: await generateMonthlySummaryPdf(series, periodLabel),
      previewData: {
        summary: [
          {
            label: 'Total Income',
            value: this.fmt(totalIncome),
            color: 'green',
          },
          {
            label: 'Total Expense',
            value: this.fmt(totalExpense),
            color: 'red',
          },
          {
            label: 'Net Saved',
            value: this.fmt(netSaved),
            color: netSaved >= 0 ? 'green' : 'red',
          },
          { label: 'Savings Rate', value: `${savingsRate}%`, color: 'primary' },
        ],
        headers: ['Month', 'Income', 'Expense', 'Net'],
        rows: [...series]
          .sort((a, b) => b.month.localeCompare(a.month))
          .slice(0, 12)
          .map((m) => {
            const inc = parseFloat(m.income);
            const exp = parseFloat(m.expense);
            return [m.month, this.fmt(inc), this.fmt(exp), this.fmt(inc - exp)];
          }),
      },
    };
  }

  // ────────────────────────── spending-breakdown ───────────────────

  /**
   * @description Export category spending breakdown as PNG or PDF.
   *
   * Calls `getSpendingTrend` with `dto.months` (default 6). `image` → {@link generateSpendingBreakdownImage},
   * otherwise → {@link generateSpendingBreakdownPdf}.
   *
   * @async
   * @private
   * @param {GenerateExportDto} dto Optional `months` lookback (1–12)
   * @param {Metadata} meta gRPC metadata with `x-user-id`
   * @param {string} periodLabel Cover subtitle for the export
   * @returns {Promise<Buffer>} PNG or PDF bytes
   */
  private async generateSpendingBreakdownExport(
    dto: GenerateExportDto,
    meta: Metadata,
    periodLabel: string,
  ): Promise<{ buffer: Buffer; previewData: ExportPreviewData }> {
    const months = dto.months ?? 6;
    const trend = await lastValueFrom(
      this.financeService.getSpendingTrend({ months }, meta),
    );
    const trendData = trend.data ?? [];

    const catMap = new Map<string, number>();
    for (const month of trendData) {
      for (const cat of month.byCategory ?? []) {
        catMap.set(cat.name, (catMap.get(cat.name) ?? 0) + cat.amount);
      }
    }
    const cats = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const total = cats.reduce((s, [, v]) => s + v, 0) || 1;

    return {
      buffer: await (dto.format === 'image'
        ? generateSpendingBreakdownImage(trendData, periodLabel)
        : generateSpendingBreakdownPdf(trendData, periodLabel)),
      previewData: {
        summary: [
          { label: 'Total Spending', value: this.fmt(total) },
          { label: 'Top Category', value: cats[0]?.[0] ?? '—' },
          { label: 'Period', value: periodLabel },
        ],
        headers: ['Category', 'Amount', '%'],
        rows: cats.map(([name, amt]) => [
          name,
          this.fmt(amt),
          `${((amt / total) * 100).toFixed(1)}%`,
        ]),
      },
    };
  }

  // ────────────────────────── budget-performance ───────────────────

  private async generateBudgetPerformanceExport(
    dto: GenerateExportDto,
    meta: Metadata,
    periodLabel: string,
  ): Promise<{ buffer: Buffer; previewData: ExportPreviewData }> {
    const now = new Date();
    const res = await lastValueFrom(
      this.financeService.getBudgets(
        { month: now.getMonth(), year: now.getFullYear() },
        meta,
      ),
    );
    const budgets = res.budgets ?? [];
    const totalLimit = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgets.reduce(
      (s, b) => s + parseFloat(b.spent ?? '0'),
      0,
    );
    const over = budgets.filter(
      (b) => parseFloat(b.spent ?? '0') > b.amount,
    ).length;

    return {
      buffer: await (dto.format === 'xlsx'
        ? generateBudgetXlsx(budgets)
        : generateBudgetPerformancePdf(budgets, periodLabel)),
      previewData: {
        summary: [
          { label: 'Total Budget', value: this.fmt(totalLimit) },
          {
            label: 'Total Spent',
            value: this.fmt(totalSpent),
            color: totalSpent > totalLimit ? 'red' : 'green',
          },
          {
            label: 'Over Limit',
            value: String(over),
            color: over > 0 ? 'red' : 'green',
          },
        ],
        headers: ['Budget', 'Limit', 'Spent', 'Status'],
        rows: budgets.map((b) => {
          const spent = parseFloat(b.spent ?? '0');
          return [
            b.name,
            this.fmt(b.amount),
            this.fmt(spent),
            spent > b.amount ? 'Over' : 'OK',
          ];
        }),
      },
    };
  }

  // ────────────────────────── goal-progress ────────────────────────

  private async generateGoalProgressExport(
    dto: GenerateExportDto,
    meta: Metadata,
    periodLabel: string,
  ): Promise<{ buffer: Buffer; previewData: ExportPreviewData }> {
    const res = await lastValueFrom(
      this.financeService.getGoals({ status: [], priority: [] }, meta),
    );
    const goals = res.goals ?? [];
    const onTrack = goals.filter((g) => {
      const pct =
        g.targetAmount > 0
          ? ((g.contributedAmount ?? 0) / g.targetAmount) * 100
          : 0;
      return pct >= 50;
    }).length;

    return {
      buffer: await (dto.format === 'xlsx'
        ? generateGoalXlsx(goals)
        : generateGoalProgressPdf(goals, periodLabel)),
      previewData: {
        summary: [
          { label: 'Total Goals', value: String(goals.length) },
          { label: 'On Track', value: String(onTrack), color: 'green' },
          {
            label: 'Behind',
            value: String(goals.length - onTrack),
            color: goals.length - onTrack > 0 ? 'red' : 'green',
          },
        ],
        headers: ['Goal', 'Target', 'Current', 'Progress'],
        rows: goals.map((g) => {
          const contributed = g.contributedAmount ?? 0;
          const pct =
            g.targetAmount > 0
              ? ((contributed / g.targetAmount) * 100).toFixed(1)
              : '0';
          return [
            g.name,
            this.fmt(g.targetAmount),
            this.fmt(contributed),
            `${pct}%`,
          ];
        }),
      },
    };
  }

  // ────────────────────────── net-worth ────────────────────────────

  private async generateNetWorthExport(
    dto: GenerateExportDto,
    meta: Metadata,
  ): Promise<{ buffer: Buffer; previewData: ExportPreviewData }> {
    const summary = await lastValueFrom(
      this.financeService.getTransactionSummary({}, meta),
    );
    const series = (summary.monthlySeries ?? []).filter((m) =>
      this.inDateRange(m.month, dto.startDate, dto.endDate),
    );
    const netBalance = parseFloat(summary.netBalance ?? '0');
    let running = 0;
    const cumulativeRows = [...series]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => {
        running += parseFloat(m.income) - parseFloat(m.expense);
        return [m.month, this.fmt(running)] as (string | null)[];
      });

    return {
      buffer: await (dto.format === 'image'
        ? generateNetWorthImage(series, summary.netBalance)
        : generateNetWorthPdf(series, summary.netBalance)),
      previewData: {
        summary: [
          {
            label: 'Net Balance',
            value: this.fmt(netBalance),
            color: netBalance >= 0 ? 'green' : 'red',
          },
          { label: 'Months Tracked', value: String(series.length) },
        ],
        headers: ['Month', 'Cumulative Net Worth'],
        rows: cumulativeRows.slice(-12),
      },
    };
  }

  // ================================================================
  //. Helpers
  // ================================================================

  /**
   * @description Ensure the requested format is allowed for the document type.
   *
   * @private
   * @param {ExportDocType} type Analytics document kind
   * @param {ExportFormat} format Output format
   * @throws {BadRequestException} When the pair is not listed in {@link SUPPORTED_FORMATS}
   */
  private validateFormatSupported(
    type: ExportDocType,
    format: ExportFormat,
  ): void {
    const supported = SUPPORTED_FORMATS[type];
    if (!supported.includes(format)) {
      throw new BadRequestException(
        `Format "${format}" is not supported for "${type}". Supported: ${supported.join(', ')}`,
      );
    }
  }

  /**
   * @description Build a stable download filename for the export.
   *
   * Pattern: `fintrack_{type}_{YYYYMMDD}.{ext}` where hyphens in type become underscores.
   *
   * @private
   * @param {ExportDocType} type Document type slug
   * @param {ExportFormat} format Determines file extension via {@link FILE_EXTENSIONS}
   * @param {string} iso ISO-8601 timestamp used for the date segment
   * @returns {string} Suggested filename for Content-Disposition / client download
   */
  private buildFilename(
    type: ExportDocType,
    format: ExportFormat,
    iso: string,
  ): string {
    const date = iso.slice(0, 10).replace(/-/g, '');
    return `fintrack_${type.replace(/-/g, '_')}_${date}.${FILE_EXTENSIONS[format]}`;
  }

  /**
   * @description Human-readable period string for PDF/image cover blocks.
   *
   * Priority: `startDate to endDate` → `Last N month(s)` → current calendar month name.
   *
   * @private
   * @param {GenerateExportDto} dto Export request with optional date or months fields
   * @returns {string} Subtitle shown on generated reports
   */
  private periodLabel(dto: GenerateExportDto): string {
    if (dto.startDate && dto.endDate)
      return `${dto.startDate} to ${dto.endDate}`;
    if (dto.months)
      return `Last ${dto.months} month${dto.months > 1 ? 's' : ''}`;
    return new Date().toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * @description Test whether a `YYYY-MM` month key falls within optional ISO date bounds.
   *
   * Compares only year-month segments (`startDate`/`endDate` sliced to 7 chars).
   * Returns true when both bounds are omitted.
   *
   * @private
   * @param {string} month Month key from Finance proto (e.g. `2025-06`)
   * @param {string} [startDate] Inclusive lower bound (YYYY-MM-DD)
   * @param {string} [endDate] Inclusive upper bound (YYYY-MM-DD)
   * @returns {boolean} Whether the month should be included in the export series
   */
  private fmt(amount: number): string {
    return formatNGN(amount);
  }

  private inDateRange(
    month: string,
    startDate?: string,
    endDate?: string,
  ): boolean {
    if (!startDate && !endDate) return true;
    if (startDate && month < startDate.slice(0, 7)) return false;
    if (endDate && month > endDate.slice(0, 7)) return false;
    return true;
  }
}
