import { env } from '@/env';
import { consoleLogger } from '@fintrack/common/console_logger/index';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyTurnstileToken, getClientIp, extractCaptchaToken } from '@/lib/captcha';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, rest: loginBody } = extractCaptchaToken(body);

    if (!token) {
      return Response.json({ message: 'CAPTCHA verification required.' }, { status: 400 });
    }

    const verified = await verifyTurnstileToken(token, getClientIp(request));
    if (!verified) {
      return Response.json(
        { message: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const deviceId = cookieStore.get(env.NEXT_PUBLIC_DEVICE_ID_COOKIE_NAME)?.value ?? '';

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(deviceId && { 'x-device-id': deviceId }),
      },
      body: JSON.stringify(loginBody),
    });

    if (!response.ok) {
      const errorResponse = JSON.parse(await response.text());
      consoleLogger.error('LOGIN', errorResponse);

      // Email not verified — set verifyEmail cookie so the resend endpoint can pick it up
      if (response.status === 403) {
        const res = NextResponse.json(
          { ...errorResponse, code: 'EMAIL_NOT_VERIFIED' },
          { status: 403 },
        );
        res.cookies.set('verifyEmail', (loginBody.email as string) ?? '', {
          path: '/',
          sameSite: 'strict',
          httpOnly: true,
          maxAge: parseJwtExpiration(env.JWT_OTP_TOKEN_EXPIRATION),
          secure: process.env.NODE_ENV === 'production',
        });
        return res;
      }

      return Response.json(errorResponse, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An error occurred!' }, { status: 500 });
  }
}
