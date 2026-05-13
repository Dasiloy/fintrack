import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PublicMetaKey } from '@fintrack/common/decorators/public.decorator';

import { AuthService } from '../auth/auth.service';

/**
 * @description Checks if the user is authenticated
 * This is a native NestJS guard method
 *
 * @class ApiGuard
 * @implements {CanActivate}
 */
@Injectable()
export class ApiGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * @description Checks if the user is authenticated
   * This is a native NestJS guard method
   *
   * @param {ExecutionContext} context - The execution context
   * @returns {boolean} True if the user is authenticated, false otherwise
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PublicMetaKey, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Extract token — Authorization header (standard) or query param (SSE, EventSource)
    const authHeader = request.headers.authorization;
    const queryToken = request.query?.token as string | undefined;

    if (!authHeader && !queryToken) {
      throw new UnauthorizedException('Unathorized');
    }

    const token = authHeader ? authHeader.split(' ')?.[1] : queryToken;

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Validate token via AuthService (calls auth_service microservice)
    const result = await this.authService.validateToken(token);

    if (!result) {
      throw new UnauthorizedException('TOKEN_EXPIRED');
    }

    // Attach user to request object for use in controllers
    request.user = result;

    return true;
  }
}
