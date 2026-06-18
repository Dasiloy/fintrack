import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

const SKIP_PATHS = new Set(['/health', '/api/health']);

/**
 * Global HTTP request logger (nestjs-pino).
 *
 * - Health-check paths are excluded from logging entirely.
 * - Authorization and Cookie headers are redacted in every log line.
 * - In development, output is pretty-printed via pino-pretty.
 * - In production, pino emits structured JSON suitable for log aggregation;
 *   no pretty-printer is loaded, keeping the payload minimal.
 * - Request serialiser logs only method + url; response logs only statusCode.
 *   No body or query parameters are ever serialised.
 */
@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                  messageFormat: '{req.method} {req.url} {res.statusCode} - {responseTime}ms',
                },
              }
            : undefined,
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          censor: '[REDACTED]',
        },
        autoLogging: {
          ignore: (req) => SKIP_PATHS.has((req as { url?: string }).url ?? ''),
        },
        serializers: {
          req: (req: { method: string; url: string }) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        },
      },
    }),
  ],
})
export class LoggerModule {}
