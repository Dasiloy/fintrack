export interface TokenPayload {
  id: string;
  email: string;
  avatar: string | null;
  firstName: string;
  lastName: string;
  sessionToken?: string;
  type: 'otp_token' | 'access_token' | 'refresh_token';
}
