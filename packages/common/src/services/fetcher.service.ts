import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  FetcherHttpError,
  FetcherRequestOptions,
  FetcherResponse,
} from '@fintrack/types/interfaces/fetch';

@Injectable()
export class FetcherService {
  private readonly logger = new Logger(FetcherService.name);

  async request<T = unknown>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    options: FetcherRequestOptions = {},
  ): Promise<FetcherResponse<T>> {
    const { headers, body, params, signal, timeoutMs, raw } = options;

    const resolvedUrl = params ? this.appendParams(url, params) : url;

    let abortSignal = signal;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs && !signal) {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      abortSignal = controller.signal;
    }

    let response: Response;

    try {
      response = await fetch(resolvedUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: abortSignal,
      });
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === 'AbortError' && timeoutMs;
      this.logger.error(
        `${method} ${resolvedUrl} — ${isTimeout ? `timed out after ${timeoutMs}ms` : String(err)}`,
      );
      throw new HttpException(
        isTimeout ? 'Request timed out' : 'Network error',
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`${method} ${resolvedUrl} failed (${response.status}): ${text}`);
      throw new FetcherHttpError(
        { url: resolvedUrl, method, status: response.status, body: text },
        `HTTP ${response.status}`,
      );
    }

    if (raw) {
      return {
        data: response as unknown as T,
        status: response.status,
        ok: response.ok,
        headers: response.headers,
      };
    }

    const contentType = response.headers.get('content-type') ?? '';
    const data: T = contentType.includes('application/json')
      ? ((await response.json()) as T)
      : ((await response.text()) as unknown as T);

    return { data, status: response.status, ok: true, headers: response.headers };
  }

  get<T = unknown>(url: string, options?: FetcherRequestOptions) {
    return this.request<T>(url, 'GET', options);
  }

  post<T = unknown>(
    url: string,
    body: Record<string, unknown> | unknown[],
    options?: Omit<FetcherRequestOptions, 'body'>,
  ) {
    return this.request<T>(url, 'POST', { ...options, body });
  }

  put<T = unknown>(
    url: string,
    body: Record<string, unknown> | unknown[],
    options?: Omit<FetcherRequestOptions, 'body'>,
  ) {
    return this.request<T>(url, 'PUT', { ...options, body });
  }

  patch<T = unknown>(
    url: string,
    body: Record<string, unknown> | unknown[],
    options?: Omit<FetcherRequestOptions, 'body'>,
  ) {
    return this.request<T>(url, 'PATCH', { ...options, body });
  }

  delete<T = unknown>(url: string, options?: FetcherRequestOptions) {
    return this.request<T>(url, 'DELETE', options);
  }

  /**
   * Wraps a `FetcherHttpError` into an `HttpException` with a caller-supplied
   * message and status. Use at the service boundary to control what the client
   * sees vs. what gets logged.
   *
   * @example
   * catch (err) {
   *   throw this.fetcher.toHttpException(err, 'Failed to fetch account', 502);
   * }
   */
  toHttpException(
    err: unknown,
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ): HttpException {
    if (err instanceof FetcherHttpError) {
      this.logger.error(
        `${message}: HTTP ${err.context.status} from ${err.context.url} — ${err.context.body}`,
      );
    }
    return new HttpException(message, status);
  }

  private appendParams(
    url: string,
    params: Record<string, string | number | boolean | undefined | null>,
  ): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        qs.append(key, String(value));
      }
    }
    const query = qs.toString();
    return query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url;
  }
}
