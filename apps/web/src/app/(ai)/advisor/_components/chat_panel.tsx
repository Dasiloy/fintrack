'use client';

// ── ChatPanel ─────────────────────────────────────────────────────────────────
// Advisor chat: two visual modes depending on message state.
//
// EMPTY MODE (no messages):
//   Full-height centered column — greeting → input → suggested prompts.
//   Matches the Claude / ChatGPT UX where the input is the page centrepiece.
//   The input is NOT pinned to the bottom in this mode.
//
// ACTIVE MODE (has messages):
//   Scrollable message list (flex-1) + input pinned to the bottom (shrink-0).
//
// Switching between modes happens automatically as `messages` transitions from
// 0 → 1 (first send) or 1 → 0 (conversation reset via activeConversationId).
//
// Streaming: an empty placeholder message identified by tempId is inserted on
// send. A setInterval appends words at 40ms each. On completion the message is
// finalised in-place by matching tempId (index-stable even if new user messages
// arrive during streaming).
//
// activeConversationId drives reset: when it changes to null the chat clears;
// when it changes to a known id the stub messages load.
// onFirstMessageSent is called on the first user send so the parent can update
// its "has messages" guard and unblock the New Conversation button.

import * as React from 'react';
import { ScrollArea } from '@ui/components';
import { ChatMessage } from './chat_message';
import { ChatInput } from './chat_input';
import { ChatEmptyState } from './chat_empty_state';
import type { AdvisorMessage, ChatState, PendingAttachment, AdvisorAction } from '../_lib/advisor.types';
import { STUB_MESSAGES } from '../_lib/advisor.stub';
import { STREAM_INTERVAL_MS } from '../_lib/advisor.constants';

// ── Stub responses ────────────────────────────────────────────────────────────

const STUB_RESPONSES: Array<{ match: RegExp; response: string; action?: AdvisorAction }> = [
  {
    match: /food|dining|restaurant|chowdeck/i,
    response:
      "Looking at your food spending over the last 30 days, you've spent **₦89,400 total** — that's **₦29,400 above your ₦60,000 budget**.\n\nThe biggest drivers are ChowDeck (₦22,100), Shoprite Lekki (₦18,400), and Big Treat Restaurant (₦14,200).\n\nWould you like me to raise your food budget to match your actual spending pattern, or would you prefer to set stricter limits?",
  },
  {
    match: /emergency fund|savings goal|goal/i,
    response:
      "Your Emergency Fund is at **₦245,000 of ₦500,000** (49% complete). You have until December to hit your target.\n\nAt your current contribution of ₦22,500/mo, you'll end up at **₦382,500** by December — short by ₦117,500.\n\nTo hit your goal on time, you need to contribute **₦29,167/mo**. That's ₦6,667 more per month. I can adjust your contribution if you'd like.",
    action: {
      kind: 'adjust_goal_contribution',
      goalName: 'Emergency Fund',
      currentAmount: 22500,
      proposedAmount: 29167,
      reason: 'Current pace reaches only ₦382,500 by December. ₦29,167/mo hits the ₦500,000 target exactly.',
    },
  },
  {
    match: /subscriptions?|cancel|showmax|dstv|netflix/i,
    response:
      "I found **3 potential unused subscriptions** in your recent transactions:\n\n- **Showmax** — ₦4,500/mo (last streamed: 22 days ago)\n- **iROKOtv** — ₦3,200/mo (last streamed: 41 days ago)\n- **Unidentified debit** — ₦2,100/mo (no matching service found)\n\nCancelling the two inactive ones would save you **₦7,700/mo** — that's **₦92,400 per year**.\n\nWould you like me to flag them as unused?",
    action: {
      kind: 'flag_subscription',
      name: 'iROKOtv',
      amount: 3200,
      reason: 'No streaming activity detected in the last 41 days.',
    },
  },
  {
    match: /cash flow|after bills|available/i,
    response:
      'Based on your recurring bills and expected income:\n\n**Income this month:** ₦280,000\n**Recurring bills:** ₦47,200 total\n- EKEDC: ₦12,400\n- Internet (Spectranet): ₦15,000\n- Rent instalment: ₦19,800\n\n**Available after the 15th:** ₦28,500\n\nThis is after accounting for your expected salary credit and all scheduled debits. Your buffer is healthy, but the food spike is eating into it.',
  },
  {
    match: /compare|last month|previous month|vs/i,
    response:
      'Here\'s your **October vs September comparison**:\n\n| Category | September | October | Change |\n|----------|-----------|---------|--------|\n| Food | ₦31,200 | ₦47,200 | +51% |\n| Transport | ₦9,800 | ₦10,400 | +6% |\n| Entertainment | ₦8,200 | ₦7,800 | -5% |\n| Utilities | ₦18,100 | ₦18,900 | +4% |\n\nOverall October spend is tracking **₦18,400 higher** than September. The food category is the primary driver.',
  },
];

const FALLBACK_RESPONSE =
  "I've checked your accounts and here's what I found based on your question.\n\nYour overall financial health looks stable this month. Total spend is tracking about 12% above your monthly budget, primarily due to food and dining. Three of your four savings goals are on pace.\n\nWould you like me to dig into a specific area, or would a full monthly summary be helpful?";

// ── Component ─────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  activeConversationId: string | null;
  onFirstMessageSent: () => void;
}

export function ChatPanel({ activeConversationId, onFirstMessageSent }: ChatPanelProps) {
  const [chatState, setChatState] = React.useState<ChatState>(() => ({
    messages: activeConversationId ? STUB_MESSAGES : [],
    inputText: '',
    attachments: [],
    isStreaming: false,
  }));

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const streamIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks whether onFirstMessageSent has been fired for this conversation session.
  const hasNotifiedRef = React.useRef(activeConversationId !== null);

  // Reset chat state whenever the active conversation changes.
  React.useEffect(() => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    hasNotifiedRef.current = activeConversationId !== null;
    setChatState({
      messages: activeConversationId ? STUB_MESSAGES : [],
      inputText: '',
      attachments: [],
      isStreaming: false,
    });
  }, [activeConversationId]);

  // Scroll to bottom whenever messages change (active mode only)
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  // Cancel stream on unmount
  React.useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  // ── Simulated streaming ───────────────────────────────────────────────────
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

  // ── Send handler ──────────────────────────────────────────────────────────
  const handleSend = () => {
    const text = chatState.inputText.trim();
    if ((!text && chatState.attachments.length === 0) || chatState.isStreaming) return;

    // Notify parent on the very first message so the New Conversation guard lifts
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

    const match = STUB_RESPONSES.find((r) => r.match.test(text));
    const responseText = match?.response ?? FALLBACK_RESPONSE;
    const responseAction = match?.action;

    setTimeout(() => simulateStream(responseText, responseAction), 400);
  };

  // ── Action callbacks ──────────────────────────────────────────────────────
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

  // ── Shared input props ────────────────────────────────────────────────────
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

  // ── Empty state — centered layout, input is in the flow ───────────────────
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

  // ── Active chat — scrollable messages + pinned input ──────────────────────
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

// ── TypingIndicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <span className="text-[10px] font-bold text-primary">AI</span>
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-bg-surface px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-text-disabled"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
