import * as geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { Response, NextFunction } from 'express';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestWithDevice } from '../@types/device_info.types';

/**
 * DeviceMiddleware.
 */
@Injectable()
export class DeviceMiddleware implements NestMiddleware {
  use(req: RequestWithDevice, _res: Response, next: NextFunction) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      (req.headers['x-real-ip'] as string) ??
      req.socket.remoteAddress ??
      'unknown';

    const userAgent = (req.headers['user-agent'] as string) ?? 'unknown';
    const deviceId = (req.headers['x-device-id'] as string) ?? '';

    const parsed = new UAParser(userAgent).getResult();
    const browser =
      [parsed.browser.name, parsed.browser.version].filter(Boolean).join(' ') ||
      'Unknown';
    const os =
      [parsed.os.name, parsed.os.version].filter(Boolean).join(' ') ||
      'Unknown';
    const deviceType = parsed.device.type ?? 'desktop';
    const deviceModel = parsed.device.model ?? null;

    const geo = geoip.lookup(ip);
    const locationData = geo
      ? {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
        }
      : { country: null, region: null, city: null, timezone: null };
    const location = geo
      ? [geo.city, geo.country].filter(Boolean).join(', ')
      : undefined;

    req.deviceInfo = {
      deviceId,
      ipAddress: ip,
      userAgent,
      location,
      browser,
      os,
      deviceType,
      deviceModel,
      locationData,
    };

    next();
  }
}
