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
import { toast } from '@ui/components';
import { fileToBase64 } from '@fintrack/utils/file';
import { ChatMessage } from './chat_message';
import { ChatInput } from './chat_input';
import type { AdvisorWorkflowSubmission } from './advisor_workflow_dialog';
import { ChatEmptyState } from './chat_empty_state';
import { AdvisorThinkingIndicator } from './advisor_thinking_indicator';
import type {
  AdvisorMessage,
  FailedPendingAttachment,
  PendingAttachment,
  UploadingPendingAttachment,
} from '../_lib/advisor.types';
import {
  conversationStreamAtom,
  streamConversationMessage,
  stopConversationStream,
  clearConversationStream,
  getFinalizedAt,
  resumeConversation,
  approveWorkflowCandidates,
  readHead,
  writeHead,
  readWorkflowRun,
} from '../_lib/advisor.store';
import { UsageBanner } from '@/app/_components/usage_banner';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { usePlan } from '@/app/providers/plan_usage_provider';
import { api_client } from '@/lib/trpc_app/api_client';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { ConversationMessagePage } from '@fintrack/types/interfaces/ai';
import { ADVISOR_MESSAGE_PAGE_SIZE as MESSAGE_PAGE_SIZE } from '../_lib/advisor.config';
import {
  ADVISOR_FILES_MAX_TOTAL_SIZE,
  ADVISOR_FILE_MAX_SIZE,
  ADVISOR_FILE_MIME_TYPES,
} from '@fintrack/types/constants/file.constants';
import {
  toAdvisorMessage,
  actionKey,
  userTurnIdentity,
  hasPersistedEquivalent,
} from '@/app/(ai)/advisor/_lib/advisor.helpers';
import { useNetworkStatus } from '@/hooks/use_network_status';

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

export function ChatPanel({
  activeConversationId,
  loadHistory,
  onFirstMessageSent,
  onConversationUpdated,
  onConversationStarted,
}: ChatPanelProps) {
  const plan = usePlan();
  const utils = api_client.useUtils();
  const uploadFilesMutation = api_client.advisor.uploadFiles.useMutation();
  const deleteUploadedFileMutation = api_client.advisor.deleteUploadedFile.useMutation();

  // Local UI draft only — messages + streaming live in the Jotai store.
  const [inputText, setInputText] = React.useState('');
  const [attachments, setAttachments] = React.useState<PendingAttachment[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = React.useState<
    UploadingPendingAttachment[]
  >([]);
  const [failedAttachments, setFailedAttachments] = React.useState<FailedPendingAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);
  const [streamError, setStreamError] = React.useState<string | null>(null);
  const [actionStateOverrides, setActionStateOverrides] = React.useState<
    Record<string, AdvisorMessage['actionState']>
  >({});

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

  React.useEffect(() => {
    if (!streamError) return;
    const timeout = window.setTimeout(() => setStreamError(null), 60_000);
    return () => window.clearTimeout(timeout);
  }, [streamError]);

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
    return [...pages].reverse().flatMap((p) =>
      (p.data?.messages ?? []).map((message) => {
        const advisorMessage = toAdvisorMessage(message);
        if (!activeConversationId || advisorMessage.role !== 'user') {
          return advisorMessage;
        }
        const workflow = readWorkflowRun(activeConversationId, advisorMessage.content);
        return workflow ? { ...advisorMessage, workflow } : advisorMessage;
      }),
    );
  }, [activeConversationId, messagesQuery.data]);

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
    setStreamError(null);
    setActionStateOverrides({});
  }, [activeConversationId]);

  // View = history ++ live. Most duplicates share FE ids via appendToHead; user
  // turns returned by the server can have backend ids, so also collapse exact
  // same user text sent within a short window. This keeps the optimistic user
  // bubble from rendering beside its persisted copy while an approval card keeps
  // the live buffer alive.
  const displayMessages = React.useMemo(() => {
    const seen = new Set<string>();
    const messageIndexes = new Map<string, number>();
    const seenUserTurns: Array<{ identity: string; createdAt: number }> = [];
    const actionIndexes = new Map<string, number>();
    const out: AdvisorMessage[] = [];
    for (const m of [...historyMessages, ...stream.messages]) {
      if (seen.has(m.id)) {
        const previousIndex = messageIndexes.get(m.id);
        if (previousIndex !== undefined) out[previousIndex] = m;
        continue;
      }
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
        const identity = userTurnIdentity(m);
        const duplicateUserTurn = seenUserTurns.some(
          (seen) =>
            seen.identity === identity && Math.abs(seen.createdAt - createdAt) < 5 * 60 * 1000,
        );
        if (duplicateUserTurn) continue;
        seenUserTurns.push({ identity, createdAt });
      }
      seen.add(m.id);
      messageIndexes.set(m.id, out.length);
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
    if (
      stream.messages.length > 0 &&
      !stream.messages.every((message) => hasPersistedEquivalent(message, historyMessages))
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
  const { online } = useNetworkStatus();
  const sendText = (
    text: string,
    workflow?: AdvisorWorkflowSubmission['workflow'],
    workflowRequest?: AdvisorWorkflowSubmission['request'],
  ) => {
    if ((!text && attachments.length === 0) || stream.isStreaming || isUploadingAttachment) {
      return;
    }

    if (!online) {
      toast.error('You are offline. Please check your internet connection and try again.');
      return;
    }

    const isNewConversation = activeConversationId === null;
    const conversationId =
      activeConversationId ?? (conversationIdRef.current ??= crypto.randomUUID());
    const messageAttachments = attachments;

    if (!hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onFirstMessageSent();
      if (isNewConversation) onConversationStarted(conversationId);
    }

    setInputText('');
    setAttachments([]);
    setStreamError(null);
    setActionStateOverrides((prev) => {
      const next = { ...prev };
      for (const message of displayMessages) {
        if (message.proposedAction && (message.actionState ?? 'pending') === 'pending') {
          next[message.id] = 'expired';
        }
      }
      return next;
    });
    stickToBottomRef.current = true;

    // Runs in the store (outside React) — survives unmount/navigation.
    void streamConversationMessage({
      conversationId,
      message: text,
      attachments: messageAttachments,
      workflow,
      workflowRequest,
      onFinished: onConversationUpdated,
      onError: setStreamError,
    });
  };

  const handleSend = () => {
    sendText(inputText.trim());
  };

  const handleRecommendationClick = (recommendation: string) => {
    sendText(`Do this recommendation: ${recommendation}`);
  };

  const handleWorkflowSelect = ({ prompt, workflow, request }: AdvisorWorkflowSubmission) => {
    sendText(prompt, workflow, request);
    stickToBottomRef.current = true;
  };

  const uploadPickedFiles = async (files: File[], retryIds: string[] = []) => {
    const accepted = files.filter((file) => {
      if (!ADVISOR_FILE_MIME_TYPES.includes(file.type as never)) {
        toast.error('File not accepted', {
          description: 'Only images, PDF, CSV, and XLSX files are supported.',
        });
        return false;
      }
      if (file.size > ADVISOR_FILE_MAX_SIZE) {
        toast.error('File too large', {
          description: 'Each advisor file must be 1 MB or less.',
        });
        return false;
      }
      return true;
    });
    if (accepted.length === 0) return;

    const currentTotal = attachments.reduce((sum, file) => sum + file.sizeBytes, 0);
    const incomingTotal = accepted.reduce((sum, file) => sum + file.size, 0);
    if (currentTotal + incomingTotal > ADVISOR_FILES_MAX_TOTAL_SIZE) {
      toast.error('Too many files', {
        description: 'Advisor attachments cannot exceed 10 MB total.',
      });
      return;
    }

    if (!online) {
      toast.error('You are offline. Please check your internet connection and try again.');
      return;
    }

    const uploading = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }));
    const uploadingIds = uploading.map((file) => file.id);
    setUploadingAttachments((prev) => [...prev, ...uploading]);
    setIsUploadingAttachment(true);
    try {
      if (retryIds.length > 0) {
        setFailedAttachments((prev) => prev.filter((file) => !retryIds.includes(file.id)));
      }

      const result = await uploadFilesMutation.mutateAsync({
        files: await Promise.all(
          accepted.map(async (file) => ({
            file: await fileToBase64(file),
            filename: file.name,
            mimeType: file.type,
          })),
        ),
      });

      setUploadingAttachments((prev) => prev.filter((file) => !uploadingIds.includes(file.id)));

      if (result.uploaded.length > 0) {
        setAttachments((prev) => [
          ...prev,
          ...result.uploaded.map((file) => ({
            id: crypto.randomUUID(),
            ...file,
          })),
        ]);
      }

      if (result.failed.length > 0) {
        setFailedAttachments((prev) => [
          ...prev,
          ...result.failed.flatMap((failure) => {
            const file = accepted[failure.index];
            if (!file) return [];
            return {
              id: crypto.randomUUID(),
              file,
              name: failure.name,
              mimeType: failure.mimeType,
              sizeBytes: failure.sizeBytes,
              reason: failure.reason,
            };
          }),
        ]);
        toast.error('Some files did not upload', {
          description: 'Successful files were added. Retry only the failed files.',
        });
      }
    } catch (err) {
      setUploadingAttachments((prev) => prev.filter((file) => !uploadingIds.includes(file.id)));
      const failed = accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        reason:
          err instanceof Error ? err.message : 'Could not upload this file. Please try again.',
      }));
      setFailedAttachments((prev) => [...prev, ...failed]);
      toast.error('Upload failed', {
        description:
          err instanceof Error
            ? err.message
            : 'Could not upload those advisor files. Please try again.',
      });
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleAttachFiles = async (files: File[]) => {
    await uploadPickedFiles(files);
  };

  const handleRetryFailedAttachment = async (id: string) => {
    const failed = failedAttachments.find((file) => file.id === id);
    if (!failed) return;
    await uploadPickedFiles([failed.file], [id]);
  };

  const handleRemoveFailedAttachment = (id: string) => {
    setFailedAttachments((prev) => prev.filter((file) => file.id !== id));
  };

  const handleRemoveAttachment = (id: string) => {
    const attachment = attachments.find((file) => file.id === id);
    setAttachments((prev) => prev.filter((file) => file.id !== id));

    if (!attachment) return;
    void deleteUploadedFileMutation
      .mutateAsync({
        publicId: attachment.publicId,
        kind: attachment.kind,
      })
      .catch(() => undefined);
  };

  const handleStop = () => {
    const id = activeConversationId ?? conversationIdRef.current;
    if (id) stopConversationStream(id);
  };

  // ── Action state (HITL — live messages only) ────────────────────────────────
  const handleActionApprove = (messageId: string) => {
    if (!online) {
      toast.error('You are offline. Please check your internet connection and try again.');
      return;
    }
    if (streamKey !== NO_CONVERSATION) {
      if (actionStateOverrides[messageId] === 'processing') return;
      setActionStateOverrides((prev) => ({ ...prev, [messageId]: 'processing' }));
      setStreamError(null);
      void resumeConversation({
        conversationId: streamKey,
        approved: true,
        actionMessageId: messageId,
        onFinished: onConversationUpdated,
        onError: setStreamError,
      }).then((state) => {
        setActionStateOverrides((prev) => ({ ...prev, [messageId]: state }));
      });
    }
  };

  const handleActionReject = (messageId: string) => {
    if (!online) {
      toast.error('You are offline. Please check your internet connection and try again.');
      return;
    }
    if (streamKey !== NO_CONVERSATION) {
      if (actionStateOverrides[messageId] === 'processing') return;
      setActionStateOverrides((prev) => ({ ...prev, [messageId]: 'processing' }));
      setStreamError(null);
      void resumeConversation({
        conversationId: streamKey,
        approved: false,
        actionMessageId: messageId,
        onFinished: onConversationUpdated,
        onError: setStreamError,
      }).then((state) => {
        setActionStateOverrides((prev) => ({ ...prev, [messageId]: state }));
      });
    }
  };

  const handleWorkflowCandidateApprove = (messageId: string, candidateIds: string[]) => {
    if (!online) {
      toast.error('You are offline. Please check your internet connection and try again.');
      return;
    }
    if (streamKey === NO_CONVERSATION || stream.isStreaming || candidateIds.length === 0) {
      return;
    }

    setStreamError(null);
    void approveWorkflowCandidates({
      conversationId: streamKey,
      responseMessageId: messageId,
      selectedCandidateIds: candidateIds,
      onFinished: onConversationUpdated,
      onError: setStreamError,
    });
  };

  const inputProps = {
    value: inputText,
    attachments,
    uploadingAttachments,
    failedAttachments,
    streamError,
    isStreaming: stream.isStreaming,
    isUploading: isUploadingAttachment,
    onChange: setInputText,
    onSend: handleSend,
    onStop: handleStop,
    onAttach: handleAttachFiles,
    onRemoveAttachment: handleRemoveAttachment,
    onRetryFailedAttachment: handleRetryFailedAttachment,
    onRemoveFailedAttachment: handleRemoveFailedAttachment,
    onDismissStreamError: () => setStreamError(null),
    onWorkflowSelect: handleWorkflowSelect,
  };

  const isEmpty = displayMessages.length === 0;
  const streamingAssistantMessage = stream.messages[stream.messages.length - 1];
  const streamingUserMessage = stream.messages[stream.messages.length - 2];
  const isApprovalResumeStream =
    streamingUserMessage?.role === 'assistant' &&
    !!streamingUserMessage.proposedAction &&
    streamingUserMessage.actionState === 'processing';
  const showThinkingIndicator =
    stream.isStreaming &&
    !isApprovalResumeStream &&
    !streamingUserMessage?.workflow &&
    streamingAssistantMessage?.role === 'assistant' &&
    streamingAssistantMessage.content === '' &&
    !streamingAssistantMessage.proposedAction;
  const thinkingHasAttachments =
    showThinkingIndicator && (streamingUserMessage?.attachments?.length ?? 0) > 0;

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
            !message.proposedAction &&
            !message.workflowResponse ? null : (
              <ChatMessage
                key={message.id}
                message={
                  actionStateOverrides[message.id]
                    ? { ...message, actionState: actionStateOverrides[message.id] }
                    : message
                }
                onActionApprove={handleActionApprove}
                onActionReject={handleActionReject}
                onWorkflowCandidateApprove={handleWorkflowCandidateApprove}
                onRecommendationClick={handleRecommendationClick}
              />
            ),
          )}

          {showThinkingIndicator && (
            <AdvisorThinkingIndicator hasAttachments={thinkingHasAttachments} />
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
