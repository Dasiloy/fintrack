/**
 * Transient error predicates for LangGraph `retryPolicy.retryOn`.
 *
 * LangGraph re-invokes the whole node when `retryOn` returns true.
 * These cover the two distinct transient classes in the AI service:
 *   - LLM API errors  — rate limits, model overload, provider timeouts
 *   - Network errors  — DB/gRPC connection drops, DNS failures, TCP resets
 *
 * Usage:
 *   graph.addNode('my_node', handler, {
 *     retryPolicy: { maxAttempts: 2, initialInterval: 2.0, retryOn: isTransientLLMError },
 *   });
 */

/** True for transient LLM API errors: rate limits, overload, and network faults. */
export const isTransientLLMError = (err: any): boolean => {
  const msg: string = (err?.message ?? '').toLowerCase();
  const status: number = err?.status ?? err?.statusCode ?? err?.code ?? 0;
  return (
    status === 429 ||
    status === 502 ||
    status === 503 ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('network error')
  );
};

/** True for transient network/DB/gRPC errors: timeouts, DNS failures, TCP resets. */
export const isTransientNetworkError = (err: any): boolean => {
  const msg: string = (err?.message ?? '').toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('unavailable') ||
    msg.includes('enotfound') ||
    msg.includes('network')
  );
};
