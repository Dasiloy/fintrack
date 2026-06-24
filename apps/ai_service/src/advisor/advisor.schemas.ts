import { z } from 'zod';

/**
 * Structured output for the guardian node. A single boolean keeps the call cheap
 * and makes the routing decision unambiguous.
 */
export const GuardianSchema = z.object({
  relevant: z
    .boolean()
    .describe(
      'true if the message relates to personal finance; false if clearly off-topic',
    ),
});

export type GuardianResult = z.infer<typeof GuardianSchema>;

/**
 * Structured output for the long-term memory extractor. The model distils only
 * *durable, cross-conversation* facts from a transcript — never transient
 * chit-chat. Empty arrays / nulls are expected and normal when a turn carries
 * nothing worth remembering.
 */
export const MemoryExtractionSchema = z.object({
  currency: z
    .string()
    .nullable()
    .describe(
      "The user's preferred currency code if clearly stated (e.g. 'NGN'); null otherwise.",
    ),
  tone: z
    .string()
    .nullable()
    .describe(
      "A durable tone/communication preference if expressed (e.g. 'concise', 'encouraging'); null otherwise.",
    ),
  context: z
    .array(z.string())
    .describe(
      'Durable life-situation facts that should persist across conversations ' +
        "(e.g. 'freelancer with irregular income', 'saving for a house deposit', " +
        "'supports two dependants'). Short noun phrases. Empty if none.",
    ),
  patterns: z
    .array(z.string())
    .describe(
      'Durable spending/financial patterns worth remembering ' +
        "(e.g. 'high monthly food-delivery spend', 'Netflix subscription ~NGN 4,400/mo'). " +
        'Short phrases. Empty if none.',
    ),
});

export type MemoryExtraction = z.infer<typeof MemoryExtractionSchema>;
