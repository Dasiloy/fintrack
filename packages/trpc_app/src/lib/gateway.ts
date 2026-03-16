import { TRPCError } from '@trpc/server';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';

/**
 * API Gateway base URL — read once at module load, validated immediately.
 * .
 */
export const GATEWAY_URL = process.env.API_GATEWAY_URL;
if (!GATEWAY_URL) throw new Error('API_GATEWAY_URL env var is not set');

/**
 * Map HTTP status codes to TRPC error codes
 *
 * @type {Record<number, TRPC_ERROR_CODE_KEY>}
 */
export const HTTP_TO_TRPC: Record<number, TRPC_ERROR_CODE_KEY> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  422: 'UNPROCESSABLE_CONTENT',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'INTERNAL_SERVER_ERROR',
  503: 'INTERNAL_SERVER_ERROR',
};

/**
 * Content types for the API gateway
 *
 * @enum {string}
 */
export enum ContentType {
  JSON = 'application/json',
  TEXT = 'text/plain',
  HTML = 'text/html',
  IMAGE = 'image/*',
  VIDEO = 'video/*',
  AUDIO = 'audio/*',
  APPLICATION = 'application/*',
  MULTIPART = 'multipart/form-data',
  FORM_DATA = 'application/x-www-form-urlencoded',
}

/**
 * Reads the gateway error body and throws a TRPCError with the correct code
 * mapped from the HTTP status. Use after every non-ok gateway response.
 *
 * Uses response.text() first so that non-JSON error bodies (e.g. HTML from a
 * proxy or load balancer) don't cause an unhandled parse exception.
 *
 * @example
 * if (!response.ok) await throwGatewayError(response);
 */
export async function throwGatewayError(response: Response): Promise<never> {
  const text = await response.text();
  let message = `Gateway error ${response.status}`;
  try {
    const body = JSON.parse(text) as StandardResponse<null>;
    message = body.message ?? message;
  } catch {
    // body is not JSON (proxy/load-balancer HTML page) — use the fallback message
  }
  throw new TRPCError({
    code: HTTP_TO_TRPC[response.status] ?? 'INTERNAL_SERVER_ERROR',
    message,
  });
}

/**
 * Builds the headers needed to forward an authenticated tRPC request
 * to the API gateway.
 *
 * Forwards both:
 * - Authorization: Bearer <token>  — set by the tRPC client (client.tsx) on every request
 * - Cookie                         — for any session cookie based flows
 */
export function gatewayHeaders(incomingHeaders: Headers, contentType?: ContentType): HeadersInit {
  const headers: Record<string, string> = {};

  if (contentType) headers['Content-Type'] = contentType;

  const authorization = incomingHeaders.get('authorization');
  if (authorization) headers['Authorization'] = authorization;

  const cookie = incomingHeaders.get('cookie');
  if (cookie) headers['Cookie'] = cookie;

  return headers;
}
