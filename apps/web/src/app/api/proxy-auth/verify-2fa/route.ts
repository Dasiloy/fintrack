import { env } from '@/env';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();

    const deviceId = cookieStore.get(env.NEXT_PUBLIC_DEVICE_ID_COOKIE_NAME)?.value ?? '';

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(deviceId && { 'x-device-id': deviceId }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'An error occurred!' }, { status: 500 });
  }
}
