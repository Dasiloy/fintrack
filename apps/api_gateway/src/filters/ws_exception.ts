import { Socket } from 'socket.io';

import { WsException } from '@nestjs/websockets';
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import {
  ERROR_TYPE,
  TEMPš_EVENT,
} from '@fintrack/types/constants/socket.evenets';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();

    let message = 'An error occurred';

    if (exception instanceof WsException) {
      const error = exception.getError();
      message =
        typeof error === 'string'
          ? error
          : ((error as any)?.message ?? message);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled WS exception for client ${client.id}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `Unknown WS exception for client ${client.id}: ${String(exception)}`,
      );
    }

    client.emit(TEMPš_EVENT, {
      type: ERROR_TYPE,
      message,
    });
  }
}
