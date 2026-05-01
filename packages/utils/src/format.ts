/**
 * FormatCurrency - format currency in account desired currency
 *
 * Currency can be NGN,USD and others
 * Return Properly formatted currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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
  const rand = Math.floor(Math.random() * 2176782336).toString(36).toUpperCase().padStart(6, '0');
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
