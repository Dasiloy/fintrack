// activity job
export interface ActivityNotificationPayload {
  userId: string;
  event: string;
  entityId: string;
  entityType: string;
  data: any;
}

// analytics job
export interface AnalyticsNotificationPayload {
  userId: string;
  event: string;
  entityId: string;
  data: Record<string, string>;
}

// fcm job
export interface FcmNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}
