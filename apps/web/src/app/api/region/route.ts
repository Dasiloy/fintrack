import { type NextRequest } from 'next/server';

/**
 * GET /api/region
 * Returns the two-letter ISO country code derived from the incoming IP.
 * Checked on-demand (e.g. when a user clicks "Upgrade to Pro") — not middleware.
 *
 * Priority: Vercel IP header → Cloudflare IP header → 'NG' (local dev fallback)
 */
export async function GET(request: NextRequest) {
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    'NG';

  return Response.json({ country: country.toUpperCase() });
}
