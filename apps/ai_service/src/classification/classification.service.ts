import { status } from '@grpc/grpc-js';
import { BaseMessage } from '@langchain/core/messages';
import { Runnable } from '@langchain/core/runnables';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { ChatPromptTemplate } from '@langchain/core/prompts';

import { RpcException } from '@nestjs/microservices';
import { Injectable, Logger } from '@nestjs/common';

import {
  ClassifyTransactionsReq,
  ClassifyTransactionsRes,
} from '@fintrack/types/protos/ai/ai';
import { PrismaService } from '@fintrack/database/service';

import { LangchainService } from '../registory/langchain.service';
import { classificationSchema } from './schemas/classification.schema';
import { ModelRessolver } from '../registory/repositories';
import { Correction } from './dto/embedding.dto';

/**
 * Core service for AI-powered transaction classification.
 *
 * ## Classification pipeline (per `classifyTransaction` call)
 *
 * ### Phase 1 — Corrections lookup
 * Before invoking the model, `fetchCorrections` embeds every transaction
 * narration via `gemini-embedding-2` (1536 dims, `SEMANTIC_SIMILARITY` task
 * type) and runs a pgvector cosine-distance (`<=>`) query against
 * `ClassificationCorrection` for the calling user.  The single closest record
 * per narration is returned as a `Correction`.  These become few-shot examples
 * injected into the system prompt, steering the model toward preferences the
 * user has already expressed by correcting past classifications.
 *
 * ### Phase 2 — AI classification chain
 * A `ChatPromptTemplate` is composed at call time with:
 * - `{categories_json}` — the user's full category list (id + slug)
 * - `{transactions_json}` — the batch of transactions to classify
 * - `{corrections}` — newline-delimited `"narration" => "slug"` pairs
 *   (omitted from the system message when there are no corrections)
 *
 * The prompt is piped into a cached LangChain structured-output runnable
 * built on `gemini-2.5-flash` with `classificationSchema` (Zod).  The model
 * must return a JSON object whose `classifications` array maps every transaction
 * id to a `categoryId` + `categorySlug`.
 *
 * ### Null guard
 * If the model returns a truncated or empty response (`result.parsed == null`),
 * an `OUT_OF_RANGE` `RpcException` is thrown rather than propagating a silent
 * partial result.
 *
 * ## Chain setup
 * The LangChain runnable is initialised lazily on the first non-empty
 * classification call via `LangchainService.buildStructuredChain` with
 * `strict: true`, which enables JSON-mode on the Gemini API and guarantees the
 * output conforms to the schema.
 *
 * @class ClassificationService
 */
@Injectable()
export class ClassificationService {
  private classificationChain: Runnable<
    BaseLanguageModelInput,
    {
      raw: BaseMessage;
      parsed: ClassifyTransactionsRes;
    }
  > | null = null;
  private readonly logger = new Logger(ClassificationService.name);

  constructor(
    private readonly langchain: LangchainService,
    private readonly prisma: PrismaService,
    private readonly modelRessolver: ModelRessolver,
  ) {}

  /**
   * @description Classify a batch of Mono bank transactions against the user's categories
   * using a two-phase pipeline: corrections lookup via pgvector similarity search,
   * followed by an AI classification chain (gemini-2.5-flash + structured output).
   * Short-circuits with an empty result when the transaction list is empty.
   *
   * @async
   * @public
   * @param {string} userId Authenticated user's ID
   * @param {ClassifyTransactionsReq} req Batch of transactions and the user's category list
   * @returns {Promise<ClassifyTransactionsRes>} One classification entry per input transaction
   * @throws {RpcException} OUT_OF_RANGE if the model returns truncated or null output
   * @throws {RpcException} INTERNAL for unexpected errors
   */
  async classifyTransaction(
    userId: string,
    req: ClassifyTransactionsReq,
  ): Promise<ClassifyTransactionsRes> {
    const { categories, transactions } = req;

    // Empty transactions => immidiatev return
    if (transactions.length === 0)
      return {
        classifications: [],
      };

    try {
      // get corrections
      const corrections = await this.fetchCorrections(userId, transactions);

      // get system prompt
      const prompt = this.constructSystemPrompt(corrections);

      const result = await prompt.pipe(this.getClassificationChain()).invoke({
        categories_json: JSON.stringify(categories),
        transactions_json: JSON.stringify(transactions),
        corrections: corrections
          .map((c) => `"${c.narration}" => "${c.correctedSlug}"`)
          .join(`\n`),
      });

      this.logger.log(result.raw);

      if (!result.parsed) {
        throw new RpcException({
          code: status.OUT_OF_RANGE,
          message: 'Model returned null — likely truncated output',
        });
      }

      return result.parsed;
    } catch (error) {
      if (error instanceof RpcException) throw error;
      this.logger.error(JSON.stringify(error));
      throw new RpcException({
        code: status.INTERNAL,
        details: error,
        message: 'An error ocuured',
      });
    }
  }

  /**
   * @description Build a ChatPromptTemplate with three named input variables:
   * `{categories_json}`, `{transactions_json}`, and `{corrections}`.
   * The corrections block is conditionally shown in the system instruction only
   * when the user has prior correction records.
   *
   * @private
   * @param {Array<Correction>} corrections Previously saved user corrections
   * @returns {ChatPromptTemplate} Prompt ready to be piped into the classification chain
   */
  private constructSystemPrompt(
    corrections: Array<Correction>,
  ): ChatPromptTemplate<any, any> {
    return ChatPromptTemplate.fromMessages([
      {
        role: 'system',
        content: `You are a financial transaction classifier.
          User's categories: {categories_json}

          ${
            corrections.length > 0
              ? `This user has previously corrected these classifications — follow their preferences:
          `
              : ''
          }

          Return a JSON object mapping each transaction id to the best matching user category slug and id.
          Use the narration as the primary guide. The category field is a bank-provided hint and may be empty — rely on narration when it is. Try as much as possible to categorize the transaction  if even if codes and some aeird entry are in the narration, only fallback to the Miscellaneous category as the last resort.
          Every transaction id must appear in the output; if uncertain, pick the closest match.
          `,
      },
      {
        role: 'human',
        content: '{transactions_json}',
      },
    ]);
  }

  /**
   * @description Build and cache the gemini-2.5-flash structured-output chain
   * on first use so idle workers avoid paying this setup cost at startup.
   *
   * @private
   * @returns Structured classification runnable
   */
  private getClassificationChain(): Runnable<
    BaseLanguageModelInput,
    {
      raw: BaseMessage;
      parsed: ClassifyTransactionsRes;
    }
  > {
    if (this.classificationChain) {
      return this.classificationChain;
    }

    this.classificationChain = this.langchain.buildStructuredChain({
      modelId: 'google:gemini-2.5-flash',
      schema: classificationSchema,
      structuredOutputOptions: {
        strict: true,
      },
    });

    return this.classificationChain;
  }

  /**
   * @description Embed all transaction narrations via gemini-embedding-2 (1536 dims,
   * one request per text due to the model's batch-aggregation behaviour), then
   * fetch the closest ClassificationCorrection record per embedding.
   * Returns only the corrections that were found — missing ones are silently skipped.
   *
   * @async
   * @private
   * @param {string} userId Authenticated user's ID
   * @param {ClassifyTransactionsReq['transactions']} transactions Transactions to look up corrections for
   * @returns {Promise<Array<Correction>>} Matched corrections for the batch
   */
  private async fetchCorrections(
    userId: string,
    transactions: ClassifyTransactionsReq['transactions'],
  ): Promise<Array<Correction>> {
    const embeddings = await this.modelRessolver
      .getEmbeddingRepo('google:gemini-embedding-2')
      .embed(
        transactions.map((t) => t.narration),
        {
          model: 'gemini-embedding-2',
          dimensions: 1536,
        },
      );

    const corrections: Array<Correction> = [];
    for (const transaction of transactions) {
      const correction = await this.fetchCorrection(
        userId,
        embeddings[transactions.indexOf(transaction)],
      );

      if (correction) corrections.push(correction);
    }

    return corrections;
  }

  /**
   * @description Run a pgvector cosine-distance (`<=>`) query against the
   * ClassificationCorrection table for the given user and embedding, returning
   * the single closest correction record. Returns undefined when no record exists
   * or the query fails — errors are logged but never rethrown so a correction
   * miss never blocks the main classification call.
   *
   * @async
   * @private
   * @param {string} userId Authenticated user's ID
   * @param {number[]} embedding 1536-dim vector for the transaction narration
   * @returns {Promise<Correction | undefined>} Closest correction or undefined
   */
  private async fetchCorrection(
    userId: string,
    embedding: number[],
  ): Promise<Correction | undefined> {
    try {
      const vectorStr = `[${embedding.join(',')}]`;
      const corrections = await this.prisma.$queryRaw<
        Array<{ narration: string; correctedSlug: string }>
      >`SELECT "narration","correctedSlug"
         FROM "ClassificationCorrection"
         WHERE "userId" =${userId}
         AND embedding IS NOT NULL
         ORDER BY embedding <=> ${vectorStr}::vector
         LIMIT 1
        `;

      if (corrections.length) {
        return corrections[0];
      }
    } catch (error) {
      this.logger.error(JSON.stringify(error));
    }
  }
}
