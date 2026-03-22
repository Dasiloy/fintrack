import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OriginUrl = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    let url = req.get('origin') || req.get('host') || req.headers.origin;
    const isProd = process.env.NODE_ENV === 'production';

    if (!isProd) {
      url = 'http://localhost:3000';
    }

    return url;
  },
);
