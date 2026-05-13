import { z } from 'zod';

/**
 * Zod schema for structured OCR extraction output.
 *
 * All fields are nullable — the model is instructed to return null when it
 * cannot confidently extract a value rather than hallucinating one.
 *
 * `categorySlug` is resolved in one shot by supplying the user's category list
 * in the prompt, eliminating a follow-up classification call.
 */
export const ocrSchema = z.object({
  amount: z.number().optional().describe('Transaction amount as a number, omit if unknown'),
  date: z
    .string()
    .optional()
    .describe('Transaction date in ISO YYYY-MM-DD format, omit if unknown'),
  merchant: z.string().optional().describe('Merchant or vendor name, omit if unknown'),
  description: z
    .string()
    .optional()
    .describe('Short description of the purchase, omit if unknown'),
  categorySlug: z
    .string()
    .optional()
    .describe('Matching category slug from the provided list, omit if none fit'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Extraction confidence score between 0 and 1, omit if unknown'),
});

export type OcrResult = z.infer<typeof ocrSchema>;
