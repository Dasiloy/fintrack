import { Metadata, status } from '@grpc/grpc-js';

import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { PrismaService } from '@fintrack/database/nest';
import { TokenPayload } from '@fintrack/types/interfaces/token_payload';

import { TokenMetaKey } from '../decorators/token.decorator';

/**
 * TokenGuard.
 */
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
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

      const secret = secretMap[tokenType];

      const { payload }: any = this.jwtService.verify(jwtToken, {
        secret,
        ignoreExpiration: false,
      });

      if (payload.type !== tokenType) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid Token!',
        });
      }

      (metadata as any).user = payload;

      if (tokenType === 'access_token') {
        const activeSession = await this.prismaService.session.findFirst({
          where: { user: { id: payload.id }, expires: { gt: new Date() } },
          select: { id: true },
        });
        if (!activeSession) {
          throw new RpcException({
            code: status.UNAUTHENTICATED,
            message: 'TOKEN_EXPIRED',
          });
        }
      }

      return true;
    } catch (error: any) {
      let message = error.message ?? 'Invalid Token';
      if (error.name === 'TokenExpiredError') {
        message = 'Token Expired!';
      }
      if (tokenType === 'access_token') {
        message = 'TOKEN_EXPIRED';
      }

      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message,
      });
    }
  }
}
