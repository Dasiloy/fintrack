// ── Advisor config (server-safe) ──────────────────────────────────────────────
// Plain constants shared by the server component (page.tsx) and the client.

export { ADVISOR_ACTIVE_CONVERSATION_COOKIE } from '@/lib/advisor/advisor_storage.constants';

/** Page size for the message transcript. Must match between server prefetch and
 *  client query so the hydrated cache key lines up. */
export const ADVISOR_MESSAGE_PAGE_SIZE = 30;
