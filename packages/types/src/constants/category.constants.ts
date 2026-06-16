/**
 * Slug of the single system "Income" category.
 */
export const INCOME_CATEGORY_SLUG = 'cat-income';

/**
 * Slug of the system "Savings & Investments" category — also treated as income.
 */
export const SAVINGS_CATEGORY_SLUG = 'cat-savings';

/**
 * Slug of the system "Miscellaneous" category — the default fallback target when
 * reassigning a deleted category's linked items.
 */
export const MISC_CATEGORY_SLUG = 'cat-misc';

/**
 * Categories whose transactions are always income. When one of these is chosen
 * the transaction type is forced to INCOME and locked (not user-editable).
 *
 * Every other category defaults to EXPENSE but the user may switch the type
 * (e.g. a user-created category that represents income).
 */
export const FORCED_INCOME_CATEGORY_SLUGS = [
  INCOME_CATEGORY_SLUG,
  SAVINGS_CATEGORY_SLUG,
] as const;

/**
 * Returns true if the category always represents income (type forced + locked).
 */
export function isForcedIncomeCategory(slug: string): boolean {
  return (FORCED_INCOME_CATEGORY_SLUGS as readonly string[]).includes(slug);
}
