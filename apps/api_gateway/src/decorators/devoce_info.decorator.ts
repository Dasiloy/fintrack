import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Device = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.deviceInfo;
  },
);
