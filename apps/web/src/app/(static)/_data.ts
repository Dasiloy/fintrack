/**
 * Homepage — local data.
 *
 * All landing-page content lives here so copy can be updated without
 * touching any component layout or styling code.
 */
import {
  BarChart3,
  PieChart,
  GitFork,
  Target,
  Repeat2,
  FileText,
  Sparkles,
  Brain,
  Building2,
  Activity,
  CalendarDays,
  ShieldCheck,
  EyeOff,
  KeyRound,
  BadgeCheck,
  Fingerprint,
  Ban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface BentoFeature {
  label: string;
  labelColor: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  wide?: boolean;
}

export interface TrustPillar {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export interface TrustBadge {
  icon: LucideIcon;
  label: string;
}

// ─── Bento features ───────────────────────────────────────────────────────────

export const BENTO_FEATURES: BentoFeature[] = [
  {
    label: 'INTELLIGENCE',
    labelColor: 'text-violet-400',
    title: 'Financial Health Score',
    description:
      'A 0-100 score that reflects how your income, spending, savings rate, and goal progress are tracking together. Updated every time you add data.',
    icon: Activity,
    iconClass: 'text-violet-400',
    wide: true,
  },
  {
    label: 'BANKING',
    labelColor: 'text-sky-400',
    title: 'Mono Bank Sync',
    description:
      'Connect any Nigerian bank in seconds. Read-only access to balances and transaction history via Mono.',
    icon: Building2,
    iconClass: 'text-sky-400',
    wide: false,
  },
  {
    label: 'AI',
    labelColor: 'text-primary',
    title: 'AI Insights',
    description:
      'Plain-English summaries of where your money went, what changed, and what to keep an eye on this month.',
    icon: Sparkles,
    iconClass: 'text-primary',
    wide: false,
  },
  {
    label: 'SCHEDULE',
    labelColor: 'text-amber-400',
    title: 'Smart Recurring',
    description:
      'Log DSTV, rent, MTN data, and other regular bills once. Transactions are created automatically on each due date.',
    icon: Repeat2,
    iconClass: 'text-amber-400',
    wide: false,
  },
  {
    label: 'ANALYTICS',
    labelColor: 'text-emerald-400',
    title: 'Spending Heatmap',
    description:
      'A calendar view of your highest-spend days so you can see at a glance when money moves most.',
    icon: CalendarDays,
    iconClass: 'text-emerald-400',
    wide: false,
  },
];

// ─── Feature grid ─────────────────────────────────────────────────────────────

export const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: 'Transaction Tracking',
    description: 'Add transactions manually or scan a receipt. Every naira is categorized and logged.',
  },
  {
    icon: PieChart,
    title: 'Smart Budgets',
    description: 'Set monthly spending limits per category and see live progress as you spend.',
  },
  {
    icon: GitFork,
    title: 'Expense Splits',
    description: 'Split shared bills with friends or housemates and track who has paid.',
  },
  {
    icon: Target,
    title: 'Financial Goals',
    description: 'Set a savings target with a deadline. Track contributions and stay on pace.',
  },
  {
    icon: Repeat2,
    title: 'Recurring Bills',
    description: 'Log bills once and let FinTrack create transactions automatically on each due date.',
  },
  {
    icon: FileText,
    title: 'PDF and CSV Export',
    description: 'Export transaction history and monthly reports in PDF or CSV format. Pro feature.',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description: 'Get a plain-English summary of your spending trends and financial health each month.',
  },
  {
    icon: Brain,
    title: 'AI Chat',
    description: 'Ask questions about your money in natural language and get instant answers from your data.',
  },
];

// ─── Feature highlight checklist ──────────────────────────────────────────────

export const FEATURE_CHECKLIST = [
  'Read-only bank access via Mono — your credentials never touch FinTrack',
  'Automatic spending categorization across all linked accounts',
  'Financial Health Score updated in real time as your data changes',
] as const;

// ─── Security & Trust ─────────────────────────────────────────────────────────

export const TRUST_PILLARS: TrustPillar[] = [
  {
    icon: ShieldCheck,
    title: 'AES-256-GCM Encryption',
    description:
      'Sensitive financial fields — account numbers, balances, and institution details — are encrypted at rest. Keys are stored in a separate secure environment, never in the database.',
    color: '#34d399',
  },
  {
    icon: EyeOff,
    title: 'Read-only Bank Access',
    description:
      'Your Mono connection is strictly read-only. FinTrack can view balances and transactions but can never move, transfer, or initiate any action on your accounts.',
    color: '#38bdf8',
  },
  {
    icon: KeyRound,
    title: 'Zero Credential Storage',
    description:
      'Your banking username and password never touch our servers. All credential handling is performed exclusively by Mono, a licensed open-banking provider.',
    color: '#fbbf24',
  },
  {
    icon: BadgeCheck,
    title: 'NDPA 2023 Compliant',
    description:
      "Built to Nigeria's Data Protection Act 2023. Your rights — access, correction, deletion, and portability — are honoured. We respond within 30 days.",
    color: '#a78bfa',
  },
  {
    icon: Fingerprint,
    title: 'Two-factor Authentication',
    description:
      'Protect your account with TOTP authenticator-based two-factor authentication — a strongly recommended extra layer of login security.',
    color: '#7c7aff',
  },
  {
    icon: Ban,
    title: 'We Never Sell Your Data',
    description:
      'Your personal and financial data belongs to you. We do not sell, rent, or share it with third parties for advertising or any purpose beyond delivering the Service.',
    color: '#fb7185',
  },
];

export const TRUST_BADGES: TrustBadge[] = [
  { icon: ShieldCheck, label: 'AES-256-GCM encrypted' },
  { icon: EyeOff, label: 'Read-only bank access' },
  { icon: BadgeCheck, label: 'NDPA 2023 compliant' },
  { icon: Fingerprint, label: '2FA supported' },
  { icon: Ban, label: 'Zero data selling' },
];
