import { env } from '@/env';
import { NextResponse, type NextRequest } from 'next/server';

import { type RegisterRes } from '@fintrack/types/protos/auth/auth';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { parseJwtExpiration } from '@fintrack/utils/jwt';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { cfTurnstileToken, ...signupBody } = body;

    if (!cfTurnstileToken) {
      return Response.json({ message: 'CAPTCHA verification required.' }, { status: 400 });
    }

    const ip =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '127.0.0.1';

    const verified = await verifyTurnstileToken(cfTurnstileToken, ip);
    if (!verified) {
      return Response.json(
        { message: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 },
      );
    }

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify(signupBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorReponse = JSON.parse(await response.text());
      return Response.json(errorReponse, { status: response.status });
    }

    const data: StandardResponse<RegisterRes> = await response.json();

    const res = NextResponse.json(data, { status: response.status });
    res.cookies.set('verifyEmail', data.data?.user?.email ?? '', {
      path: '/',
      sameSite: 'strict',
      httpOnly: true,
      maxAge: parseJwtExpiration(env.JWT_OTP_TOKEN_EXPIRATION),
      secure: process.env.NODE_ENV === 'production',
    });
    res.cookies.set('emailToken', data.data?.emailToken ?? '', {
      path: '/',
      sameSite: 'strict',
      httpOnly: true,
      maxAge: parseJwtExpiration(env.JWT_OTP_TOKEN_EXPIRATION),
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An error occured!' }, { status: 500 });
  }
}
