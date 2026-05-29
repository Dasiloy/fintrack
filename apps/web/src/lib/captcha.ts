import { env } from '@/env';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });
  const data = await res.json();
  return data.success === true;
}

export function getClientIp(request: Request): string {
  const req = request as any;
  return (
    req.headers?.get?.('cf-connecting-ip') ??
    req.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  );
}

export function extractCaptchaToken(body: Record<string, unknown>): {
  token: string | null;
  rest: Record<string, unknown>;
} {
  const { cfTurnstileToken, ...rest } = body;
  return { token: (cfTurnstileToken as string) ?? null, rest };
}
