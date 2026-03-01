export interface DeviceInfo {
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export type CreateSessionOptions =
  | { mode: 'login'; deviceInfo: DeviceInfo }
  | { mode: 'refresh'; oldSessionToken: string };
