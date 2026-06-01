import { Observable, tap } from 'rxjs';

import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';

import { minify } from '@fintrack/utils/log';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcLoggingInterceptor.name);

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    const rpc = context.switchToRpc();
    const method = context.getHandler().name;
    const controller = context.getClass().name;

    const grpcLogMaxLen = this.configService.get('GRPC_LOG_MAX_LEN');
    const grpcLogFull = this.configService.get('GRPC_LOG_FULL');

    const logMaxLen = grpcLogMaxLen ? parseInt(grpcLogMaxLen, 10) : undefined;
    const logFull = grpcLogFull === 'true';

    this.logger.log(`→ ${controller}.${method} req=${minify(rpc.getData(), undefined, true)}`);

    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: (value) => {
          this.logger.log(
            `← ${controller}.${method} ${Date.now() - now}ms res=${minify(value, logMaxLen, logFull)}`,
          );
        },
        error: (err) => {
          this.logger.error(
            `✗ ${controller}.${method} ${Date.now() - now}ms err=${(err as Error)?.message ?? String(err)}`,
          );
        },
      }),
    );
  }
}
