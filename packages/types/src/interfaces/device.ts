export interface DeviceInfo {
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  // Parsed by ua-parser-js in the gateway middleware
  browser?: string;
  os?: string;
  deviceType?: string;
  deviceModel?: string | null;
  locationData?: {
    country: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
  };
}

export type CreateSessionOptions =
  | { mode: 'login'; deviceInfo: DeviceInfo }
  | { mode: 'refresh'; oldSessionToken: string };
