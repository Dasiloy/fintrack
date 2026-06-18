/**
 * Keys whose values are always redacted from logs, regardless of depth.
 * Compared case-insensitively against object keys.
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'confirmpassword',
  'currentpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'verificationtoken',
  'resettoken',
  'sessiontoken',
  'idtoken',
  'secret',
  'secretkey',
  'privatekey',
  'apikey',
  'monoseckey',
  'code',
  'otp',
  'pin',
  'bvn',
  'nuban',
  'cvv',
  'cardnumber',
  'authorization',
  'authorizationcode',
  'paystackauthorizationcode',
  'encryptionkey',
]);

/**
 * Recursively walks `value` and replaces any object value whose key matches
 * a known sensitive field with the string `'[REDACTED]'`.
 *
 * Safe to call on any shape — handles primitives, arrays, and plain objects.
 * Depth-limited to 6 levels to avoid runaway recursion on circular or deep structures.
 */
export function maskPayload(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => maskPayload(v, depth + 1));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : maskPayload(v, depth + 1),
    ]),
  );
}
