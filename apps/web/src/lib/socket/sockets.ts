import { getSession } from 'next-auth/react';
import { manager } from './manager';
import {
  ANALYTICS_NAMESPACE,
  ACTIVITY_LOGS_NAMESPACE,
} from '@fintrack/types/constants/socket.evenets';
import type { Socket } from 'socket.io-client';

export const analyticsSocket: Socket = manager.socket(ANALYTICS_NAMESPACE, {
  auth(cb) {
    getSession()
      .then((session) => {
        cb({ token: session?.accessToken });
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        cb({ token: null });
      });
  },
});

export const activityLogsSocket: Socket = manager.socket(ACTIVITY_LOGS_NAMESPACE, {
  auth(cb) {
    getSession()
      .then((session) => {
        cb({ token: session?.accessToken });
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        cb({ token: null });
      });
  },
});
