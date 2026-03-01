import { env } from '@/env';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();

    const deviceId = cookieStore.get('deviceId')?.value ?? crypto.randomUUID();
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
        'X-Forwarded-For': ip,
        'User-Agent': userAgent,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorReponse = JSON.parse(await response.text());
      return Response.json(errorReponse, { status: response.status });
    }

    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });

    res.cookies.set('deviceId', deviceId, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An error occurred!' }, { status: 500 });
  }
}
