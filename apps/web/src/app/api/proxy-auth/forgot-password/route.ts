import { env } from '@/env';
import { NextResponse } from 'next/server';
import type { ForgotPasswordRes } from '@fintrack/types/protos/auth/auth';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import { verifyTurnstileToken, getClientIp, extractCaptchaToken } from '@/lib/captcha';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, rest: forgotBody } = extractCaptchaToken(body);

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

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify(forgotBody),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorResponse = JSON.parse(await response.text());
      return Response.json(errorResponse, { status: response.status });
    }

    const data: StandardResponse<ForgotPasswordRes> = await response.json();

    const res = NextResponse.json(data, { status: response.status });
    res.cookies.set('passwordEmail', data.data?.email ?? '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseJwtExpiration(env.JWT_OTP_TOKEN_EXPIRATION),
      path: '/',
      sameSite: 'strict',
    });

    return res;
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An error occured!' }, { status: 500 });
  }
}
