import { env } from '@/env';
import { consoleLogger } from '@fintrack/common/console_logger/index';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();

    const deviceId = cookieStore.get(env.DEVICE_ID_COOKIE_NAME)?.value ?? '';
    consoleLogger.log('deviceid', deviceId);

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/oauth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(deviceId && { 'x-device-id': deviceId }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorReponse = JSON.parse(await response.text());
      return Response.json(errorReponse, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An error occurred!' }, { status: 500 });
  }
}
