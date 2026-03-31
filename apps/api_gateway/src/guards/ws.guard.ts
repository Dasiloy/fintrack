// auth/ws-jwt.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

/**
 * @description Checks if the user is authenticated
 * This is a native NestJS guard method
 *
 * @class WsAuthGuard
 * @implements {CanActivate}
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  /**
   * @description Checks if the user is authenticated
   * This is a native NestJS guard method
   *
   * @param {ExecutionContext} context - The execution context
   * @returns {boolean} True if the user is authenticated, false otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const user = client.data.user;

    if (!user) {
      this.logger.warn('Unauthorized: No user found');
      client.disconnect();
      throw new WsException('Unauthorized');
    }

    return true;
  }
}
