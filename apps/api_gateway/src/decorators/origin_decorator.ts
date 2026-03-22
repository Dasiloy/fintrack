import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OriginUrl = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    let url = req.get('origin') || req.get('host') || req.headers.origin;
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      url = url.startsWith('https') ? url : `https://${url}`;
    } else {
      url = url.startsWith('http') ? url : `http://${url}`;
    }

    return url;
  },
);
