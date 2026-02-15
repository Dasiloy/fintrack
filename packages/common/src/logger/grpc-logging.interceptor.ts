import { Observable, tap } from 'rxjs';

import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';

@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    const rpc = context.switchToRpc();

    const method = context.getHandler().name;
    const controller = context.getClass().name;
    const data = rpc.getData();

    this.logger.log(`Incoming RPC Call: ${controller}.${method}`, data);

    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: (value) => {
          this.logger.log(
            `Completed RPC Call: ${controller}.${method} - ${Date.now() - now}ms`,
            value,
          );
        },
        error: (err) => {
          this.logger.error(
            `Failed RPC Call: ${controller}.${method} - ${Date.now() - now}ms`,
            err,
          );
        },
      }),
    );
  }
}
