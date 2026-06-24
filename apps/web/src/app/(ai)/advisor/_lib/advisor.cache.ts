// ── advisorCache ──────────────────────────────────────────────────────────────
// Tiny localStorage cache for the advisor, used as React Query `initialData` so
// the sidebar list and a conversation's most-recent messages render instantly on
// reload (Claude-web feel) while the network refetches in the background.
//
// SSR-safe (guards `window`); best-effort (swallows quota/parse errors). Only the
// latest message page is cached per conversation — older pages still paginate by
// cursor from the server.

import type {
  ConversationMessagePage,
  ConversationSummary,
} from '@fintrack/types/interfaces/ai';

const LIST_KEY = 'advisor:conversations';
const messagesKey = (conversationId: string) => `advisor:messages:${conversationId}`;

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded / disabled storage — instant-feel is a nicety, never fatal
  }
}

function remove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const advisorCache = {
  readConversations: () => read<ConversationSummary[]>(LIST_KEY),
  writeConversations: (list: ConversationSummary[]) => write(LIST_KEY, list),

  readMessagesHead: (conversationId: string) =>
    read<ConversationMessagePage>(messagesKey(conversationId)),
  writeMessagesHead: (conversationId: string, page: ConversationMessagePage) =>
    write(messagesKey(conversationId), page),
  clearMessages: (conversationId: string) => remove(messagesKey(conversationId)),
};
