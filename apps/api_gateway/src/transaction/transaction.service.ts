import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom, Observable } from 'rxjs';
import { Queue } from 'bullmq';

import { ClientGrpc } from '@nestjs/microservices';
import {
  forwardRef,
  Inject,
  Injectable,
  MessageEvent,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';

import {
  OCR_QUEUE,
  OCR_QUEUE_JOB,
} from '@fintrack/types/constants/queus.constants';
import { PrismaService } from '@fintrack/database/service';
import { OcrToTransactionJob } from '@fintrack/types/interfaces/finance';
import { OCRDraft, OCRDraftStatus, User } from '@fintrack/database/types';
import { REDIS_SUBSCRIBER } from '@fintrack/types/constants/redis.costants';
import type Redis from 'ioredis';
import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  BatchCreateTransactionsReq,
  BatchCreateTransactionsRes,
  TransactionSource,
  TransactionType,
} from '@fintrack/types/protos/finance/transaction';
import {
  AI_PACKAGE_NAME,
  AI_SERVICE_NAME,
  AiServiceClient,
  ClassifyTransactionsReq,
  ClassifyTransactionsRes,
} from '@fintrack/types/protos/ai/ai';

import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { TransactionQueryDto } from './dto/transaction_query.dto';
import { BudgetService } from '../budget/budget.service';

/**
 * API Gateway service for transaction CRUD operations.
 * Proxies HTTP requests to the Finance microservice via gRPC.
 *
 * @class TransactionService
 */
@Injectable()
export class TransactionService implements OnModuleInit {
  private financeServiceClient: FinanceServiceClient;
  private aiServiceClient: AiServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly financeClient: ClientGrpc,
    @Inject(AI_PACKAGE_NAME) private readonly aiClient: ClientGrpc,
    @InjectQueue(OCR_QUEUE) private readonly OcrQueue: Queue,
    @Inject(forwardRef(() => BudgetService))
    private readonly budgetService: BudgetService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_SUBSCRIBER) private readonly redisSubscriber: Redis,
  ) {}

  onModuleInit() {
    this.financeServiceClient =
      this.financeClient.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
    this.aiServiceClient =
      this.aiClient.getService<AiServiceClient>(AI_SERVICE_NAME);
  }

  /**
   * Creates a new manual transaction for the authenticated user.
   * Amount is serialized to string for gRPC transport and enum values
   * are mapped from their DTO string form to the proto enum integer.
   *
   * @param user - Authenticated user
   * @param createTransactionDto - Transaction payload
   * @returns The created transaction
   */
  async createTransaction(
    user: User,
    createTransactionDto: CreateTransactionDto,
  ) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    const result = await lastValueFrom(
      this.financeServiceClient.createTransaction(
        {
          ...createTransactionDto,
          amount: String(createTransactionDto.amount),
          type: TransactionType[createTransactionDto.type],
          source: TransactionSource[createTransactionDto.source],
        },
        metadata,
      ),
    );
    void this.budgetService.invalidateBudgetListAndTrend(user.id);
    return result;
  }

  /**
   * Retrieves a paginated, filtered list of transactions for the authenticated user.
   * type and source arrays are mapped from DTO enum strings to proto enum integers.
   * categorySlug and date range filters are forwarded as-is.
   *
   * @param user - Authenticated user
   * @param query - Pagination and filter parameters
   * @returns Paginated transaction list with meta
   */
  async getAllTransactions(user: User, query: TransactionQueryDto) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    return lastValueFrom(
      this.financeServiceClient.getTransactions(
        {
          page: query.page,
          limit: query.limit,
          categorySlug: query.categorySlug || [],
          type: query.type?.map((type) => TransactionType[type]) || [],
          source:
            query.source?.map((source) => TransactionSource[source]) || [],
          startDate: query.startDate,
          endDate: query.endDate,
        },
        metadata,
      ),
    );
  }

  /**
   * Retrieves a single transaction by ID scoped to the authenticated user.
   *
   * @param id - Transaction ID
   * @param user - Authenticated user
   * @returns The matching transaction
   */
  async getTransactionById(id: string, user: User) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    return lastValueFrom(
      this.financeServiceClient.getTransaction({ id }, metadata),
    );
  }

  /**
   * Updates a transaction by ID.
   * Amount and type are optional — only provided fields are forwarded.
   * Amount is serialized to string for gRPC transport when present.
   *
   * @param id - Transaction ID to update
   * @param user - Authenticated user
   * @param updateTransactionDto - Fields to update
   * @returns The updated transaction
   */
  async updateTransactionById(
    id: string,
    user: User,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    const result = await lastValueFrom(
      this.financeServiceClient.updateTransaction(
        {
          id,
          ...updateTransactionDto,
          amount: String(updateTransactionDto.amount),
          type: updateTransactionDto.type
            ? TransactionType[updateTransactionDto.type]
            : undefined,
        },
        metadata,
      ),
    );
    void this.budgetService.invalidateBudgetListAndTrend(user.id);
    return result;
  }

  /**
   * Deletes a transaction by ID scoped to the authenticated user.
   *
   * @param id - Transaction ID to delete
   * @param user - Authenticated user
   * @returns Empty response on success
   */
  async deleteTransactionById(id: string, user: User) {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);

    const result = await lastValueFrom(
      this.financeServiceClient.deleteTransaction({ id }, metadata),
    );
    void this.budgetService.invalidateBudgetListAndTrend(user.id);
    return result;
  }

  /**
   * Batch-creates bank-sourced transactions from a background sync job.
   * Uses a single gRPC call with createMany + skipDuplicates on the finance
   * service side — much cheaper than N individual creates.
   *
   * @param userId - ID of the owning user
   * @param req - Batch request with transactions + optional monoBankAccountId
   */
  async batchCreateMonoTransactions(
    userId: string,
    req: BatchCreateTransactionsReq,
  ): Promise<BatchCreateTransactionsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', userId);
    const result = await lastValueFrom(
      this.financeServiceClient.batchCreateTransactions(req, metadata),
    );
    if (result.created > 0) {
      void this.budgetService.invalidateBudgetListAndTrend(userId);
    }
    return result;
  }

  /**
   * Runs transaction classification.
   *
   * @param {string} userId - Authenticated user id
   * @param ClassifyTransactionsReq - Classification data
   * @returns {Promise<ClassifyTransactionsRes>}
   */
  async classifyTransactions(
    userId: string,
    req: ClassifyTransactionsReq,
  ): Promise<ClassifyTransactionsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', userId);

    return lastValueFrom(
      this.aiServiceClient.classifyTransactions(req, metadata),
    );
  }

  /**
   * Upserts an `OCRDraft` row keyed on `imageKey` (the Cloudinary `secure_url`).
   *
   * `imageKey` carries a global `@unique` constraint, so the same receipt URL from any
   * user resolves to one row. The `update: {}` no-op means an existing row (any status)
   * is returned unchanged — no duplicate rows, no status regression.
   *
   * @async
   * @public
   * @param {User} user - Authenticated user creating or re-using the draft
   * @param {string} secure_url - Cloudinary `secure_url` used as the idempotency key
   * @returns {Promise<OCRDraft>} Newly created draft (status PENDING) or existing row as-is
   */
  async createOcrDraft(user: User, secure_url: string): Promise<OCRDraft> {
    const draft = await this.prisma.oCRDraft.upsert({
      where: {
        userId: user.id,
        imageKey: secure_url,
      },
      create: {
        status: 'PENDING',
        userId: user.id,
        imageKey: secure_url,
      },
      update: {},
    });

    // Reset FAILED drafts so the user can retry with the same file.
    // COMPLETED and PROCESSING rows are left untouched.
    if (draft.status === OCRDraftStatus.FAILED) {
      return this.prisma.oCRDraft.update({
        where: { id: draft.id },
        data: { status: OCRDraftStatus.PENDING, faliureReason: null },
      });
    }

    return draft;
  }

  /**
   * Enqueues an `OCR_QUEUE_JOB` for the given draft, **only if its status is PENDING**.
   *
   * The PENDING guard is the primary token-burn prevention mechanism: if the draft was
   * returned from the upsert with an existing status (PROCESSING / COMPLETED / FAILED),
   * the job is not re-enqueued. The original worker is either still running or has already
   * written a result the client can read via the SSE stream.
   *
   * @async
   * @public
   * @param {OCRDraft} ocrDraft - Upserted draft whose `status` determines whether to enqueue
   * @param {boolean} isPdf - Whether the receipt is a PDF; passed to the AI processor to
   *   select the correct model input format (inline PDF vs image bytes)
   * @returns {Promise<void>}
   */
  async enqueueOcrDraft(ocrDraft: OCRDraft, isPdf: boolean): Promise<void> {
    if (ocrDraft.status === OCRDraftStatus.PENDING) {
      void (await this.OcrQueue.add(OCR_QUEUE_JOB, {
        id: ocrDraft.id,
        userId: ocrDraft.userId,
        imageUrl: ocrDraft.imageKey,
        isPdf,
      } satisfies OcrToTransactionJob));
    }
  }

  // ================================================================
  // OCR Draft SSE stream
  // ================================================================

  /**
   * Returns an `Observable<MessageEvent>` that streams OCR extraction progress
   * for the given draft via Server-Sent Events.
   *
   * Lifecycle:
   * - **Cache fast-forward**: checks `ocr_result:{draftId}` in Redis first.
   *   On hit, verifies ownership with a lightweight `count` then emits and completes
   *   immediately — no pub/sub, no full DB query.
   * - **DB fast-forward**: on cache miss, fetches the draft. If already
   *   `COMPLETED` or `FAILED`, emits the status and completes.
   * - **Synthetic PROCESSING**: if the draft is `PROCESSING` when the stream
   *   opens, emits `{ status: PROCESSING }` so the frontend activates its scan
   *   animation even if the Redis PROCESSING message was missed.
   * - **Live stream**: attaches a per-observer `message` listener to the shared
   *   `REDIS_SUBSCRIBER` connection, then subscribes to `ocr:{draftId}`.
   *   On a terminal event the result is written to the Redis cache so future
   *   reconnects skip the pub/sub path entirely.
   * - **55-second timeout**: emits `{ status: FAILED, failureReason: "timeout" }`
   *   and completes before the 60-second client `EventSource` timeout.
   * - **Teardown**: NestJS calls the returned cleanup on HTTP response close —
   *   removes the listener and unsubscribes from Redis.
   *
   * @param {User} user - Authenticated user; used for ownership validation
   * @param {string} draftId - `OCRDraft.id` returned by `POST /upload/receipt`
   * @returns {Observable<MessageEvent>}
   */
  streamOcrDraft(user: User, draftId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((observer) => {
      const channel = `ocr:${draftId}`;
      let timer: NodeJS.Timeout | null = null;
      let cancelled = false;

      const messageHandler = (ch: string, message: string) => {
        if (ch !== channel) return;

        let data: unknown;
        try {
          data = JSON.parse(message);
        } catch {
          data = { raw: message };
        }

        const isTerminal =
          typeof data === 'object' &&
          data !== null &&
          'status' in data &&
          ((data as { status: string }).status === OCRDraftStatus.COMPLETED ||
            (data as { status: string }).status === OCRDraftStatus.FAILED);

        observer.next({ data } as MessageEvent);

        if (isTerminal) {
          cleanup();
          // Delay before closing so the browser receives the message event
          // before the connection closes (avoids onerror firing instead of onmessage).
          setTimeout(() => observer.complete(), 1500);
        }
      };

      const cleanup = () => {
        cancelled = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        this.redisSubscriber.off('message', messageHandler);
        void this.redisSubscriber.unsubscribe(channel);
      };

      (async () => {
        const draft = await this.prisma.oCRDraft.findFirst({
          where: { id: draftId, userId: user.id },
        });
        if (cancelled) return;

        if (!draft) {
          observer.error(new NotFoundException('Draft not found'));
          return;
        }

        if (
          draft.status === OCRDraftStatus.COMPLETED ||
          draft.status === OCRDraftStatus.FAILED
        ) {
          const payload =
            draft.status === OCRDraftStatus.COMPLETED
              ? { status: draft.status, ...(draft.rawData as object) }
              : { status: draft.status, failureReason: draft.faliureReason };
          observer.next({ data: payload } as MessageEvent);
          // Delay before closing so the browser receives the message event
          // before the connection closes (avoids onerror firing instead of onmessage).
          timer = setTimeout(() => {
            cleanup();
            observer.complete();
          }, 1500);
          return;
        }

        if (draft.status === OCRDraftStatus.PROCESSING) {
          observer.next({ data: { status: 'PROCESSING' } } as MessageEvent);
        }

        this.redisSubscriber.on('message', messageHandler);
        await this.redisSubscriber.subscribe(channel);

        timer = setTimeout(() => {
          observer.next({
            data: { status: OCRDraftStatus.FAILED, failureReason: 'timeout' },
          } as MessageEvent);
          cleanup();
          observer.complete();
        }, 55_000);
      })().catch((err: unknown) => {
        if (!cancelled) observer.error(err);
      });

      return cleanup;
    });
  }
}
