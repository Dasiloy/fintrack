import * as geoip from 'geoip-lite';
import { Request, Response, NextFunction } from 'express';

import { Injectable, NestMiddleware } from '@nestjs/common';

import { DeviceInfo } from '@fintrack/types/interfaces/device';

export type RequestWithDevice = Request & { deviceInfo: DeviceInfo };

@Injectable()
export class DeviceMiddleware implements NestMiddleware {
  use(req: RequestWithDevice, _res: Response, next: NextFunction) {
    const ip =
      req.ip ??
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      'unknown';

    const userAgent = (req.headers['user-agent'] as string) ?? 'unknown';
    const deviceId = (req.headers['x-device-id'] as string) ?? '';

    const geo = geoip.lookup(ip);
    const location = geo
      ? [geo.city, geo.country].filter(Boolean).join(', ')
      : undefined;

    req.deviceInfo = { deviceId, ipAddress: ip, userAgent, location };
    next();
  }
}
