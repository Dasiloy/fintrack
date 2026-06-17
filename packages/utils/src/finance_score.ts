/**
 * Pure scoring math for the weekly **Financial Health Score** (BL-008).
 *
 * DB-free and weight-agnostic (callers pass the weight constants from
 * `@fintrack/types/constants/finance.constant`) so the same formulas back both
 * the per-user computation (finance_service) and the batched weekly snapshot
 * job (scheduler_service) — one authoritative formula, each caller owning its
 * own (single vs. bulk) data access.
 */

/** Clamps `n` into the inclusive `[min, max]` range. */
export function clampScore(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Rounds to one decimal place to match the `Decimal(4,1)` score columns. */
export function roundScore(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Savings-rate component. `(income − expense) / income` clamped to `[0, 1]`,
 * scaled to `weight`. Returns 0 when there is no income to measure against.
 */
export function savingScore(income: number, expense: number, weight: number): number {
  if (income <= 0) return 0;
  return clampScore((income - expense) / income, 0, 1) * weight;
}

/**
 * Generic adherence/health ratio scaled to `weight`. When `total` is 0 there is
 * nothing to assess, which scores **full marks** (absence of a problem = healthy).
 */
export function ratioScore(passed: number, total: number, weight: number): number {
  if (total <= 0) return weight;
  return (passed / total) * weight;
}

/**
 * Whether a savings goal is on pace: its contributed fraction (`saved / target`)
 * is at least its expected fraction (elapsed share of the `createdAt`→`targetDate`
 * window). All times are epoch milliseconds.
 */
export function isGoalOnPace(
  saved: number,
  target: number,
  createdAtMs: number,
  targetDateMs: number,
  nowMs: number,
): boolean {
  const actualFraction = target > 0 ? saved / target : 1;
  const totalMs = targetDateMs - createdAtMs;
  const expectedFraction =
    totalMs <= 0 ? 1 : clampScore((nowMs - createdAtMs) / totalMs, 0, 1);
  return actualFraction >= expectedFraction;
}
