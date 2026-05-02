/**
 * A single row returned by the pgvector cosine-distance query in
 * `ClassificationService.fetchCorrection`.
 *
 * Represents a past user correction: the original transaction narration and
 * the category slug the user chose instead of the AI's suggestion.  Instances
 * are formatted as `"narration" => "slug"` few-shot examples in the
 * classification system prompt.
 */
export class Correction {
  narration: string;
  correctedSlug: string;
}
