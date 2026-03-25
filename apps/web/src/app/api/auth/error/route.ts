import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

/**
 * Intercepts NextAuth's built-in /api/auth/error route and redirects the user
 * to the login page with the error code preserved as a search param.
 *
 * NextAuth hits this URL when OAuth sign-in fails (e.g., signIn callback
 * returns false). Rather than showing NextAuth's generic error page, we send
 * the user back to /login?error=<code> where the LoginForm reads the param
 * and shows a toast notification.
 *
 * This route handler takes precedence over the [...nextauth] catch-all for
 * the exact /api/auth/error path.
 */
export function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error') ?? 'Default';
  const loginUrl = new URL(AUTH_ROUTES.LOGIN, request.nextUrl.origin);
  loginUrl.searchParams.set('error', error);
  return NextResponse.redirect(loginUrl);
}
