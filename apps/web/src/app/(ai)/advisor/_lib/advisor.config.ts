// ── Advisor config (server-safe) ──────────────────────────────────────────────
// Plain constants shared by the server component (page.tsx) and the client. Kept
// import-free so it can be used from both the RSC and client bundles.

/**
 * Cookie holding the user's last-open conversation id. A cookie (not just
 * localStorage) so the server component can read it and prefetch that
 * conversation's messages into the dehydrated cache — no empty/loading gap on
 * refresh.
 */
export const ADVISOR_ACTIVE_CONVERSATION_COOKIE = 'advisor_active_conversation';

/** Page size for the message transcript. Must match between server prefetch and
 *  client query so the hydrated cache key lines up. */
export const ADVISOR_MESSAGE_PAGE_SIZE = 30;
