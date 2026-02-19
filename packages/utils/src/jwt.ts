/**
 * Helper to convert JWT expiration string to seconds
 * Examples: "15m" -> 900, "30d" -> 2592000, "1h" -> 3600
 */
export function parseJwtExpiration(expiration: string): number {
  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid JWT expiration format: ${expiration}`);
  }

  const [, value, unit] = match;
  const num = parseInt(value!, 10);

  switch (unit) {
    case 's':
      return num;
    case 'm':
      return num * 60;
    case 'h':
      return num * 60 * 60;
    case 'd':
      return num * 24 * 60 * 60;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}
