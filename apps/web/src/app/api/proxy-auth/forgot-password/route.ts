import { env } from '@/env';
import { NextResponse } from 'next/server';
import type { ForgotPasswordRes } from '@fintrack/types/protos/auth/auth';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { parseJwtExpiration } from '@fintrack/utils/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
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
    return Response.json({ message: 'An eeror occured!' }, { status: 500 });
  }
}
