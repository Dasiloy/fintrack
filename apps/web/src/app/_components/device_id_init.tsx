'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';

import { env } from '@/env';
import { consoleLogger } from '@fintrack/common/console_logger/index';

export function DeviceIdInit() {
  useEffect(() => {
    if (Cookies.get(env.NEXT_PUBLIC_DEVICE_ID_COOKIE_NAME)) return;
    fetch('/api/init').catch((err) => {
      consoleLogger.error('INIT', err);
    });
  }, []);
  return null;
}
