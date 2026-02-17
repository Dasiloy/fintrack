import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { parseJwtExpiration } from '@/helpers/jwt';

/**
 * Middleware: Automatic Token Refresh
 *
 * This middleware runs on EVERY request to protected routes (see config.matcher below).
 * It handles automatic JWT token refresh to keep users logged in seamlessly.
 *
 * Flow:
 * 1. Check if user has tokens
 * 2. Verify access token is valid
 * 3. If expired → refresh it automatically
 * 4. If refresh fails → redirect to login
 */
export async function middleware(request: NextRequest) {
  // STEP 0: Check if route is public
  // Public routes don't need authentication
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // STEP 1: Extract tokens from cookies
  // NextAuth stores the access token in "next-auth.session-token"
  // We store the refresh token separately in "refresh-token"
  const access_token = request.cookies.get('next-auth.session-token')?.value;
  const refresh_token = request.cookies.get('refresh-token')?.value;

  // STEP 2: Early return if no tokens
  // If user doesn't have tokens, let them through
  // NextAuth will handle redirecting to login if needed
  if (!access_token || !refresh_token) {
    return NextResponse.next();
  }

  try {
    // STEP 3: Verify the access token
    // Use jose library to verify JWT signature and expiration
    // If this succeeds, token is valid → continue request
    await jwtVerify(access_token, new TextEncoder().encode(process.env.AUTH_SECRET!));

    // Token is valid! Continue with the request
    return NextResponse.next();
  } catch (error) {
    // STEP 4: Access token is expired or invalid
    // Try to refresh it using the refresh token
    console.log('Access token expired, attempting refresh...');

    try {
      // STEP 5: Call backend refresh endpoint
      // Send refresh_token to get new access_token and refresh_token
      const response = await fetch(`${process.env.API_GATEWAY_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });

      // STEP 6: Handle refresh failure
      // If refresh fails (expired refresh token, revoked session, etc.)
      // Clear cookies and redirect to login
      if (!response.ok) {
        const res = NextResponse.redirect(new URL('/login', request.url));
        res.cookies.delete('next-auth.session-token');
        res.cookies.delete('refresh-token');
        return res;
      }

      const data = await response.json();

      // STEP 7: Refresh succeeded! Update cookies with new tokens
      // Set new access token (expiry from env: JWT_ACCESS_TOKEN_EXPIRATION)
      const res = NextResponse.next();
      res.cookies.set('next-auth.session-token', data.access_token, {
        httpOnly: true, // Prevents JavaScript access (XSS protection)
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection
        maxAge: parseJwtExpiration(process.env.JWT_ACCESS_TOKEN_EXPIRATION!),
      });

      // Set new refresh token (expiry from env: JWT_REFRESH_TOKEN_EXPIRATION)
      res.cookies.set('refresh-token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: parseJwtExpiration(process.env.JWT_REFRESH_TOKEN_EXPIRATION!),
      });

      // Continue with request using new tokens
      return res;
    } catch (refreshError) {
      // STEP 8: Network error or unexpected failure during refresh
      // Log error and redirect to login
      console.error('Token refresh failed:', refreshError);

      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('next-auth.session-token');
      res.cookies.delete('refresh-token');
      return res;
    }
  }
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

/**
 * Middleware configuration
 * Runs on all routes except static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
