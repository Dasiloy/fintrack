// ── Advisor Jotai store ───────────────────────────────────────────────────────
// One coherent state layer for the advisor chat:
//
// - PERSISTED (atomWithStorage, localStorage, cross-tab):
//     • conversationHeadAtom  — the latest message page per conversation, used to
//       seed React Query so a reopen/reload paints instantly.
//     • conversationsListAtom — the sidebar list.
//   `getOnInit: true` so a synchronous read during render (React Query
//   `placeholderData`) hydrates from storage immediately instead of flashing null.
//
// - EPHEMERAL (plain atomFamily):
//     • conversationStreamAtom — THIS session's live/in-flight turns per
//       conversation. It lives outside the React tree, so a stream is NEVER cut by
//       navigation: switching the advisor/insights tab (which unmounts ChatPanel)
//       or switching conversations no longer aborts or loses it. A backgrounded
//       stream keeps filling its buffer and is persisted to its head on finish.
//
// The stream runner + abort controllers are module-level (also outside React), so
// the generation survives unmount and is only stopped on an explicit Stop.

import { atom, getDefaultStore } from 'jotai';
import { atomFamily, atomWithStorage, RESET } from 'jotai/utils';

import type {
  ConversationHistoryMessage,
  ConversationMessagePage,
  ConversationSummary,
} from '@fintrack/types/interfaces/ai';

import type { AdvisorMessage } from './advisor.types';
import { streamAdvisor, AdvisorStreamError } from './advisor.stream';

/** Max messages kept in a conversation's instant-render head (see appendToHead). */
const HEAD_CAP = 50;

const store = getDefaultStore();

// ── Persisted atoms ────────────────────────────────────────────────────────────

export const conversationHeadAtom = atomFamily((conversationId: string) =>
  atomWithStorage<ConversationMessagePage | null>(
    `advisor:messages:${conversationId}`,
    null,
    undefined,
    { getOnInit: true },
  ),
);

export const conversationsListAtom = atomWithStorage<ConversationSummary[]>(
  'advisor:conversations',
  [],
  undefined,
  { getOnInit: true },
);

// ── Ephemeral live-stream atoms ────────────────────────────────────────────────

export interface ConversationStream {
  messages: AdvisorMessage[];
  isStreaming: boolean;
}

const EMPTY_STREAM: ConversationStream = { messages: [], isStreaming: false };

export const conversationStreamAtom = atomFamily((_conversationId: string) =>
  atom<ConversationStream>(EMPTY_STREAM),
);

// AbortControllers are not render state — kept out of atoms.
const controllers = new Map<string, AbortController>();

// When each conversation last FINISHED a turn. The chat panel only drops a live
// buffer once server history that POSTDATES this lands, so a stale refetch can
// never briefly hide the just-finished turn (no disappear/reappear).
const lastFinalizedAt = new Map<string, number>();
export function getFinalizedAt(conversationId: string): number {
  return lastFinalizedAt.get(conversationId) ?? 0;
}

function patchStream(
  conversationId: string,
  patch: (prev: ConversationStream) => ConversationStream,
): void {
  const a = conversationStreamAtom(conversationId);
  store.set(a, patch(store.get(a)));
}

/** Drops a conversation's live buffer once server history is authoritative. */
export function clearConversationStream(conversationId: string): void {
  const a = conversationStreamAtom(conversationId);
  if (store.get(a).messages.length === 0) return;
  store.set(a, EMPTY_STREAM);
}

/**
 * Forgets everything for a conversation (on permanent delete): aborts any
 * in-flight stream, drops the live buffer, and removes the persisted head from
 * localStorage so a deleted thread leaves nothing behind.
 */
export function clearConversationData(conversationId: string): void {
  controllers.get(conversationId)?.abort();
  controllers.delete(conversationId);
  lastFinalizedAt.delete(conversationId);

  store.set(conversationStreamAtom(conversationId), EMPTY_STREAM);
  conversationStreamAtom.remove(conversationId);

  store.set(conversationHeadAtom(conversationId), RESET);
  conversationHeadAtom.remove(conversationId);
}

/** Mutates a single live message (e.g. an HITL action state). */
export function patchLiveMessage(
  conversationId: string,
  messageId: string,
  patch: Partial<AdvisorMessage>,
): void {
  patchStream(conversationId, (prev) => ({
    ...prev,
    messages: prev.messages.map((m) =>
      m.id === messageId ? { ...m, ...patch } : m,
    ),
  }));
}

// ── Persisted head helpers ─────────────────────────────────────────────────────

export function readHead(conversationId: string): ConversationMessagePage | null {
  return store.get(conversationHeadAtom(conversationId));
}

export function writeHead(
  conversationId: string,
  page: ConversationMessagePage,
): void {
  store.set(conversationHeadAtom(conversationId), page);
}

/**
 * Appends completed turn message(s) to a thread's head cache. De-dupes by id
 * (a message can never appear twice), trims to {@link HEAD_CAP}, and keeps the
 * cursor consistent so older pages stay fetchable (no gap, no dup).
 */
export function appendToHead(
  conversationId: string,
  incoming: ConversationHistoryMessage[],
): void {
  if (incoming.length === 0) return;

  const existing = readHead(conversationId);
  const base = existing?.messages ?? [];

  const byId = new Map<string, ConversationHistoryMessage>();
  for (const m of base) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  const merged = Array.from(byId.values());

  const trimmed = merged.length > HEAD_CAP ? merged.slice(-HEAD_CAP) : merged;
  const olderExist = existing?.nextCursor != null || merged.length > HEAD_CAP;
  const nextCursor = olderExist ? (trimmed[0]?.id ?? null) : null;

  writeHead(conversationId, { messages: trimmed, nextCursor });
}

// ── Stream runner (runs outside React; survives unmount/navigation) ────────────

/** Aborts an in-flight stream (explicit Stop only — never on navigation). */
export function stopConversationStream(conversationId: string): void {
  controllers.get(conversationId)?.abort();
}

/**
 * Streams one user message for a conversation, writing tokens into that
 * conversation's live buffer. On success the completed turn is appended to the
 * persisted head so a reopen/reload paints it instantly. Errors leave a friendly
 * note; aborts persist nothing.
 */
export async function streamConversationMessage(args: {
  conversationId: string;
  message: string;
  onFinished?: () => void;
}): Promise<void> {
  const { conversationId, message } = args;

  const userMessage: AdvisorMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: message || '(attached file)',
    createdAt: new Date(),
  };
  const assistantId = crypto.randomUUID();

  patchStream(conversationId, (prev) => ({
    isStreaming: true,
    messages: [
      ...prev.messages,
      userMessage,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date() },
    ],
  }));

  const controller = new AbortController();
  controllers.set(conversationId, controller);

  let assistantContent = '';
  let succeeded = false;

  try {
    await streamAdvisor({
      conversationId,
      message,
      signal: controller.signal,
      onToken: (delta) => {
        assistantContent += delta;
        patchStream(conversationId, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + delta } : m,
          ),
        }));
      },
      // Approval / permission cards are wired in a later phase (HITL).
      onEvent: () => {},
    });
    succeeded = true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      const note =
        err instanceof AdvisorStreamError
          ? 'Sorry, I could not finish that. Please try again.'
          : 'Something went wrong reaching the advisor. Please try again.';
      patchStream(conversationId, (prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content ? `${m.content}\n\n${note}` : note }
            : m,
        ),
      }));
    }
  } finally {
    if (controllers.get(conversationId) === controller) {
      controllers.delete(conversationId);
    }
    patchStream(conversationId, (prev) => ({ ...prev, isStreaming: false }));

    // Mark the turn end on EVERY exit (success or abort), so the chat panel keeps
    // the live buffer until server history that postdates this turn lands. On
    // abort the user turn (and any partial) is already persisted server-side, so
    // without this the buffer would be cleared against stale history and the
    // just-sent messages would blink out before the refetch brings them back.
    lastFinalizedAt.set(conversationId, Date.now());

    if (succeeded) {
      appendToHead(conversationId, [
        {
          id: userMessage.id,
          role: 'USER',
          content: userMessage.content,
          createdAt: userMessage.createdAt,
        },
        {
          id: assistantId,
          role: 'ASSISTANT',
          content: assistantContent,
          createdAt: new Date(),
        },
      ]);
    }

    args.onFinished?.();
  }
}
