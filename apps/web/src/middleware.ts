import { getToken, encode } from 'next-auth/jwt';
import { decodeJwt } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { consoleLogger } from '@fintrack/common/console_logger/index';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { RefreshTokenRes } from '@fintrack/types/protos/auth/auth';

// Deduplicates concurrent refresh attempts for the same refresh token=> Prevent race conditions
const pendingRefresh = new Map<string, Promise<any>>();

const COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token';

export default async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET!;
  const token = await getToken({ req, secret, cookieName: COOKIE_NAME, salt: COOKIE_NAME });

  if (!token) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
  }

  // Token still valid — pass through
  if (token.expires_at && Date.now() < (token.expires_at as number)) {
    return NextResponse.next();
  }

  // Access token expired — refresh with mutex
  const refreshKey = token.refresh_token as string;

  if (!pendingRefresh.has(refreshKey)) {
    const promise = (async () => {
      try {
        consoleLogger.log('MIDDLEWARE', 'Refreshing access token');
        const response = await fetch(`${process.env.API_GATEWAY_URL}/api/auth/refresh`, {
          method: 'POST',
          body: JSON.stringify({ refreshToken: token.refresh_token }),
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Refresh failed');
        const data: StandardResponse<RefreshTokenRes> = await response.json();
        return {
          ...token,
          access_token: data.data?.accessToken,
          refresh_token: data.data?.refreshToken,
          expires_at: decodeJwt(data.data?.accessToken as string).exp! * 1000,
        };
      } catch {
        return null;
      } finally {
        pendingRefresh.delete(refreshKey);
      }
    })();
    pendingRefresh.set(refreshKey, promise);
  }

  const newToken = await pendingRefresh.get(refreshKey)!;

  if (!newToken) {
    const res = NextResponse.redirect(new URL(AUTH_ROUTES.LOGIN, req.url));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  const sessionMaxAgeSecs = parseJwtExpiration(process.env.JWT_REFRESH_TOKEN_EXPIRATION!);
  const remainingSecs = Math.max(
    sessionMaxAgeSecs - (Math.floor(Date.now() / 1000) - (token.iat as number)),
    0,
  );
  const encoded = await encode({
    token: newToken,
    secret,
    maxAge: remainingSecs,
    salt: COOKIE_NAME,
  });

  const res = NextResponse.next();
  res.cookies.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: remainingSecs,
  });
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
