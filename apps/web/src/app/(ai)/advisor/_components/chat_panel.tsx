'use client';

// ── ChatPanel ─────────────────────────────────────────────────────────────────
// Advisor chat panel. Two visual modes:
//
// EMPTY MODE: full-height centered column — greeting → input → suggested prompts.
// ACTIVE MODE: scrollable message list + input pinned to the bottom.
//
// State model:
// - Persisted transcript = an infinite query (latest page on open; scroll-up
//   fetches older pages by cursor), seeded instantly from the Jotai head atom.
// - Live/in-flight turns live in the Jotai store (conversationStreamAtom), OUTSIDE
//   the React tree — so a stream is never cut by switching tabs (unmount) or
//   conversations. The view = history ++ live (de-duped by id). Once fresh server
//   history supersedes a live turn, the live buffer is dropped.

import * as React from 'react';
import { useAtomValue } from 'jotai';
import { Loader2 } from 'lucide-react';
import { ChatMessage } from './chat_message';
import { ChatInput } from './chat_input';
import { ChatEmptyState } from './chat_empty_state';
import { AdvisorThinkingIndicator } from './advisor_thinking_indicator';
import type { AdvisorMessage, PendingAttachment } from '../_lib/advisor.types';
import {
  conversationStreamAtom,
  streamConversationMessage,
  stopConversationStream,
  clearConversationStream,
  getFinalizedAt,
  resumeConversation,
  readHead,
  writeHead,
} from '../_lib/advisor.store';
import { UsageBanner } from '@/app/_components/usage_banner';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { usePlan } from '@/app/providers/plan_usage_provider';
import { api_client } from '@/lib/trpc_app/api_client';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type {
  AdvisorAction,
  AdvisorMessageMetadata,
  ConversationMessagePage,
} from '@fintrack/types/interfaces/ai';
import { ADVISOR_MESSAGE_PAGE_SIZE as MESSAGE_PAGE_SIZE } from '../_lib/advisor.config';

/** Distance from the top (px) that triggers loading older messages. */
const LOAD_OLDER_THRESHOLD = 80;
/** Distance from the bottom (px) within which we keep auto-scrolling. */
const STICK_BOTTOM_THRESHOLD = 120;
/** Sentinel stream key when no conversation is active yet. */
const NO_CONVERSATION = '__none__';

interface ChatPanelProps {
  activeConversationId: string | null;
  /** True only when an existing conversation was opened from history — gates the
   *  transcript fetch so a freshly-started (locally-owned) conversation is never
   *  reloaded mid-stream. */
  loadHistory: boolean;
  onFirstMessageSent: () => void;
  /** Fired after a turn completes so the parent can refresh the history list. */
  onConversationUpdated: () => void;
  /** Fired once with the generated id when the first message of a brand-new
   *  conversation is sent, so the parent can select/highlight it. */
  onConversationStarted: (conversationId: string) => void;
}

function toAdvisorMessage(m: {
  id: string;
  role: string;
  content: string;
  createdAt: string | Date;
  metadata?: AdvisorMessageMetadata | null;
}): AdvisorMessage {
  return {
    id: m.id,
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
    createdAt: new Date(m.createdAt),
    proposedAction: m.metadata?.proposedAction ?? null,
    actionState: m.metadata?.actionState,
  };
}

function actionKey(message: AdvisorMessage): string | null {
  return message.proposedAction ? actionIdentity(message.proposedAction) : null;
}

function normalizeIdentityPart(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function actionIdentity(action: AdvisorAction): string {
  switch (action.kind) {
    case 'adjust_budget':
      return [
        action.kind,
        action.budgetId,
        action.categorySlug,
        action.currentLimit,
        action.proposedLimit,
      ].join(':');
    case 'create_budget':
      return [
        action.kind,
        action.categorySlug,
        action.proposedLimit,
      ].join(':');
    case 'adjust_goal_contribution':
      return [
        action.kind,
        action.goalId,
        action.currentAmount,
        action.proposedAmount,
      ].join(':');
    case 'suggest_recurring':
      return [
        action.kind,
        normalizeIdentityPart(action.name),
        action.amount,
        action.categorySlug,
        action.frequency,
      ].join(':');
    case 'flag_subscription':
      return [
        action.kind,
        action.recurringId || normalizeIdentityPart(action.name),
        action.operation,
        action.currentAmount,
        action.proposedAmount ?? '',
      ].join(':');
  }
}

export function ChatPanel({
  activeConversationId,
  loadHistory,
  onFirstMessageSent,
  onConversationUpdated,
  onConversationStarted,
}: ChatPanelProps) {
  const plan = usePlan();
  const utils = api_client.useUtils();

  // Local UI draft only — messages + streaming live in the Jotai store.
  const [inputText, setInputText] = React.useState('');
  const [attachments, setAttachments] = React.useState<PendingAttachment[]>([]);

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const hasNotifiedRef = React.useRef(false);
  const conversationIdRef = React.useRef<string | null>(null);

  // Scroll bookkeeping.
  const stickToBottomRef = React.useRef(true);
  const isPrependingRef = React.useRef(false);
  const prevScrollHeightRef = React.useRef(0);
  const didInitialScrollRef = React.useRef(false);

  const shouldLoadHistory = loadHistory && !!activeConversationId;

  // The conversation whose live buffer we render: the active one, or — for a
  // brand-new conversation mid-promotion — its freshly generated id.
  const streamKey = activeConversationId ?? conversationIdRef.current ?? NO_CONVERSATION;
  const stream = useAtomValue(conversationStreamAtom(streamKey));

  // ── Persisted history (cursor-paginated, newest page first) ─────────────────
  const messagesQuery = api_client.advisor.getConversationMessages.useInfiniteQuery(
    { conversationId: activeConversationId ?? '', limit: MESSAGE_PAGE_SIZE },
    {
      enabled: shouldLoadHistory,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      getNextPageParam: (lastPage) => lastPage.data?.nextCursor ?? undefined,
      // Instant render from the persisted head atom while the network loads.
      // placeholderData (not initialData) is re-evaluated every render, so it is
      // picked up the moment a conversation is opened — no key poisoning. Gated on
      // shouldLoadHistory so the cached turn never shows during promotion (which
      // would duplicate the live turn).
      placeholderData: () => {
        if (!shouldLoadHistory || !activeConversationId) return undefined;
        const cached = readHead(activeConversationId);
        if (!cached) return undefined;
        return {
          pageParams: [null as string | null],
          pages: [
            {
              success: true,
              message: '',
              statusCode: 200,
              data: cached,
            } as StandardResponse<ConversationMessagePage>,
          ],
        };
      },
    },
  );

  // Flatten pages → chronological (oldest→newest). pages[0] is the newest batch;
  // later pages are older, so reverse the page order before flattening.
  const historyMessages = React.useMemo<AdvisorMessage[]>(() => {
    const pages = messagesQuery.data?.pages ?? [];
    return [...pages].reverse().flatMap((p) => (p.data?.messages ?? []).map(toAdvisorMessage));
  }, [messagesQuery.data]);

  // Persist the latest page so a reopen/reload paints instantly.
  React.useEffect(() => {
    if (!activeConversationId) return;
    const head = messagesQuery.data?.pages?.[0]?.data;
    if (head) writeHead(activeConversationId, head);
  }, [activeConversationId, messagesQuery.data]);

  // Reset local UI on conversation change — but NOT when the current conversation
  // is just being "promoted" (null → its freshly-generated id). The live buffer is
  // intentionally NOT touched here: it lives in the store and must survive switches
  // so a backgrounded stream is never cut.
  React.useEffect(() => {
    if (activeConversationId && activeConversationId === conversationIdRef.current) {
      return;
    }
    hasNotifiedRef.current = false;
    conversationIdRef.current = activeConversationId;
    stickToBottomRef.current = true;
    didInitialScrollRef.current = false;
    setInputText('');
    setAttachments([]);
  }, [activeConversationId]);

  // View = history ++ live. Most duplicates share FE ids via appendToHead; user
  // turns returned by the server can have backend ids, so also collapse exact
  // same user text sent within a short window. This keeps the optimistic user
  // bubble from rendering beside its persisted copy while an approval card keeps
  // the live buffer alive.
  const displayMessages = React.useMemo(() => {
    const seen = new Set<string>();
    const seenUserTurns: Array<{ content: string; createdAt: number }> = [];
    const actionIndexes = new Map<string, number>();
    const out: AdvisorMessage[] = [];
    for (const m of [...historyMessages, ...stream.messages]) {
      if (seen.has(m.id)) continue;
      const proposedActionKey = actionKey(m);
      if (proposedActionKey) {
        const previousIndex = actionIndexes.get(proposedActionKey);
        if (previousIndex !== undefined) {
          out[previousIndex] = m;
          seen.add(m.id);
          continue;
        }
        actionIndexes.set(proposedActionKey, out.length);
      }
      if (m.role === 'user') {
        const createdAt = m.createdAt.getTime();
        const duplicateUserTurn = seenUserTurns.some(
          (seen) =>
            seen.content === m.content &&
            Math.abs(seen.createdAt - createdAt) < 5 * 60 * 1000,
        );
        if (duplicateUserTurn) continue;
        seenUserTurns.push({ content: m.content, createdAt });
      }
      seen.add(m.id);
      out.push(m);
    }
    return out;
  }, [historyMessages, stream.messages]);

  // When a turn finishes while viewing this conversation, refresh server history so
  // it becomes authoritative (then the effect below drops the live buffer).
  const wasStreamingRef = React.useRef(false);
  React.useEffect(() => {
    const was = wasStreamingRef.current;
    wasStreamingRef.current = stream.isStreaming;
    if (was && !stream.isStreaming && activeConversationId && shouldLoadHistory) {
      void utils.advisor.getConversationMessages.invalidate({
        conversationId: activeConversationId,
        limit: MESSAGE_PAGE_SIZE,
      });
    }
  }, [stream.isStreaming, activeConversationId, shouldLoadHistory, utils]);

  // Drop the FE-id live buffer only once SERVER history that POSTDATES the last
  // finished turn has landed — i.e. real data (not the placeholder cache), not
  // mid-fetch, and updated AFTER the turn finalized. Gating on the finalize
  // timestamp is what prevents the just-finished turn from briefly disappearing
  // when a stale refetch lands after a tab switch (it would clear live before the
  // server even has the turn). Runs before paint.
  React.useLayoutEffect(() => {
    if (!activeConversationId || stream.isStreaming) return;
    const liveActionKeys = stream.messages
      .map(actionKey)
      .filter((key): key is string => !!key);
    if (
      liveActionKeys.length > 0 &&
      !liveActionKeys.every((key) =>
        historyMessages.some((message) => actionKey(message) === key),
      )
    ) {
      return;
    }
    if (!messagesQuery.data || messagesQuery.isPlaceholderData || messagesQuery.isFetching) {
      return;
    }
    if (messagesQuery.dataUpdatedAt < getFinalizedAt(activeConversationId)) return;
    clearConversationStream(activeConversationId);
  }, [
    activeConversationId,
    stream.isStreaming,
    stream.messages,
    messagesQuery.data,
    messagesQuery.isPlaceholderData,
    messagesQuery.isFetching,
    messagesQuery.dataUpdatedAt,
    historyMessages,
  ]);

  // Scroll positioning: maintain offset after prepending older messages; else
  // stick to the bottom for new content / first paint.
  React.useLayoutEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    if (isPrependingRef.current) {
      vp.scrollTop = vp.scrollHeight - prevScrollHeightRef.current;
      isPrependingRef.current = false;
      return;
    }
    if (!didInitialScrollRef.current || stickToBottomRef.current) {
      vp.scrollTop = vp.scrollHeight;
      didInitialScrollRef.current = true;
    }
  }, [displayMessages]);

  const handleScroll = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    stickToBottomRef.current =
      vp.scrollHeight - vp.scrollTop - vp.clientHeight < STICK_BOTTOM_THRESHOLD;

    if (
      vp.scrollTop <= LOAD_OLDER_THRESHOLD &&
      messagesQuery.hasNextPage &&
      !messagesQuery.isFetchingNextPage
    ) {
      isPrependingRef.current = true;
      prevScrollHeightRef.current = vp.scrollHeight;
      void messagesQuery.fetchNextPage();
    }
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendText = (text: string) => {
    if ((!text && attachments.length === 0) || stream.isStreaming) return;

    const isNewConversation = activeConversationId === null;
    const conversationId =
      activeConversationId ?? (conversationIdRef.current ??= crypto.randomUUID());

    if (!hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onFirstMessageSent();
      if (isNewConversation) onConversationStarted(conversationId);
    }

    setInputText('');
    setAttachments([]);
    stickToBottomRef.current = true;

    // Runs in the store (outside React) — survives unmount/navigation.
    void streamConversationMessage({
      conversationId,
      message: text,
      onFinished: onConversationUpdated,
    });
  };

  const handleSend = () => {
    sendText(inputText.trim());
  };

  const handleRecommendationClick = (recommendation: string) => {
    sendText(`Do this recommendation: ${recommendation}`);
  };

  const handleStop = () => {
    const id = activeConversationId ?? conversationIdRef.current;
    if (id) stopConversationStream(id);
  };

  // ── Action state (HITL — live messages only) ────────────────────────────────
  const handleActionApprove = (messageId: string) => {
    if (streamKey !== NO_CONVERSATION) {
      void resumeConversation({
        conversationId: streamKey,
        approved: true,
        actionMessageId: messageId,
        onFinished: onConversationUpdated,
      });
    }
  };

  const handleActionReject = (messageId: string) => {
    if (streamKey !== NO_CONVERSATION) {
      void resumeConversation({
        conversationId: streamKey,
        approved: false,
        actionMessageId: messageId,
        onFinished: onConversationUpdated,
      });
    }
  };

  const inputProps = {
    value: inputText,
    attachments,
    isStreaming: stream.isStreaming,
    onChange: setInputText,
    onSend: handleSend,
    onStop: handleStop,
    onAttach: (att: PendingAttachment) => setAttachments((prev) => [...prev, att]),
    onRemoveAttachment: (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id)),
  };

  const isEmpty = displayMessages.length === 0;

  // Opening an existing conversation with no cached head — spinner instead of a
  // greeting flash while the first page loads.
  if (isEmpty && shouldLoadHistory && messagesQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2
          className="text-text-disabled size-5 animate-spin"
          aria-label="Loading conversation"
        />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex h-full overflow-y-auto">
        <div className="flex min-h-full w-full items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl">
            <ChatEmptyState
              onPromptSelect={(p) => setInputText(p)}
              inputSlot={
                <>
                  <UsageBanner
                    used={plan?.usage?.[Usage.AI_CHAT_MESSAGES_PER_MONTH]?.count ?? 0}
                    limit={(plan?.limits?.[Usage.AI_CHAT_MESSAGES_PER_MONTH] ?? 10) as number}
                    variant="quota"
                    label="chat messages"
                    className="mb-2"
                  />
                  <ChatInput {...inputProps} />
                </>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="ft-scrollbar flex-1 overflow-x-hidden overflow-y-auto"
      >
        <div className="flex flex-col gap-4 px-4 py-4">
          {/* Older-messages loading spinner */}
          {messagesQuery.isFetchingNextPage && (
            <div className="flex justify-center py-1">
              <Loader2 className="text-text-disabled size-4 animate-spin" aria-hidden />
            </div>
          )}

          {displayMessages.map((message) =>
            // Hide the not-yet-streamed assistant bubble — the typing indicator
            // stands in for it until the first token arrives.
            message.role === 'assistant' &&
            message.content === '' &&
            !message.proposedAction ? null : (
              <ChatMessage
                key={message.id}
                message={message}
                onActionApprove={handleActionApprove}
                onActionReject={handleActionReject}
                onRecommendationClick={handleRecommendationClick}
              />
            ),
          )}

          {stream.isStreaming && stream.messages[stream.messages.length - 1]?.content === '' && (
            <AdvisorThinkingIndicator />
          )}
        </div>
      </div>

      <UsageBanner
        used={plan?.usage?.[Usage.AI_CHAT_MESSAGES_PER_MONTH]?.count ?? 0}
        limit={(plan?.limits?.[Usage.AI_CHAT_MESSAGES_PER_MONTH] ?? 10) as number}
        variant="quota"
        label="chat messages"
        className="mx-4 mb-2"
      />
      <ChatInput {...inputProps} />
    </div>
  );
}
