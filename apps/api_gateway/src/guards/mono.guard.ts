import { Request } from 'express';
import { Observable } from 'rxjs';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MonoGuard implements CanActivate {
  private readonly logger = new Logger(MonoGuard.name);
  constructor(private readonly configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const secretKey = request.headers['mono-webhook-secret'];

    if (!secretKey) {
      throw new UnauthorizedException('Unauthorized');
    }

    const monoWebhookSecret = this.configService.get('MONO_WEBHOOK_SECRET');
    if (!monoWebhookSecret) {
      throw new InternalServerErrorException('An error occured on our end');
    }

    const isCorrectKey = secretKey === monoWebhookSecret;
    if (!isCorrectKey) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }
}
