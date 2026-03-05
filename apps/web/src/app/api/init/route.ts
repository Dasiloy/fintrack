import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { env } from '@/env';

export async function GET() {
  const cookieStore = await cookies();

  if (cookieStore.get(env.DEVICE_ID_COOKIE_NAME)?.value) {
    return NextResponse.json({ ok: true });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(env.DEVICE_ID_COOKIE_NAME, crypto.randomUUID(), {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: env.DEVICE_ID_COOKIE_MAX_AGE,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
