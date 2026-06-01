const FALLBACK_MAX_LEN = 120;

/**
 * Serialises `value` to a compact JSON string suitable for log lines.
 *
 * @param value   - Any serialisable value.
 * @param length  - Max character length before truncation. Defaults to 120.
 * @param full    - When `true`, emits pretty-printed JSON with no truncation.
 *                  Intended for local dev / debug sessions.
 */
export function minify(value: unknown, length?: number, full?: boolean): string {
  if (full) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '[unserializable]';
    }
  }

  const maxLen = length ?? FALLBACK_MAX_LEN;

  try {
    const raw = JSON.stringify(value);
    if (raw.length <= maxLen) return raw;
    return `${raw.slice(0, maxLen)}… (+${raw.length - maxLen} chars)`;
  } catch {
    return '[unserializable]';
  }
}
