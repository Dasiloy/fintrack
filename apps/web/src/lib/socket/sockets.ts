import { getSession } from 'next-auth/react';
import { manager } from './manager';
import {
  ANALYTICS_NAMESPACE,
  ACTIVITY_LOGS_NAMESPACE,
} from '@fintrack/types/constants/socket.evenets';
import type { Socket } from 'socket.io-client';

let analyticsSocket: Socket | null = null;
export const getAnalyticsSocket = (): Socket => {
  if (analyticsSocket) return analyticsSocket;
  analyticsSocket = manager.socket(ANALYTICS_NAMESPACE, {
    retries: 5,
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
  return analyticsSocket;
};

let activityLogsSocket: Socket | null = null;
export const getActivityLogsSocket = (): Socket => {
  if (activityLogsSocket) return activityLogsSocket;
  activityLogsSocket = manager.socket(ACTIVITY_LOGS_NAMESPACE, {
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
  return activityLogsSocket;
};
