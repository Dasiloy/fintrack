'use client';

import { useEffect } from 'react';

import { axiosClient } from '@/lib/axios/axios_client';
import { consoleLogger } from '@fintrack/common/console_logger/index';

export function DeviceIdInit() {
  useEffect(() => {
    axiosClient.get('/init').catch((err) => {
      consoleLogger.error('INIT', err);
    });
  }, []);
  return null;
}
