import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OriginUrl = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    return (
      req.get('origin') || req.get('host') || req.headers.origin || 'unknown'
    );
  },
);
