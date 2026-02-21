import { Metadata, status } from '@grpc/grpc-js';

import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { TokenPayload } from '@fintrack/types/interfaces/token_payload';

import { TokenMetaKey } from '../decorators/token.decorator';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tokenType = this.reflector.getAllAndOverride<TokenPayload['type']>(
      TokenMetaKey,
      [context.getClass(), context.getHandler()],
    );

    if (context.getType() !== 'rpc' || !tokenType) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Unauthorized!',
      });
    }

    const metadata = context.switchToRpc().getContext<Metadata>();

    const jwtToken: any = metadata.get('x-token')?.[0];

    if (!jwtToken) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Unauthorized!',
      });
    }

    try {
      const secretMap = {
        access_token: this.configService.get('JWT_SECRET'),
        refresh_token: this.configService.get('JWT_REFRESH_SECRET'),
        otp_token: this.configService.get('JWT_OTP_SECRET'),
      };

      const secret =
        secretMap[tokenType] || this.configService.get('AUTH_SECRET');

      const { payload }: any = this.jwtService.verify(jwtToken, {
        secret,
        ignoreExpiration: false,
      });

      if (payload.type !== tokenType) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid Token Type!',
        });
      }

      (metadata as any).user = payload;
      return true;
    } catch (error: any) {
      const isExpired = error.name === 'TokenExpiredError';
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: isExpired ? 'Token Expired!' : 'Invalid Token!',
      });
    }
  }
}
