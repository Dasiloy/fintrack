import { Metadata } from '@grpc/grpc-js';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RpcUser = createParamDecorator((prop: string, ctx: ExecutionContext) => {
  const request = ctx.switchToRpc().getContext<Metadata>();
  const user = (request as any).user;

  return prop ? user['prop'] : user;
});
