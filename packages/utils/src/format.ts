// Language enum value → BCP-47 locale tag
const LANG_TO_LOCALE: Record<string, string> = {
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  EN: 'en',
  FR: 'fr-FR',
  ES: 'es-ES',
  PT: 'pt-PT',
  HA_LATN_NG: 'ha-Latn-NG',
  YO_NG: 'yo-NG',
  IG_NG: 'ig-NG',
  SW_KE: 'sw-KE',
  SW_TZ: 'sw-TZ',
};

export function langToLocale(lang: string): string {
  return LANG_TO_LOCALE[lang] ?? 'en-NG';
}

export function formatCurrency(amount: number, currency = 'NGN', locale = 'en-NG'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  dateFormat: 'DMY' | 'MDY' | 'YMD' = 'DMY',
  locale = 'en-NG',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // MDY: use en-US locale so Intl orders month first; for others respect the user locale
  const l = dateFormat === 'MDY' ? 'en-US' : locale;
  return new Intl.DateTimeFormat(l, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** Strips everything except digits and a single decimal point — use as an onChange filter on text amount inputs */
export function onlyNumbers(value: string): string {
  const stripped = value.replace(/[^0-9.]/g, '');
  const parts = stripped.split('.');
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : stripped;
}

/**
 * Mask an IP address for display — never expose the full address to the UI.
 *
 * IPv4: replaces the last octet  → 192.168.1.***
 * IPv6: replaces the last group  → 2001:db8:***
 */
export function maskIp(ip?: string | null): string {
  if (!ip) return 'Unknown';
  if (ip.includes('.')) return ip.replace(/\.\d+$/, '.***');
  if (ip.includes(':')) return ip.replace(/:[^:]+$/, ':***');
  return '***';
}

/**
 *
 * @param str string to capitalize
 * @returns capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Flatten an object into a single level
 * @param obj object to flatten
 * @returns { Record<string, any> } flattened object
 */
export function flattenObject(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const isValueObject = typeof obj[key] === 'object' && obj[key] !== null;
    if (isValueObject) {
      const nested = flattenObject(obj[key]);
      for (const nestedKey in nested) {
        result[`${nestedKey}`] = nested[nestedKey];
      }
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T>(obj: T, ...keys: (keyof T)[]): T {
  const result = {} as T;
  for (const key in obj) {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function pick<T>(obj: T, ...keys: (keyof T)[]): T {
  const result = {} as T;
  for (const key in obj) {
    if (keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

// Uniform sourceId format: {PREFIX}-{YYMMDD}-{6 uppercase alphanumeric chars}
// TXN = manual/OCR  |  REC = recurring  |  BNK = bank sync
// 36^6 ≈ 2.2B combinations per prefix per day — collision probability negligible

function yymmdd(date: Date): string {
  return date.toISOString().slice(2, 10).replace(/-/g, '');
}

function shortHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

/** Generates a reference ID for manually created or OCR-scanned transactions. */
export function genTransactionSourceId(date: Date): string {
  const rand = Math.floor(Math.random() * 2176782336)
    .toString(36)
    .toUpperCase()
    .padStart(6, '0');
  return `TXN-${yymmdd(date)}-${rand}`;
}

/**
 * Generates a deterministic reference ID for a recurring transaction run.
 * Same itemId + same runAt always produces the same ID, preserving idempotency.
 */
export function genRecurringSourceId(itemId: string, runAt: Date): string {
  return `REC-${yymmdd(runAt)}-${shortHash(itemId)}`;
}

/**
 * Generates a deterministic reference ID for a bank-synced transaction.
 * The raw Mono ID is never exposed in the sourceId; idempotency for bank
 * transactions relies on the (userId, bankTransactionId, monoBankAccountId)
 * unique constraint — not on this sourceId alone.
 */
export function genBankSourceId(monoTxId: string, txDate: string | Date): string {
  const d = typeof txDate === 'string' ? new Date(txDate) : txDate;
  return `BNK-${yymmdd(d)}-${shortHash(monoTxId)}`;
}

/**
 * Converts a kebab-case slug to a Title Case display name for LLM output.
 * Strips the internal `cat-` category prefix so `cat-food` renders as "Food",
 * never "Cat Food".
 */
export function slugToName(slug: string): string {
  return slug
    .replace(/^cat-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
