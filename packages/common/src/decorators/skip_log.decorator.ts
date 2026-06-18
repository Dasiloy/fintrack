import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by `GrpcLoggingInterceptor` to detect the `@SkipLog` decorator.
 */
export const SKIP_LOG_KEY = 'SKIP_LOG';

/**
 * Suppresses all request/response logging for the decorated controller or handler.
 *
 * Apply at the **controller class** level to silence every method in that controller,
 * or at the **method** level to suppress a single route.
 *
 * Use on any route that handles credentials, tokens, or other secrets whose presence
 * in log output would constitute a data-protection violation.
 *
 * @example
 * ```ts
 * @SkipLog()
 * @Controller()
 * export class AuthController { ... }
 * ```
 */
export const SkipLog = () => SetMetadata(SKIP_LOG_KEY, true);
