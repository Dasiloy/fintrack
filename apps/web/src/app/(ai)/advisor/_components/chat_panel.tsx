'use client';

// ── ChatPanel ─────────────────────────────────────────────────────────────────
// Advisor chat: scrollable message list (flex-1) + pinned input (shrink-0).
// Owns ChatState; simulates LLM streaming via a setInterval at 40ms/word.
//
// Streaming approach: when the user sends a message, an empty assistant message
// is inserted immediately (with a unique tempId). A setInterval then appends
// words one at a time into that message. On completion the message is finalised
// and an optional proposedAction is attached.
// This pattern requires mutating by tempId — the comment below the interval
// explains why this is necessary for streaming UX.

import * as React from 'react';
import { ScrollArea } from '@ui/components';
import { ChatMessage } from './chat_message';
import { ChatInput } from './chat_input';
import { ChatEmptyState } from './chat_empty_state';
import type { AdvisorMessage, ChatState, PendingAttachment, AdvisorAction } from '../_lib/advisor.types';
import { STUB_MESSAGES } from '../_lib/advisor.stub';
import { STREAM_INTERVAL_MS } from '../_lib/advisor.constants';

// ── Stub responses ────────────────────────────────────────────────────────────
// Deterministic replies keyed to certain input patterns.
// All others get the fallback. Real system replaces this with an SSE stream.

const STUB_RESPONSES: Array<{
  match: RegExp;
  response: string;
  action?: AdvisorAction;
}> = [
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

export function ChatPanel() {
  const [chatState, setChatState] = React.useState<ChatState>({
    messages: STUB_MESSAGES,
    inputText: '',
    attachments: [],
    isStreaming: false,
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const streamIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll to bottom whenever messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  // Clean up interval on unmount to avoid memory leaks
  React.useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  // ── Simulated streaming ───────────────────────────────────────────────────
  // Inserts an empty placeholder message identified by tempId, then fills it
  // word-by-word. On completion, the message is finalised in-place by matching
  // tempId. We mutate by id (not by array index) because new user messages may
  // arrive during the interval, shifting indices.
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
        // Finalise: replace accumulated content with the full string and attach action
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

    // Pick the first matching stub response, or use the fallback
    const match = STUB_RESPONSES.find((r) => r.match.test(text));
    const responseText = match?.response ?? FALLBACK_RESPONSE;
    const responseAction = match?.action;

    // Small delay before the assistant "starts typing"
    setTimeout(() => simulateStream(responseText, responseAction), 400);
  };

  // ── Action state callbacks ─────────────────────────────────────────────────
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

  const isEmpty = chatState.messages.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Message list ────────────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <ChatEmptyState onPromptSelect={(p) => setChatState((prev) => ({ ...prev, inputText: p }))} />
        ) : (
          <div className="flex flex-col gap-4 px-4 py-4">
            {chatState.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onActionApprove={handleActionApprove}
                onActionReject={handleActionReject}
              />
            ))}
            {/* Streaming indicator — shown when the assistant is "typing" but has no content yet */}
            {chatState.isStreaming &&
              chatState.messages[chatState.messages.length - 1]?.content === '' && (
                <TypingIndicator />
              )}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* ── Pinned input ─────────────────────────────────────────────────── */}
      <ChatInput
        value={chatState.inputText}
        attachments={chatState.attachments}
        isStreaming={chatState.isStreaming}
        onChange={(v) => setChatState((prev) => ({ ...prev, inputText: v }))}
        onSend={handleSend}
        onAttach={(att) =>
          setChatState((prev) => ({ ...prev, attachments: [...prev.attachments, att] }))
        }
        onRemoveAttachment={(id) =>
          setChatState((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((a) => a.id !== id),
          }))
        }
      />
    </div>
  );
}

// ── TypingIndicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <span className="text-[10px] text-primary font-bold">AI</span>
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-bg-surface px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-text-disabled animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
