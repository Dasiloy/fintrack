import { Metadata, status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RpcAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    if (context.getType() !== 'rpc') {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Unauthorized!',
      });
    }

    const metadata = context.switchToRpc().getContext<Metadata>();

    const userId = metadata.get('x-user-id')?.[0];

    if (!userId) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Unauthorized!',
      });
    }

    (metadata as any).user = { id: userId };

    return true;
  }
}
