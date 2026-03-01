import { env } from '@/env';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const passwordToken = cookieStore.get('passwordToken')?.value;

    if (!passwordToken) {
      return Response.json({ message: 'Token Expired!' }, { status: 401 });
    }

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'x-token': passwordToken,
      },
    });

    if (!response.ok) {
      const errorReponse = JSON.parse(await response.text());
      return Response.json(errorReponse, { status: response.status });
    }

    const data = await response.json();

    const res = NextResponse.json(data, { status: response.status });
    res.cookies.delete('passwordToken');
    return res;
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An error occured!' }, { status: 500 });
  }
}
