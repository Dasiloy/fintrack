import { env } from '@/env';
import { getSession } from 'next-auth/react';
import { NextResponse } from 'next/server';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { CreatePortalSessionResponse } from '@fintrack/types/protos/payment/payment';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const response = await fetch(`${env.API_GATEWAY_URL}/api/payment/portal`, {
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
