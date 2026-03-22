import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const StripeSig = createParamDecorator(
  (_: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];
    return signature;
  },
);
