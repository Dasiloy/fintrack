/**
 * Homepage — local data.
 *
 * Centralises the content for every landing-page section so that
 * marketing copy can be updated in one place without touching component
 * layout/styling code.
 *
 * Scope: this file is intentionally local to the (static) homepage.
 * Move any entry to packages/types/constants only if another app
 * or package needs the same content.
 */
import { Zap, Globe, TrendingUp } from 'lucide-react';
import {
  BarChart3,
  PieChart,
  GitFork,
  Target,
  PiggyBank,
  FileText,
  Sparkles,
  Lock,
  ShieldCheck,
  EyeOff,
  KeyRound,
  BadgeCheck,
  Fingerprint,
  Ban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Metric {
  icon: LucideIcon;
  stat: string;
  label: string;
  description: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface TrustPillar {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Hex color for the icon — passed via style prop to avoid purge issues. */
  color: string;
}

export interface TrustBadge {
  icon: LucideIcon;
  label: string;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export const METRICS: Metric[] = [
  {
    icon: Zap,
    stat: '99.9%',
    label: 'Uptime Reliability',
    description:
      'Access your financial data anytime, anywhere. Our infrastructure ensures your money is always within reach.',
  },
  {
    icon: Globe,
    stat: '$2B+',
    label: 'Assets Tracked',
    description:
      'Trusted by thousands to monitor investments, savings, and daily expenses across the globe securely.',
  },
  {
    icon: TrendingUp,
    stat: '$400',
    label: 'Monthly Savings',
    description:
      'On average, our users save an extra $400 per month by identifying subscriptions and optimizing budgets.',
  },
];

// ─── Feature grid ─────────────────────────────────────────────────────────────

export const FEATURES: Feature[] = [
  {
    icon: BarChart3,
    title: 'Smart Track',
    description: 'Automatically categorize transactions from all your accounts in real-time.',
  },
  {
    icon: PieChart,
    title: 'Flexible Budget',
    description: 'Create budgets that adapt to your spending habits and monthly needs.',
  },
  {
    icon: GitFork,
    title: 'Bill Splitting',
    description: 'Easily split bills and expenses with friends directly within the app.',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description: 'Set financial milestones and track your progress visually over time.',
  },
  {
    icon: PiggyBank,
    title: 'Auto Savings',
    description: 'Round up purchases and save the spare change automatically.',
  },
  {
    icon: FileText,
    title: 'Custom Reports',
    description: 'Generate detailed PDF reports for tax season or personal analysis.',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description: 'Receive personalized financial advice based on your spending patterns.',
  },
  {
    icon: Lock,
    title: 'Bank Security',
    description: 'Your data is protected with 256-bit encryption and biometric security.',
  },
];

// ─── Social proof ─────────────────────────────────────────────────────────────

export const LOGOS = [
  { name: 'Acme', shapeClass: 'rounded-full' },
  { name: 'Nexus', shapeClass: 'rotate-45' },
  { name: 'Stark', shapeClass: 'rounded-sm border-2 border-current' },
  { name: 'Bolt', shapeClass: 'rounded-tr-xl rounded-bl-xl' },
] as const;

// ─── Feature highlight ────────────────────────────────────────────────────────

export const FEATURE_CHECKLIST = [
  'Bank-level security encryption',
  'Custom alerts and notifications',
  'Exportable reports for tax season',
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
