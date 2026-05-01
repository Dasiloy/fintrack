export const MONO_PENDING_TTL_SECONDS = 300;

/**
 * Stopwords are senetence words of no real importance.
 * We strip this away from narattion when tokenizing.
 */
export const STOPWORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'into',
  'or',
  'of',
  'to',
  'a',
  'an',
  'in',
  'on',
  'at',
  'by',
  'cat',
  'per',
  'ltd',
  'plc',
  'nig',
  'nigeria',
]);
