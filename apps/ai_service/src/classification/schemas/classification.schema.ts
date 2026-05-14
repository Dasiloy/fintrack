import { z } from 'zod';

/**
 * Zod schema passed to `LangchainService.buildStructuredChain` for the
 * `ClassifyTransactions` endpoint.
 *
 * The model is instructed to return one entry per input transaction — every
 * `transactionId` must appear in `classifications`.  The `categoryId` and
 * `categorySlug` values must match one of the user's categories supplied in
 * `{categories_json}`.
 */
export const classificationSchema = z.object({
  classifications: z.array(
    z.object({
      transactionId: z.string(),
      categoryId: z.string(),
      categorySlug: z.string(),
    }),
  ),
});

export type ClassificationSchema = z.infer<typeof classificationSchema>;
