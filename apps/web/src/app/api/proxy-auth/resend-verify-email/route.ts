import { env } from '@/env';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import { type ResendVerifyEmailTokenRes } from '@fintrack/types/protos/auth/auth';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const email = (await cookies()).get('verifyEmail')?.value;

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/resend-verify`, {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorResponse = JSON.parse(await response.text());
      return Response.json(errorResponse, { status: response.status });
    }

    const data: StandardResponse<ResendVerifyEmailTokenRes> = await response.json();
    const res = NextResponse.json(data, { status: response.status });

    const cookieOpts = {
      path: '/',
      sameSite: 'strict' as const,
      httpOnly: true,
      maxAge: parseJwtExpiration(env.JWT_OTP_TOKEN_EXPIRATION),
      secure: process.env.NODE_ENV === 'production',
    };

    res.cookies.set('verifyEmail', data.data?.user?.email ?? '', cookieOpts);
    res.cookies.set('emailToken', data.data?.emailToken ?? '', cookieOpts);

    return res;
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An error occured!' }, { status: 500 });
  }
}
