import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../auth/auth.service';

@Injectable()
export class ApiGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Unathorized');
    }
    // Extract Bearer token
    const token = authHeader.split(' ')?.[1];

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Validate token via AuthService (calls auth_service microservice)
    const user = await this.authService.validateToken(token);

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    // Attach user to request object for use in controllers
    request.user = user;

    return true;
  }
}
