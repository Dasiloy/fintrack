import { getToken, encode } from 'next-auth/jwt';
import { decodeJwt } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/env';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { RefreshTokenRes } from '@fintrack/types/protos/auth/auth';

const COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

export async function POST(req: NextRequest) {
  try {
    const secret = env.AUTH_SECRET;
    const token = await getToken({ req, secret, cookieName: COOKIE_NAME, salt: COOKIE_NAME });

    if (!token?.refresh_token) {
      return NextResponse.json({ message: 'No session' }, { status: 401 });
    }

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token.refresh_token }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const res = NextResponse.json({ message: 'Session expired' }, { status: 401 });
      res.cookies.delete(COOKIE_NAME);
      return res;
    }

    const data: StandardResponse<RefreshTokenRes> = await response.json();
    const newToken = {
      ...token,
      access_token: data.data?.accessToken,
      refresh_token: data.data?.refreshToken,
      expires_at: decodeJwt(data.data?.accessToken as string).exp! * 1000,
    };

    const sessionMaxAgeSecs = parseJwtExpiration(env.JWT_REFRESH_TOKEN_EXPIRATION);
    const remainingSecs = Math.max(
      sessionMaxAgeSecs - (Math.floor(Date.now() / 1000) - (token.iat as number)),
      0,
    );
    const encoded = await encode({ token: newToken, secret, maxAge: remainingSecs, salt: COOKIE_NAME });

    const res = NextResponse.json({ accessToken: data.data?.accessToken });
    res.cookies.set(COOKIE_NAME, encoded, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: remainingSecs,
    });
    return res;
  } catch {
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
