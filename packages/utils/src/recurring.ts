/** Returns UTC midnight for the current day. */
export function utcToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Computes the next run date from a reference date based on frequency.
 * All arithmetic uses UTC to avoid DST boundary issues.
 */
export function computeNextRunAt(frequency: string, from: Date): Date {
  const next = new Date(from);

  switch (frequency) {
    case 'DAILY':
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case 'WEEKLY':
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case 'MONTHLY':
    case 'QUARTERLY': {
      const months = frequency === 'MONTHLY' ? 1 : 3;
      const day = next.getUTCDate();
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + months);
      // clamp to last valid day of target month (e.g. Jan 31 + 1mo → Feb 28)
      const lastDay = new Date(
        Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
      ).getUTCDate();
      next.setUTCDate(Math.min(day, lastDay));
      break;
    }
    case 'YEARLY':
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
    case 'CUSTOM':
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    default:
      throw new Error(`Unknown recurring frequency: "${frequency}"`);
  }

  return next;
}

/**
 * Finds the first run date strictly after `today` by stepping forward from
 * `startDate` in frequency increments, preserving the day-of-month anchor.
 *
 * Used when startDate is in the past so the item resumes at the next natural
 * cycle rather than immediately (e.g. May 2 MONTHLY → Jun 2).
 */
export function computeFirstRunAt(
  frequency: string,
  startDate: Date,
  today: Date,
): Date {
  let next = computeNextRunAt(frequency, startDate);
  while (next <= today) {
    next = computeNextRunAt(frequency, next);
  }
  return next;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Advance-notice lead time per frequency, in milliseconds.
 *
 * A high-frequency charge doesn't need a week's warning, but an annual
 * subscription should warn well ahead. `CUSTOM` mirrors `DAILY` since the
 * custom cadence is treated as daily by {@link computeNextRunAt}.
 */
export const REMINDER_LEAD_MS: Record<string, number> = {
  DAILY: 1 * HOUR_MS,
  WEEKLY: 1 * DAY_MS,
  BIWEEKLY: 2 * DAY_MS,
  MONTHLY: 3 * DAY_MS,
  QUARTERLY: 7 * DAY_MS,
  YEARLY: 14 * DAY_MS,
  CUSTOM: 1 * HOUR_MS,
};

/**
 * Computes the instant at which a reminder should first fire for an upcoming
 * occurrence — `nextRunAt` minus the frequency-scaled lead time.
 *
 * @param frequency RecurringItemFrequency value
 * @param nextRunAt The upcoming run/charge date
 * @returns The earliest Date a reminder for this occurrence should be sent
 */
export function computeReminderAt(frequency: string, nextRunAt: Date): Date {
  const lead = REMINDER_LEAD_MS[frequency] ?? DAY_MS;
  return new Date(nextRunAt.getTime() - lead);
}
