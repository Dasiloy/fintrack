import { Observable, tap } from 'rxjs';

import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { minify } from '@fintrack/utils/log';

import { SKIP_LOG_KEY } from '../decorators/skip_log.decorator.js';
import { maskPayload } from './sensitive_fields.js';

/**
 * Global gRPC logging interceptor for all microservices.
 *
 * Behaviour:
 * - Routes decorated with `@SkipLog()` (class or method) are silently passed through.
 * - **Production**: logs only the method name and duration. No request or response
 *   data is written — this prevents sensitive fields from appearing in any log sink.
 * - **Development**: logs masked request data (all known-sensitive keys replaced with
 *   `[REDACTED]`) and a truncated response summary for debugging.
 * - Errors always log only the error message, never a full stack trace or request body.
 */
@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcLoggingInterceptor.name);
  private readonly isProd = process.env.NODE_ENV === 'production';

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'rpc') return next.handle();

    // @SkipLog on the handler or its controller → pass through silently
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_LOG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    const method = context.getHandler().name;
    const controller = context.getClass().name;
    const tag = `${controller}.${method}`;
    const now = Date.now();

    if (this.isProd) {
      // Production: method name only — no payload data ever enters the log stream
      this.logger.log(`→ ${tag}`);
      return next.handle().pipe(
        tap({
          next: () => this.logger.log(`← ${tag} ${Date.now() - now}ms`),
          error: (err: unknown) =>
            this.logger.error(
              `✗ ${tag} ${Date.now() - now}ms err=${(err as Error)?.message ?? String(err)}`,
            ),
        }),
      );
    }

    // Development: mask sensitive fields before serialising
    const masked = maskPayload(context.switchToRpc().getData());
    this.logger.log(`→ ${tag} req=${minify(masked, 200)}`);

    return next.handle().pipe(
      tap({
        next: (value: unknown) =>
          this.logger.log(`← ${tag} ${Date.now() - now}ms res=${minify(maskPayload(value), 120)}`),
        error: (err: unknown) =>
          this.logger.error(
            `✗ ${tag} ${Date.now() - now}ms err=${(err as Error)?.message ?? String(err)}`,
          ),
      }),
    );
  }
}