import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AccessToken = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    let token = '';
    const authHeader = request.headers.authorization;
    if (authHeader) {
      token = authHeader.split(' ')?.[1] ?? '';
    }

    return token;
  },
);

export const HeaderToken = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    let token = '';
    if (data?.trim().length) {
      token = request.headers[data] ?? '';
    }

    return token;
  },
);
