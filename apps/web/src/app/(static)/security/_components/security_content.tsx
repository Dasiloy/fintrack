import Link from 'next/link';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

// ---------------------------------------------------------------------------
// Data — flow steps
// ---------------------------------------------------------------------------

const FLOW_STEPS = [
  {
    Icon: Smartphone,
    title: 'You open FinTrack',
    description: 'Tap "Link Account" to start the secure connection flow.',
  },
  {
    Icon: Building2,
    title: 'Bank login via Mono',
    description:
      'A Mono-powered widget opens. You enter your bank credentials directly into Mono — FinTrack never sees them.',
  },
  {
    Icon: Server,
    title: 'Secure token exchange',
    description:
      'Mono gives FinTrack a read-only access token (not your password). FinTrack uses it to pull your account data.',
  },
  {
    Icon: ShieldCheck,
    title: 'Encrypted storage',
    description:
      'Account balance and transactions are stored with AES-256-GCM encryption. Keys are held in a separate secure environment.',
  },
] as const;

// ---------------------------------------------------------------------------
// Data — access items
// ---------------------------------------------------------------------------

const CAN_ACCESS = [
  'Account name and number',
  'Current account balance',
  'Transaction history (date, amount, description)',
  'Bank institution name',
];

const CANNOT_DO = [
  'Log in to your bank directly',
  'Move, transfer, or withdraw money',
  'Make payments on your behalf',
  'See your banking password or PIN',
];

// ---------------------------------------------------------------------------
// Data — storage cards
// ---------------------------------------------------------------------------

const STORAGE_CARDS = [
  {
    Icon: Lock,
    title: 'Encrypted at rest',
    description:
      'Sensitive fields (account number, balance, institution) are encrypted with AES-256-GCM before being stored in the database.',
  },
  {
    Icon: KeyRound,
    title: 'Keys stored separately',
    description:
      'Encryption keys are never stored alongside your data. They live in a secured environment only our infrastructure can access.',
  },
  {
    Icon: RefreshCw,
    title: 'Secure in transit',
    description:
      'All data between your device and our servers is encrypted with TLS (HTTPS). No plain-text transmission.',
  },
] as const;

// ---------------------------------------------------------------------------
// Data — FAQ
// ---------------------------------------------------------------------------

const FAQ = [
  {
    q: 'Does FinTrack store my banking password?',
    a: "No. Your password is entered into Mono's secure login widget. FinTrack only ever receives a read-only token — we never see or store your credentials.",
  },
  {
    q: 'Can FinTrack make transactions from my account?',
    a: 'No. The connection is strictly read-only. FinTrack can view your account information but has no ability to move money or initiate any action.',
  },
  {
    q: 'What happens to my data when I disconnect an account?',
    a: 'Syncing stops immediately. Your existing transaction history is retained for 90 days to preserve your financial records, then permanently deleted.',
  },
  {
    q: 'Can anyone access my bank data?',
    a: 'Direct access to your financial data is restricted at the infrastructure level. All data access is controlled and logged.',
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SecurityContent() {
  return (
    <div className="mx-auto max-w-[860px] px-4 md:px-6">
      {/* ── Hero ── */}
      <div className="mb-16 flex flex-col items-center text-center">
        <h1 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          How FinTrack Protects Your Bank Data
        </h1>
        <p className="text-body-lg text-text-secondary mb-6 max-w-[640px] leading-relaxed">
          Before you connect a bank account, here is exactly what FinTrack can and cannot access,
          and how your data is kept secure.
        </p>

        {/* Trust chip pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['Read-only access', 'No credentials stored', 'AES-256-GCM encrypted'].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[12px] font-medium text-emerald-400"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* ── Data flow diagram ── */}
      <div className="glass-card rounded-card border-border-light relative mb-12 overflow-hidden border p-6 md:p-8">
        {/* Ambient emerald glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-32 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[60px]"
        />

        <p className="text-overline text-text-tertiary mb-6 text-center">
          How the connection works
        </p>

        <div className="flex flex-col md:flex-row md:items-stretch">
          {FLOW_STEPS.map(({ Icon, title, description }, index) => (
            <div key={title} className="contents">
              {/* Step card */}
              <div className="border-border-light bg-bg-elevated rounded-card flex min-w-0 flex-1 flex-col items-center gap-2 border p-4 text-center">
                <div className="mb-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Icon className="size-5 text-emerald-400" />
                </div>
                <p className="text-text-primary text-[13px] font-semibold">{title}</p>
                <p className="text-text-tertiary text-[12px] leading-relaxed">{description}</p>
              </div>

              {/* Connector — between steps only, not after last */}
              {index < FLOW_STEPS.length - 1 && (
                <>
                  <div className="hidden shrink-0 items-center justify-center px-2 md:flex">
                    <ChevronRight className="text-text-disabled size-4" />
                  </div>
                  <div className="flex items-center justify-center py-2 md:hidden">
                    <ChevronDown className="text-text-disabled size-4" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── What we access vs cannot do ── */}
      <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* What we access */}
        <div className="glass-card rounded-card border-border-light border p-6">
          <p className="text-text-primary mb-4 font-semibold">What we access</p>
          <ul className="space-y-3" role="list">
            {CAN_ACCESS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <span className="text-body text-text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What we can never do */}
        <div className="glass-card rounded-card border-border-light border p-6">
          <p className="text-text-primary mb-4 font-semibold">What we can never do</p>
          <ul className="space-y-3" role="list">
            {CANNOT_DO.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <X className="mt-0.5 size-4 shrink-0 text-red-400" />
                <span className="text-body text-text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── How your data is stored ── */}
      <section id="storage" className="mb-12 scroll-mt-28">
        <h2 className="font-manrope text-text-primary mb-6 text-xl font-bold">
          How your data is stored
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STORAGE_CARDS.map(({ Icon, title, description }) => (
            <div key={title} className="glass-card rounded-card border-border-light border p-5">
              <div className="bg-primary/10 mb-3 flex size-9 items-center justify-center rounded-lg">
                <Icon className="text-primary size-4" />
              </div>
              <p className="text-text-primary mb-1.5 text-[13px] font-semibold">{title}</p>
              <p className="text-text-tertiary text-[12px] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Your control ── */}
      <section id="control" className="mb-12 scroll-mt-28">
        <h2 className="font-manrope text-text-primary mb-4 text-xl font-bold">
          You're always in control
        </h2>
        <p className="text-body text-text-secondary mb-4 leading-relaxed">
          You can disconnect any linked account at any time from Accounts page. Once disconnected,
          FinTrack immediately stops syncing that account.
        </p>
        <div className="glass-card rounded-card border-border-light border p-4">
          <p className="text-body-sm text-text-secondary leading-relaxed">
            Your historical transaction data is retained for up to 90 days after disconnection, then
            permanently deleted per our{' '}
            <Link
              href={STATIC_ROUTES.PRIVACY}
              className="text-primary hover:text-primary-light underline underline-offset-2 transition-colors"
            >
              data retention policy
            </Link>
            . You can find the disconnect option from the Accounts page in the app.
          </p>
        </div>
      </section>

      {/* ── Third-party providers ── */}
      <section id="third-party" className="mb-12 scroll-mt-28">
        <h2 className="font-manrope text-text-primary mb-4 text-xl font-bold">
          Third-party providers
        </h2>
        <ul className="space-y-3" role="list">
          {[
            'Mono (licensed CBN open-banking provider): connects FinTrack to your Nigerian bank. Mono operates under CBN data regulations and their own privacy policy.',
            'Cloud infrastructure: our backend servers process your data under strict data processing agreements. Data stays within our controlled environment.',
            'We never share your financial data with advertisers, data brokers, or any party not essential to delivering the Service.',
          ].map((item, i) => (
            <li
              key={i}
              className="text-body text-text-secondary flex items-start gap-3 leading-relaxed"
            >
              <span
                aria-hidden="true"
                className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mb-12 scroll-mt-28">
        <h2 className="font-manrope text-text-primary mb-6 text-xl font-bold">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="glass-card rounded-card border-border-light group border"
              open
            >
              <summary className="text-text-primary flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-[14px] font-semibold">
                {q}
                <ChevronDown className="text-text-tertiary size-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-body text-text-secondary border-border-light border-t px-5 pt-4 pb-5 leading-relaxed">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Closing footer note ── */}
      <div className="glass-card rounded-card border-border-light mb-8 border p-6">
        <p className="text-body-sm text-text-secondary leading-relaxed">
          Questions about your data? Email us at the address in our{' '}
          <Link
            href={STATIC_ROUTES.PRIVACY}
            className="text-primary hover:text-primary-light underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </Link>
          . We aim to respond within 5 business days.
        </p>
      </div>
    </div>
  );
}
