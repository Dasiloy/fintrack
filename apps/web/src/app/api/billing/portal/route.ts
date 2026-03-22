import { env } from '@/env';
import { auth } from '@/lib/nextauth';
import { NextResponse } from 'next/server';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { CreatePortalSessionResponse } from '@fintrack/types/protos/payment/payment';

export async function GET(request: Request) {
  const session = await auth();

  console.log;
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const response = await fetch(`${env.API_GATEWAY_URL}/api/payment/portal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const data: StandardResponse<CreatePortalSessionResponse> = await response.json();

  if (!data.success) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.redirect(data.data?.portalSessionUrl!);
}
