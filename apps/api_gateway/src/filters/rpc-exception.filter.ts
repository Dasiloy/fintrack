import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { TimeoutError } from 'rxjs';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 1. Handle HttpExceptions (e.g. from Guards, Pipes, or Controllers)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      let res = exception.getResponse();

      if (typeof res === 'string') {
        res = {
          statusCode: status,
          message: res,
        };
      }

      if (status === 429) {
        (res as any).message =
          'Too many requests, please try again in afew minuite!';
      }

      return response.status(status).json({
        ...res,
        success: false,
      });
    }

    // 2. Handle RxJS TimeoutError
    if (
      exception instanceof TimeoutError ||
      exception.name === 'TimeoutError'
    ) {
      return response.status(HttpStatus.REQUEST_TIMEOUT).json({
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
        success: false,
      });
    }

    // 3. Extract error object (gRPC)
    const error = exception.error || exception;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // 4. Check for gRPC status codes
    if (error && typeof error === 'object') {
      const code = error.code;
      const details = error.details || error.message;

      // Log only if we are about to process a gRPC error
      if (code !== undefined) {
        this.logger.warn({ code, details });
      }

      switch (code) {
        case 3: // INVALID_ARGUMENT
          status = HttpStatus.BAD_REQUEST;
          message = details;
          break;
        case 5: // NOT_FOUND
          status = HttpStatus.NOT_FOUND;
          message = details;
          break;
        case 6: // ALREADY_EXISTS
          status = HttpStatus.CONFLICT;
          message = details;
          break;
        case 7: // PERMISSION_DENIED
          status = HttpStatus.FORBIDDEN;
          message = details;
          break;
        case 16: // UNAUTHENTICATED
          status = HttpStatus.UNAUTHORIZED;
          message = details;
          break;
        default:
          // If code is defined but unknown mapping, keep 500 but log warning
          if (code !== undefined) {
            this.logger.warn(
              `Unhandled gRPC error code: ${code}, details: ${details}`,
            );
          }
      }
    }

    // 5. Log unforeseen internal errors
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      success: false,
    });
  }
}
