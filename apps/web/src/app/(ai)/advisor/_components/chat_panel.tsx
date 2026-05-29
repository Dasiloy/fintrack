'use client';

// ── ChatPanel ─────────────────────────────────────────────────────────────────
// Advisor chat panel. Two visual modes:
//
// EMPTY MODE: full-height centered column — greeting → input → suggested prompts.
// ACTIVE MODE: scrollable message list + input pinned to the bottom.
//
// The streaming infrastructure (simulateStream + setInterval) is in place for
// when the real LLM endpoint is wired in. For now, sends are one-way — the user
// message is appended but no AI response is generated yet.
//
// activeConversationId reset: when it changes to null the chat clears;
// onFirstMessageSent notifies the parent to unblock the New Conversation button.

import * as React from 'react';
import { ScrollArea } from '@ui/components';
import { ChatMessage } from './chat_message';
import { ChatInput } from './chat_input';
import { ChatEmptyState } from './chat_empty_state';
import type {
  AdvisorMessage,
  ChatState,
  PendingAttachment,
  AdvisorAction,
} from '../_lib/advisor.types';
import { STREAM_INTERVAL_MS } from '../_lib/advisor.constants';
import { TypingIndicator } from '@/app/_components';

interface ChatPanelProps {
  activeConversationId: string | null;
  onFirstMessageSent: () => void;
}

export function ChatPanel({ activeConversationId, onFirstMessageSent }: ChatPanelProps) {
  const [chatState, setChatState] = React.useState<ChatState>({
    messages: [],
    inputText: '',
    attachments: [],
    isStreaming: false,
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const streamIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNotifiedRef = React.useRef(false);

  // Reset on conversation change
  React.useEffect(() => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    hasNotifiedRef.current = false;
    setChatState({ messages: [], inputText: '', attachments: [], isStreaming: false });
  }, [activeConversationId]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  // ── Streaming (used when real LLM response arrives) ───────────────────────
  const simulateStream = (fullResponse: string, action?: AdvisorAction) => {
    const tempId = crypto.randomUUID();
    const words = fullResponse.split(' ');
    let i = 0;

    setChatState((prev) => ({
      ...prev,
      isStreaming: true,
      messages: [
        ...prev.messages,
        { id: tempId, role: 'assistant', content: '', createdAt: new Date() },
      ],
    }));

    streamIntervalRef.current = setInterval(() => {
      if (i >= words.length) {
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        setChatState((prev) => ({
          ...prev,
          isStreaming: false,
          messages: prev.messages.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  content: fullResponse,
                  ...(action ? { proposedAction: action, actionState: 'pending' as const } : {}),
                }
              : m,
          ),
        }));
        return;
      }
      const chunk = words[i++] + ' ';
      setChatState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === tempId ? { ...m, content: m.content + chunk } : m,
        ),
      }));
    }, STREAM_INTERVAL_MS);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = () => {
    const text = chatState.inputText.trim();
    if ((!text && chatState.attachments.length === 0) || chatState.isStreaming) return;

    if (!hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onFirstMessageSent();
    }

    const userMessage: AdvisorMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text || '(attached file)',
      createdAt: new Date(),
    };

    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputText: '',
      attachments: [],
    }));

    // TODO: call real LLM endpoint here and pipe response into simulateStream()
  };

  // ── Action state ──────────────────────────────────────────────────────────
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

  const isEmpty = chatState.messages.length === 0;

  if (isEmpty) {
    return (
      <div className="flex h-full overflow-y-auto">
        <div className="flex min-h-full w-full items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl">
            <ChatEmptyState
              onPromptSelect={(p) => setChatState((prev) => ({ ...prev, inputText: p }))}
              inputSlot={<ChatInput {...inputProps} />}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="flex flex-col gap-4 px-4 py-4">
          {chatState.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onActionApprove={handleActionApprove}
              onActionReject={handleActionReject}
            />
          ))}
          {chatState.isStreaming &&
            chatState.messages[chatState.messages.length - 1]?.content === '' && (
              <TypingIndicator />
            )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <ChatInput {...inputProps} />
    </div>
  );
}
