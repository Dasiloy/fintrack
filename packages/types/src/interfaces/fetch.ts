export interface FetcherRequestOptions {
  /** Request headers merged on top of any instance-level defaults */
  headers?: Record<string, string>;
  /** Request body — serialized to JSON automatically */
  body?: Record<string, unknown> | unknown[];
  /** Query-string params appended to the URL */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** AbortSignal for request cancellation / timeout */
  signal?: AbortSignal;
  /** Timeout in milliseconds — creates an internal AbortSignal when set */
  timeoutMs?: number;
  /**
   * When true the raw Response is returned instead of the parsed body.
   * Useful when the caller needs headers (e.g. pagination cursors) or
   * needs to decide how to decode the body itself.
   */
  raw?: boolean;
}

export interface FetcherResponse<T> {
  data: T;
  status: number;
  ok: boolean;
  headers: Headers;
}

export interface FetcherErrorContext {
  url: string;
  method: string;
  status: number;
  body: string;
}

export class FetcherHttpError extends Error {
  constructor(
    public readonly context: FetcherErrorContext,
    message: string,
  ) {
    super(message);
    this.name = 'FetcherHttpError';
  }
}
