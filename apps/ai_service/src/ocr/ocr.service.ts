import type Redis from 'ioredis';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import type { Runnable } from '@langchain/core/runnables';

import { PrismaService } from '@fintrack/database/service';
import { OCRDraftStatus, Prisma } from '@fintrack/database/types';
import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';
import { OcrToTransactionJob } from '@fintrack/types/interfaces/finance';
import { EXTRACTION_TIMEOUT_MS } from '@fintrack/types/constants/ai.constants';

import { LangchainService } from '../registory/langchain.service';
import { ocrSchema, type OcrResult } from './schemas/ocr.schema';

@Injectable()
export class OcrService implements OnModuleInit {
  private readonly logger = new Logger(OcrService.name);
  private chain: Runnable<
    BaseLanguageModelInput,
    { raw: BaseMessage; parsed: OcrResult | null }
  >;
  private prompt: ChatPromptTemplate;

  constructor(
    private readonly prisma: PrismaService,
    private readonly langchain: LangchainService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Builds and caches the structured-output chain and the OCR prompt template
   * on module startup. Both are reused across all extraction calls.
   *
   * The prompt has two input variables:
   * - `{categories}` — newline-delimited `- slug (name)` list injected into the
   *   system message so the model categorises in one shot.
   * - `receipt` — `MessagesPlaceholder` replaced with a `HumanMessage` carrying
   *   the base64 inline image or PDF on each invocation.
   */
  onModuleInit() {
    this.chain = this.langchain.buildStructuredChain({
      modelId: 'google:gemini-2.5-flash',
      schema: ocrSchema,
      structuredOutputOptions: { strict: true },
    });

    this.prompt = ChatPromptTemplate.fromMessages([
      {
        role: 'system',
        content:
          `You are a receipt data extraction assistant. Extract financial transaction details from the provided receipt.\n\n` +
          `Fields to extract:\n` +
          `- amount: Total transaction amount as a number (no currency symbol)\n` +
          `- date: Transaction date in ISO YYYY-MM-DD format\n` +
          `- merchant: Merchant or vendor name\n` +
          `- description: Short description of the purchase\n` +
          `- categorySlug: Best matching slug from this list (return null if none fit):\n{categories}\n` +
          `- confidence: Your confidence in the extraction accuracy from 0.0 to 1.0\n\n` +
          `Return null for any field you cannot confidently determine. Do not guess.`,
      },
      new MessagesPlaceholder('receipt'),
    ]);
  }

  /**
   * Full extraction pipeline for a single OCR job.
   *
   * Steps:
   * 1. Update `OCRDraft` → `PROCESSING`, publish to `ocr:{draftId}`.
   * 2. Fetch the user's categories and the file from Cloudinary in parallel.
   * 3. Run `gemini-2.5-flash` structured extraction with a 45-second timeout.
   * 4a. On success: update → `COMPLETED`, write extracted fields, publish result.
   * 4b. On failure: update → `FAILED`, write `faliureReason`, publish error.
   *
   * Errors after the PROCESSING update are caught internally so BullMQ does
   * not retry — the user sees the failure immediately via the SSE stream and
   * can retry by re-uploading the receipt.
   * Errors before (the PROCESSING DB write) propagate, allowing BullMQ to retry.
   */
  async extract(job: OcrToTransactionJob): Promise<void> {
    const { id: draftId, userId, imageUrl, isPdf } = job;

    await this.prisma.oCRDraft.update({
      where: { id: draftId },
      data: { status: OCRDraftStatus.PROCESSING },
    });
    await this.redis.publish(
      `ocr:${draftId}`,
      JSON.stringify({ status: 'PROCESSING' }),
    );

    try {
      const [categories, { base64, mimeType }] = await Promise.all([
        this.prisma.category.findMany({
          where: { OR: [{ userId }, { userId: null }] },
          select: { slug: true, name: true },
          orderBy: { name: 'asc' },
        }),
        this.fetchAsBase64(imageUrl, isPdf),
      ]);

      const result = await Promise.race<OcrResult>([
        this.runExtraction(base64, mimeType, categories),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('OCR extraction timed out')),
            EXTRACTION_TIMEOUT_MS,
          ),
        ),
      ]);

      await this.prisma.oCRDraft.update({
        where: { id: draftId },
        data: {
          status: OCRDraftStatus.COMPLETED,
          amount: result.amount ?? null,
          date: result.date ? new Date(result.date) : null,
          merchant: result.merchant ?? null,
          description: result.description ?? null,
          confidence: result.confidence ?? null,
          rawData: result as Prisma.InputJsonValue,
        },
      });

      await this.redis.publish(
        `ocr:${draftId}`,
        JSON.stringify({ status: 'COMPLETED', ...result }),
      );

      this.logger.log(`OCR completed for draft ${draftId}`);
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : 'Extraction failed';

      this.logger.error(`OCR failed for draft ${draftId}: ${failureReason}`);

      await this.prisma.oCRDraft
        .update({
          where: { id: draftId },
          data: { status: OCRDraftStatus.FAILED, faliureReason: failureReason },
        })
        .catch(() => {});

      await this.redis
        .publish(
          `ocr:${draftId}`,
          JSON.stringify({ status: 'FAILED', failureReason }),
        )
        .catch(() => {});
    }
  }

  private async runExtraction(
    base64: string,
    mimeType: string,
    categories: { slug: string; name: string }[],
  ): Promise<OcrResult> {
    const categoryList = categories
      .map((c) => `- ${c.slug} (${c.name})`)
      .join('\n');

    const receiptMessage = new HumanMessage({
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${base64}` },
        },
      ],
    });

    const result = await this.prompt.pipe(this.chain).invoke({
      categories: categoryList,
      receipt: [receiptMessage],
    });

    this.logger.log(result.raw);

    if (!result.parsed) {
      throw new Error('Model returned empty or unparseable extraction result');
    }

    return result.parsed;
  }

  private async fetchAsBase64(
    url: string,
    isPdf: boolean,
  ): Promise<{ base64: string; mimeType: string }> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch receipt: HTTP ${response.status}`);
    }
    const contentType =
      response.headers.get('content-type') ??
      (isPdf ? 'application/pdf' : 'image/jpeg');
    const buffer = Buffer.from(await response.arrayBuffer());
    return { base64: buffer.toString('base64'), mimeType: contentType };
  }
}
