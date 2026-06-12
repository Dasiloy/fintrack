import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const PaystackSig = createParamDecorator(
  (_: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const signature = request.headers['x-paystack-signature'];
    return signature;
  },
);
