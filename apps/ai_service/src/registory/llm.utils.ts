/**
 * Safely extracts a plain string from a LangChain message content value.
 *
 * LangChain models can return content as either a plain string or an array of
 * content parts (e.g. `[{ type: 'text', text: '...' }]`). This handles both
 * shapes so callers don't need to branch on the content type.
 */
export function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => (typeof c === 'string' ? c : ((c as any)?.text ?? '')))
      .join('');
  }
  return '';
}
