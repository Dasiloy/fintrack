'use client';

// ── ChatPanel ─────────────────────────────────────────────────────────────────
// Advisor chat panel. Two visual modes:
//
// EMPTY MODE: full-height centered column — greeting → input → suggested prompts.
// ACTIVE MODE: scrollable message list + input pinned to the bottom.
//
// Message model: the persisted transcript is an **infinite query** (latest page
// on open; scroll-up fetches older pages by cursor). The current session's new
// turns live in local state. The view = history ++ live, so streaming never
// fights the paginated history. A localStorage head-cache gives instant render
// on reload before the network responds.

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { ChatMessage } from './chat_message';
import { ChatInput } from './chat_input';
import { ChatEmptyState } from './chat_empty_state';
import { AdvisorThinkingIndicator } from './advisor_thinking_indicator';
import type { AdvisorMessage, ChatState, PendingAttachment } from '../_lib/advisor.types';
import { streamAdvisor, AdvisorStreamError } from '../_lib/advisor.stream';
import { advisorCache } from '../_lib/advisor.cache';
import { UsageBanner } from '@/app/_components/usage_banner';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { usePlan } from '@/app/providers/plan_usage_provider';
import { api_client } from '@/lib/trpc_app/api_client';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { ConversationMessagePage } from '@fintrack/types/interfaces/ai';

const MESSAGE_PAGE_SIZE = 30;
/** Distance from the top (px) that triggers loading older messages. */
const LOAD_OLDER_THRESHOLD = 80;
/** Distance from the bottom (px) within which we keep auto-scrolling. */
const STICK_BOTTOM_THRESHOLD = 120;

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
}): AdvisorMessage {
  return {
    id: m.id,
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
    createdAt: new Date(m.createdAt),
  };
}

export function ChatPanel({
  activeConversationId,
  loadHistory,
  onFirstMessageSent,
  onConversationUpdated,
  onConversationStarted,
}: ChatPanelProps) {
  const plan = usePlan();
  // `messages` here holds ONLY this session's live turns; history comes from the
  // infinite query below.
  const [chatState, setChatState] = React.useState<ChatState>({
    messages: [],
    inputText: '',
    attachments: [],
    isStreaming: false,
  });

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const hasNotifiedRef = React.useRef(false);
  const conversationIdRef = React.useRef<string | null>(null);

  // Scroll bookkeeping.
  const stickToBottomRef = React.useRef(true);
  const isPrependingRef = React.useRef(false);
  const prevScrollHeightRef = React.useRef(0);
  const didInitialScrollRef = React.useRef(false);

  const shouldLoadHistory = loadHistory && !!activeConversationId;

  // ── Persisted history (cursor-paginated, newest page first) ─────────────────
  const messagesQuery = api_client.advisor.getConversationMessages.useInfiniteQuery(
    { conversationId: activeConversationId ?? '', limit: MESSAGE_PAGE_SIZE },
    {
      enabled: shouldLoadHistory,
      refetchOnWindowFocus: true,
      staleTime: 60_000,
      getNextPageParam: (lastPage) => lastPage.data?.nextCursor ?? undefined,
      // Instant render from the localStorage head-cache while the network loads.
      initialData: () => {
        if (!shouldLoadHistory || !activeConversationId) return undefined;
        const cached = advisorCache.readMessagesHead(activeConversationId);
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

  // Cache the latest page so a reopen/reload paints instantly.
  React.useEffect(() => {
    if (!activeConversationId) return;
    const head = messagesQuery.data?.pages?.[0]?.data;
    if (head) advisorCache.writeMessagesHead(activeConversationId, head);
  }, [activeConversationId, messagesQuery.data]);

  // Reset live state on conversation change — but NOT when the current
  // conversation is just being "promoted" (null → its freshly-generated id).
  React.useEffect(() => {
    if (activeConversationId && activeConversationId === conversationIdRef.current) {
      return;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    hasNotifiedRef.current = false;
    conversationIdRef.current = activeConversationId;
    stickToBottomRef.current = true;
    didInitialScrollRef.current = false;
    setChatState({ messages: [], inputText: '', attachments: [], isStreaming: false });
  }, [activeConversationId]);

  const displayMessages = React.useMemo(
    () => [...historyMessages, ...chatState.messages],
    [historyMessages, chatState.messages],
  );

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

  // Abort any in-flight stream on unmount.
  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

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
  const handleSend = async () => {
    const text = chatState.inputText.trim();
    if ((!text && chatState.attachments.length === 0) || chatState.isStreaming) {
      return;
    }

    const isNewConversation = activeConversationId === null;
    const conversationId =
      activeConversationId ?? (conversationIdRef.current ??= crypto.randomUUID());

    if (!hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onFirstMessageSent();
      if (isNewConversation) onConversationStarted(conversationId);
    }

    const userMessage: AdvisorMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text || '(attached file)',
      createdAt: new Date(),
    };
    const assistantId = crypto.randomUUID();

    stickToBottomRef.current = true;
    setChatState((prev) => ({
      ...prev,
      inputText: '',
      attachments: [],
      isStreaming: true,
      messages: [
        ...prev.messages,
        userMessage,
        { id: assistantId, role: 'assistant', content: '', createdAt: new Date() },
      ],
    }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAdvisor({
        conversationId,
        message: text,
        signal: controller.signal,
        onToken: (delta) => {
          setChatState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + delta } : m,
            ),
          }));
        },
        // Approval / permission cards are wired in a later phase (HITL).
        onEvent: () => {},
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const note =
          err instanceof AdvisorStreamError
            ? 'Sorry, I could not finish that. Please try again.'
            : 'Something went wrong reaching the advisor. Please try again.';
        setChatState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content ? `${m.content}\n\n${note}` : note }
              : m,
          ),
        }));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setChatState((prev) => ({ ...prev, isStreaming: false }));
      onConversationUpdated();
    }
  };

  // ── Action state (HITL — live messages only) ────────────────────────────────
  const handleActionApprove = (messageId: string) => {
    setChatState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === messageId ? { ...m, actionState: 'approved' as const } : m,
      ),
    }));
  };

  const handleActionReject = (messageId: string) => {
    setChatState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === messageId ? { ...m, actionState: 'rejected' as const } : m,
      ),
    }));
  };

  const inputProps = {
    value: chatState.inputText,
    attachments: chatState.attachments,
    isStreaming: chatState.isStreaming,
    onChange: (v: string) => setChatState((prev) => ({ ...prev, inputText: v })),
    onSend: handleSend,
    onAttach: (att: PendingAttachment) =>
      setChatState((prev) => ({ ...prev, attachments: [...prev.attachments, att] })),
    onRemoveAttachment: (id: string) =>
      setChatState((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((a) => a.id !== id),
      })),
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
              onPromptSelect={(p) => setChatState((prev) => ({ ...prev, inputText: p }))}
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
        className="flex-1 overflow-x-hidden overflow-y-auto"
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
            message.role === 'assistant' && message.content === '' ? null : (
              <ChatMessage
                key={message.id}
                message={message}
                onActionApprove={handleActionApprove}
                onActionReject={handleActionReject}
              />
            ),
          )}

          {chatState.isStreaming &&
            chatState.messages[chatState.messages.length - 1]?.content === '' && (
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
