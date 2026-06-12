import * as crypto from 'crypto';

/**
 * Stable, non-reversible hash of a normalised email address used as the
 * trial-abuse guard key. The same hash is written when the trial is claimed
 * and read back on every signup/login to decide eligibility.
 *
 * Normalisation: trim whitespace + lowercase → SHA-256 (hex).
 * Survives account deletion (the hash row is never removed).
 */
export function emailTrialHash(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}
