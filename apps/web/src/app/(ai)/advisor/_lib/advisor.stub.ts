// ── Advisor stub data ─────────────────────────────────────────────────────────
// Realistic mock data for all advisor UI states.
// Uses Nigerian Naira amounts, real category slugs, and NG-relevant merchants.
// Replace with real API calls when the backend is ready.

import type {
  AdvisorInsight,
  AdvisorMessage,
  ConversationThread,
} from './advisor.types';

// ── Helper to build dates relative to now ────────────────────────────────────

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000);
const minsAgo = (n: number) => new Date(Date.now() - n * 60 * 1000);

// ── Conversation threads ──────────────────────────────────────────────────────

export const STUB_THREADS: ConversationThread[] = [
  {
    id: 'thread-1',
    title: 'October spending review',
    lastMessage: 'Your food spend is 3× your usual average this week.',
    updatedAt: minsAgo(5),
    messageCount: 10,
  },
  {
    id: 'thread-2',
    title: 'Food budget analysis',
    lastMessage: "I've raised your Food budget to ₦42,000 as requested.",
    updatedAt: hoursAgo(3),
    messageCount: 6,
  },
  {
    id: 'thread-3',
    title: 'Emergency Fund pacing',
    lastMessage: 'You need ₦3,750/mo extra to hit your December deadline.',
    updatedAt: daysAgo(1),
    messageCount: 4,
  },
  {
    id: 'thread-4',
    title: 'Bills breakdown',
    lastMessage: 'You have 5 recurring bills totalling ₦47,200/mo.',
    updatedAt: daysAgo(2),
    messageCount: 5,
  },
  {
    id: 'thread-5',
    title: 'Q3 vs Q4 comparison',
    lastMessage: 'Your savings rate dropped from 18% to 12% this quarter.',
    updatedAt: daysAgo(5),
    messageCount: 8,
  },
  {
    id: 'thread-6',
    title: 'Upcoming cash flow',
    lastMessage: 'After bills, ₦28,500 will be available after the 15th.',
    updatedAt: daysAgo(7),
    messageCount: 3,
  },
];

// ── Chat messages (active thread — thread-1) ──────────────────────────────────
// 5 exchanges: advisor intro → goal pacing → budget proposal → PDF analysis → CSV

export const STUB_MESSAGES: AdvisorMessage[] = [
  // Exchange 1 — Advisor proactively flags food spike
  {
    id: 'msg-1',
    role: 'assistant',
    content:
      "Good morning! I've been watching your October spending and there's something worth flagging.\n\nYour **food spend is ₦47,200 this week** — that's 3× your usual ₦15,800 weekly average. Part of this (about 18%) is explained by Nigerian food inflation, but the rest looks like a change in habit.\n\nWould you like me to dig into which merchants are driving this?",
    createdAt: hoursAgo(2),
  },
  {
    id: 'msg-2',
    role: 'user',
    content: "Yes, show me the breakdown. Also, how's my Emergency Fund looking?",
    createdAt: hoursAgo(2),
  },

  // Exchange 2 — Goal pacing answer
  {
    id: 'msg-3',
    role: 'assistant',
    content:
      "**Food spend this week:**\n- Shoprite Lekki — ₦18,400\n- ChowDeck (multiple orders) — ₦14,800\n- Big Treat Restaurant — ₦9,200\n- Farmers' market — ₦4,800\n\nThe ChowDeck orders are the standout — you've ordered 6 times this week vs your usual 2.\n\n**Emergency Fund:**\nYou're currently at ₦245,000 of your ₦500,000 target (49%). With your December deadline, you need to save ₦29,167/mo. Your current contribution is ₦22,500/mo — you're **₦6,667/mo short**. I can adjust the monthly contribution if you'd like.",
    createdAt: hoursAgo(2),
  },
  {
    id: 'msg-4',
    role: 'user',
    content: 'My food budget feels too tight now. Can you raise it?',
    createdAt: hoursAgo(1),
  },

  // Exchange 3 — Budget adjustment proposal (HITL action)
  {
    id: 'msg-5',
    role: 'assistant',
    content:
      "Looking at your last 3 months, your average food spend is **₦38,400/mo** — but your current budget is ₦30,000. That's been consistently under pressure.\n\nI'd suggest raising it to **₦42,000** — that's in line with your actual spending pattern and gives you a small buffer for weeks like this one.",
    createdAt: hoursAgo(1),
    proposedAction: {
      kind: 'adjust_budget',
      categorySlug: 'food',
      currentLimit: 30000,
      proposedLimit: 42000,
      reason:
        '3-month average spend of ₦38,400 consistently exceeds the current ₦30,000 limit. ₦42,000 aligns the budget with actual behaviour.',
    },
    actionState: 'pending',
  },
  {
    id: 'msg-6',
    role: 'user',
    content: 'Here is my GTBank statement from last month. Can you analyse it?',
    createdAt: minsAgo(45),
  },

  // Exchange 4 — PDF analysis with generated file
  {
    id: 'msg-7',
    role: 'assistant',
    content:
      "I've gone through your GTBank statement. Here's what stands out:\n\n**3 uncategorised direct debits:**\n- ₦4,500/mo — likely Showmax (matches streaming billing cycle)\n- ₦3,200/mo — likely iROKOtv\n- ₦2,100/mo — unidentified, possibly a DSTV top-up\n\nThese total **₦9,800/mo** in subscriptions that aren't showing in your recurring items. Want me to add them?\n\nI've also generated a clean summary of the statement for your records.",
    createdAt: minsAgo(44),
    generatedFiles: [
      { name: 'GTBank_October_Summary.pdf', type: 'pdf', sizeKb: 124 },
    ],
  },
  {
    id: 'msg-8',
    role: 'user',
    content: 'Great. Can you also export my last 3 months of transactions as a CSV?',
    createdAt: minsAgo(10),
  },

  // Exchange 5 — CSV export
  {
    id: 'msg-9',
    role: 'assistant',
    content:
      'Done! Your transactions from **1 August – 31 October 2025** are ready. The export includes date, merchant, category, amount, and type for all 147 transactions.\n\nA few things you might notice in the data:\n- September had your highest spend month (₦312,400)\n- Food & Dining is your largest category at 34% of total spend',
    createdAt: minsAgo(9),
    generatedFiles: [
      { name: 'Transactions_Aug-Oct_2025.csv', type: 'csv', sizeKb: 38 },
    ],
  },
  {
    id: 'msg-10',
    role: 'user',
    content: 'Thanks, this is really helpful.',
    createdAt: minsAgo(5),
  },
];

// ── AI Insight (latest run) ───────────────────────────────────────────────────

export const STUB_INSIGHT: AdvisorInsight = {
  id: 'insight-1',
  generatedAt: hoursAgo(2),
  trigger: 'daily',
  summary:
    "Your October spending is tracking 12% above your monthly budget, driven primarily by a spike in food and dining. Your net savings rate has dipped to 9% this month — below your 15% target. The good news: your recurring bills are stable and three of your four goals are on track.",
  anomalies: [
    'Food & Dining: ₦47,200 this week — 3× your ₦15,800 weekly average. Part of this (~18%) aligns with recent Nigerian food CPI increases.',
    'Potential subscriptions detected: Showmax (₦4,500/mo), iROKOtv (₦3,200/mo) — neither appears in your recurring items.',
    'ChowDeck spend: 6 orders this week vs your 2-order average. Total: ₦14,800.',
  ],
  goalAlerts: [
    'Emergency Fund: ₦245,000 of ₦500,000 (49%). Need ₦29,167/mo by December — you\'re contributing ₦22,500/mo. You\'re ₦6,667/mo short of your deadline.',
  ],
  cashFlowForecast:
    'After recurring bills (₦47,200 total) and expected income (₦280,000), ₦28,500 will be available after the 15th.',
  recommendations: [
    {
      id: 'rec-1',
      text: 'Raise your Food budget from ₦30,000 to ₦42,000 — your 3-month average spend is ₦38,400 and the current limit is consistently missed.',
      priority: 'high',
      category: 'budget',
      actionable: true,
    },
    {
      id: 'rec-2',
      text: 'Add ₦6,667/mo to your Emergency Fund contribution to hit your December deadline. Consider redirecting from discretionary spending.',
      priority: 'high',
      category: 'goal',
      actionable: true,
    },
    {
      id: 'rec-3',
      text: 'Review your Showmax and iROKOtv subscriptions (₦7,700/mo combined). If you only use one, cancelling the other saves ₦92,400 annually.',
      priority: 'medium',
      category: 'spending',
      actionable: false,
    },
    {
      id: 'rec-4',
      text: 'Your savings rate dropped from 18% last month to 9% this month. Staying above 15% would add ₦16,800 to your savings over the rest of the year.',
      priority: 'medium',
      category: 'saving',
      actionable: false,
    },
  ],
  macroContext: {
    ngnUsdRate: 1580,
    foodCpiYoY: 18.2,
    cbnPolicyRate: 26.75,
    fetchedAt: hoursAgo(2).toISOString(),
  },
};

// ── Stub budget utilisation (for context panel) ───────────────────────────────

export interface StubBudget {
  categorySlug: string;
  label: string;
  budgeted: number;
  spent: number;
}

export const STUB_BUDGETS: StubBudget[] = [
  { categorySlug: 'food', label: 'Food & Dining', budgeted: 30000, spent: 47200 },
  { categorySlug: 'transport', label: 'Transport', budgeted: 15000, spent: 10400 },
  { categorySlug: 'entertainment', label: 'Entertainment', budgeted: 10000, spent: 7800 },
  { categorySlug: 'utilities', label: 'Utilities', budgeted: 20000, spent: 18900 },
  { categorySlug: 'personal', label: 'Personal Care', budgeted: 8000, spent: 3200 },
];
