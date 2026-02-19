export interface TokenPayload {
  id: string;
  email: string;
  avatar: string | null;
  firstName: string;
  lastName: string;
  type: 'email_otp' | 'password_otp' | 'access_token' | 'refresh_token';
}
