// analytics job
export interface AnalyticsNotificationPayload {
  userId: string;
  event: string;
  entityId: string;
  data: Record<string, string>;
}

export interface JoinAnalyticsRoomPayload {
  path: 'dashboard' | 'analytics';
}

// fcm job
export interface FcmNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}
