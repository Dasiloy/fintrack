import { Socket } from 'socket.io';
import { Redis } from 'ioredis';

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';

import { AuthService } from '../auth/auth.service';

@Injectable()
export class WsGuard implements CanActivate {
  private readonly logger = new Logger(WsGuard.name);

  constructor(
    private readonly authService: AuthService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    if (client.data.user) {
      return true;
    }

    const token: string | undefined = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const user = await this.authService.validateToken(token);

      if (user === 'TOKEN_EXPIRED' || user === null) {
        client.disconnect();
        return false;
      }

      client.data.user = user;
      return true;
    } catch (err) {
      this.logger.error(
        `WS auth failed for client ${client.id}: ${err.message}`,
      );
      client.disconnect();
      return false;
    }
  }
}
