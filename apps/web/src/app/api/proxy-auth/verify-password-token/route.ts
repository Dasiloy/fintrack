import { env } from '@/env';
import { cookies } from 'next/headers';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import { NextRequest, NextResponse } from 'next/server';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { VerifyPasswordTokenRes } from '@fintrack/types/protos/auth/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const passwordEmail = cookieStore.get('passwordEmail')?.value;
    if (!passwordEmail) {
      return Response.json({ message: 'Token Expired!' }, { status: 401 });
    }

    body.email = passwordEmail;

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/verify-password-token`, {
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

    const data: StandardResponse<VerifyPasswordTokenRes> = await response.json();

    const res = NextResponse.json(data, { status: response.status });
    res.cookies.set('passwordToken', data.data?.passwordToken!, {
      path: '/',
      sameSite: 'strict',
      httpOnly: true,
      maxAge: parseJwtExpiration(env.JWT_OTP_TOKEN_EXPIRATION),
      secure: process.env.NODE_ENV === 'production',
    });
    res.cookies.delete('passwordEmail');
    return res;
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An eeror occured!' }, { status: 500 });
  }
}
