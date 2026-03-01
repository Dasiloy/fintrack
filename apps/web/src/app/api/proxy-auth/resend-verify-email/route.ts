import { env } from '@/env';

import { cookies } from 'next/headers';

import type { NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const email = (await cookies()).get('verifyEmail')?.value;

    const response = await fetch(`${env.API_GATEWAY_URL}/api/auth/resend-verify`, {
      method: 'POST',
      body: JSON.stringify({
        email,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorReponse = JSON.parse(await response.text());
      return Response.json(errorReponse, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'An error occured!' }, { status: 500 });
  }
}
