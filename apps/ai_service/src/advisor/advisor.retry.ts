import {
  RetryPolicy,
  isGraphBubbleUp,
  isGraphInterrupt,
} from '@langchain/langgraph';

// ── Fault tolerance ───────────────────────────────────────────────────────────
// Per-node retry policy for the advisor graph (LangGraph "Retries"). Applied to
// the nodes that make external calls (model/DB) and where a transient blip
// should not fail the whole turn. Non-critical nodes (compact, memory) instead
// degrade gracefully in their own try/catch and are deliberately NOT retried, so
// a failure there can never fail a turn.
//
// Note: per-node `timeout` / `errorHandler` / `setNodeDefaults` require
// @langchain/langgraph >= 1.4.0; this project is on 1.2.9, so `retryPolicy` is
// the available mechanism. After retries are exhausted the error propagates and
// is turned into a single, user-safe error chunk upstream.

/** Network-level error codes that indicate a transient, retryable failure. */
const TRANSIENT_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNABORTED',
  'EAI_AGAIN',
  'EPIPE',
  'ENETUNREACH',
]);

/** Substrings that, in an error message, strongly imply a transient failure. */
const TRANSIENT_MESSAGE = [
  'rate limit',
  'too many requests',
  'timeout',
  'timed out',
  'overloaded',
  'temporarily unavailable',
  'service unavailable',
  'unavailable',
  'connection error',
  'connection reset',
  'socket hang up',
  '429',
  '500',
  '502',
  '503',
  '504',
];

/**
 * Conservative retry predicate: retry only on *known* transient signals and
 * never on control-flow, cancellation, or deterministic client errors. Defaults
 * to NOT retrying unknown errors, so a deterministic bug isn't retried 3× — only
 * genuine transient failures (rate limits, 5xx, network resets) are.
 */
export function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // LangGraph control flow (interrupts / Command routing) must never be retried.
  if (isGraphInterrupt(error) || isGraphBubbleUp(error)) return false;

  const e = error as {
    name?: string;
    code?: string;
    status?: number;
    response?: { status?: number };
    error?: { code?: string };
    message?: string;
  };

  // Explicit cancellation / abort — not retryable.
  if (e.name === 'AbortError') return false;
  if (typeof e.message === 'string' && /^(Cancel|AbortError)/.test(e.message)) {
    return false;
  }

  // Provider quota exhausted — retrying won't help.
  if (e.error?.code === 'insufficient_quota') return false;

  // HTTP status: 408/425/429 and 5xx are transient; other 4xx are permanent.
  const status = e.response?.status ?? e.status;
  if (typeof status === 'number') {
    if (status === 408 || status === 425 || status === 429 || status >= 500) {
      return true;
    }
    return false;
  }

  // Network-level transient codes.
  if (e.code && TRANSIENT_NETWORK_CODES.has(e.code)) return true;

  // Last resort: message heuristics for SDKs that don't surface a status/code.
  const msg = (e.message ?? '').toLowerCase();
  if (TRANSIENT_MESSAGE.some((needle) => msg.includes(needle))) return true;

  return false;
}

/**
 * Shared retry policy for the advisor's external-call nodes: up to 3 attempts
 * with jittered exponential backoff, retrying only genuinely transient errors.
 */
export const ADVISOR_NODE_RETRY: RetryPolicy = {
  maxAttempts: 3,
  initialInterval: 500,
  backoffFactor: 2,
  maxInterval: 8000,
  jitter: true,
  retryOn: isRetryableError,
};
