# FinTrack — Backlog & Bug Tracker

Items are grouped by type. Each entry follows the format:

```markdown
### [ID] Title

- **Type**: Feature | Bug | Improvement | Security | Tech Debt
- **Priority**: Critical | High | Medium | Low
- **Status**: Pending | In Progress | Blocked | Done
- **Context**: Brief explanation of the problem or goal
- **Notes**: Implementation hints, related files, or blockers
```

---

## 🗂️ Backlog

### [BL-016] Annual financial summary — year in review (Pro)

- **Type**: Feature
- **Priority**: Medium
- **Status**: Pending
- **Context**: Once a year (January), Pro users should receive a generated PDF summary of their full financial year — total income, total spend, top categories, goal completions, savings rate, and a short AI-generated narrative. This is both a retention feature (makes users feel the product delivered value over 12 months) and a natural upgrade driver (free users see a teaser and cannot download).
- **Notes**:
  - Trigger: scheduler cron on January 1st or on-demand from the settings page.
  - Content: aggregate from analytics snapshots (already stored) — no new DB queries needed beyond what analytics already produces.
  - Narrative: short LLM-generated summary using the year's data. Route through InsightService (existing graph infrastructure).
  - Output: PDF via existing PDF report feature (Pro-gated).
  - Free users: show a locked preview card on the dashboard in January with "Your 2025 year in review is ready — upgrade to download."
  - Related files: `apps/scheduler_service/`, `apps/ai_service/src/insights/`, `apps/api_gateway/src/advisor/`, `apps/web/src/app/(dashboard)/`.

### [BL-015] Financial health score — weekly Pro-only metric

- **Type**: Feature
- **Priority**: Medium
- **Status**: Pending
- **Context**: A single weekly score (0–100) that reflects the user's financial health: budget adherence, goal pacing, savings rate, and debt/split settlement speed. The score moves up when the user is on track and down when they overspend or miss goal contributions. It is Pro-only, shown on the dashboard and in the weekly insight. Free users see a blurred score with "Upgrade to unlock your Financial Health Score."
- **Notes**:
  - Score components (suggested weights): budget adherence 35%, savings rate 25%, goal pacing 25%, outstanding splits 15%.
  - Computed by the scheduler weekly (not real-time) and stored as a new DB field or analytics snapshot type.
  - Historical score trend (last 12 weeks) should be visualisable — provides a clear "am I improving?" signal that is highly sticky.
  - Push notification when score drops significantly (≥10 points week-over-week) — creates re-engagement.
  - Related files: `apps/scheduler_service/src/processors/analytics_aggregation.processor.ts`, `packages/database/prisma/schema.prisma`, `apps/web/src/app/(dashboard)/`.

### [BL-014] Multi-account bank sync gating — Free: 1 account, Pro: unlimited

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: Bank account connectivity via Mono is the most compelling feature in the product — it is what makes FinTrack feel like more than a spreadsheet. Currently it is fully unrestricted on the free plan. Gating multi-account sync behind Pro is the single structural change most likely to drive upgrades, because users with a salary account, a savings account, and a business account cannot get full value without connecting all three.
- **Notes**:
  - Free plan: 1 Mono-connected account. Additional connections blocked at the API level with a `ProGateModal` in the UI.
  - Pro plan: unlimited connected accounts.
  - Backend: `account.service.ts` (api_gateway) must check `usageService.getGatedUsage()` before allowing a new Mono Connect flow. The `Subscription` model already has the plan.
  - Add `MONO_ACCOUNTS_LIMIT` to `PLAN_LIMITS` in `plan.constants.ts`: `FREE: 1, PRO: Infinity`.
  - The Mono Connect widget is triggered from `apps/web/src/hooks/use_mono.ts` — intercept there and gate.
  - Existing connected accounts on free users (if > 1 from before this change) should be grandfathered: show a banner "You have 2 accounts connected. Free plan now supports 1. Upgrade to keep both syncing."
  - Related files: `packages/types/src/constants/plan.constants.ts`, `apps/api_gateway/src/account/account.service.ts`, `apps/web/src/hooks/use_mono.ts`, `apps/web/src/app/(dashboard)/finances/accounts/`.

### [BL-013] Recurring billing reminders — frequency-aware advance notice

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: Users have no advance warning when a recurring bill is about to charge. A single reminder notification should fire once before each upcoming occurrence, with the lead time scaled to the billing frequency — a daily charge doesn't need a week's notice, but a yearly subscription should warn well in advance.
- **Notes**:
  - Send exactly **one** reminder per billing cycle. Once the reminder for a given occurrence is sent, do not re-send until the next cycle.
  - Lead time by frequency:
    - `DAILY` → 1 hour before
    - `WEEKLY` → 1 day before
    - `BIWEEKLY` → 2 days before
    - `MONTHLY` → 3 days before
    - `QUARTERLY` → 7 days before
    - `YEARLY` → 14 days before
  - The scheduler service already drives recurring items. Add a pre-reminder job that runs at `nextDueDate - leadTime`. Track whether the reminder has been sent for the current cycle to avoid duplicates — a `lastReminderSentAt` column on `RecurringItem` or a Redis key keyed by `recurringItemId:cycleDate` both work.
  - Add an opt-in `reminderEnabled` boolean to `RecurringItem` (default `true`) so users can silence individual items without deleting them.
  - Notification channel: in-app notification + push (if enabled). No email — per-bill email reminders are noisy.
  - Only send for `ACTIVE` items where `reminderEnabled = true`.
  - Related files: `apps/scheduler_service/src/`, `packages/database/prisma/schema.prisma` (`RecurringItem` model), notification service, `apps/web/src/app/(dashboard)/finances/bills/`.

### [BL-012] Category deletion — reassign or transfer related entities

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: When a user deletes a user-owned category, any entities that reference it (transactions, budgets, recurring items) currently are automaticvally movee to miscellanoue for transactions while others are lost. Instead, the user should be prompted to choose where those entities move before the category is removed — similar to how WordPress handles post-category deletion.
- **Notes**:
  - On delete, if the category has linked entities, show a reassignment dialog: "X transactions, Y budgets, and Z recurring items are using this category. Reassign them to:" with a category picker defaulting to a sensible system category (e.g. "Uncategorized" or "General").
  - If the category has zero linked entities, skip the dialog and delete immediately.
  - Backend: the delete endpoint should accept an optional `transferToCategoryId` (or `transferToCategorySlug`) parameter. If provided, run a single DB transaction that updates all `transactions.categoryId`, `budgets.categoryId`, and `recurringItems.categoryId` to the target before removing the source category.
  - If `transferToCategoryId` is omitted and linked entities exist, return a `409 CONFLICT` with counts so the client can prompt the user.
  - The "Uncategorized" / fallback system category should be seeded and guaranteed to exist (`isSystem: true`) so it is always a valid transfer target.
  - Related files: `apps/api_gateway/src/category/`, `apps/finance_service/src/category/` (if it exists), `packages/database/prisma/schema.prisma` (Category model — check `onDelete` behaviour on relations), `apps/web/src/app/(dashboard)/finances/budgets/_components/unbudgeted_card.tsx` (delete confirmation dialog).

### [BL-011] Introduce Import Transactions data from csv files

- **Type**: Ferature
- **Priority**: High
- **Status**: Pending
- **Context**: Users need to be able to download and export high quality csv and pdf files containing account information, Should be ideally just past 7 days, and contains account statement. Intense export will be in dashboard screen
  **Notes**:
- Exports need to beautiful high ressolution pdfs and csv files
- multi sheet csv and excels should be possible

### [BL-010] Mono integration — go live (NGN only)

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: Mono bank-linking is currently behind a dev/staging gate. Going live requires verifying the Mono production credentials are wired in, restricting supported currencies to NGN only, and confirming the full link → sync → transaction ingestion flow works end-to-end on production.
- **Notes**:
  - NGN is the only currency to support at launch — block or hide the link flow for any account that returns a non-NGN currency from Mono.
  - Confirm `MONO_SECRET_KEY` and `MONO_APP_ID` production env vars are set on Railway for `finance_service` and `api_gateway`.
  - End-to-end smoke test: link account → sync → verify transactions appear in the dashboard with correct NGN amounts.
  - Currency restriction should live at the Mono webhook/sync layer so non-NGN accounts are rejected early with a clear user-facing error rather than silently ingested with wrong amounts.
  - Unblock currency selector in Settings > Profile once multi-currency support is ready (see disabled state added in this sprint).
  - Related files: `apps/finance_service/src/mono/`, `apps/api_gateway/src/mono/`, `apps/web/src/app/(dashboard)/settings/profile/_components/profile_layout.tsx`.

### [BL-08] Field-level encryption for Mono bank account data

- **Type**: Security
- **Priority**: High
- **Status**: Pending
- **Context**: All sensitive Mono-linked bank account fields (account number, BVN, NUBAN, balance, institution details, etc.) are currently stored in plain text in the database. These must be encrypted at rest to reduce exposure in the event of a database breach.
- **Notes**:
  - Use AES-256-GCM (symmetric, authenticated) with a secret key stored in an env var (`ENCRYPTION_KEY`). Never store the key in the DB or repo.
  - Apply encryption/decryption transparently at the service layer (finance_service or api_gateway) so the rest of the app works unchanged.
  - Fields to encrypt: account number, NUBAN, BVN, institution name/code, account name (PII), current balance, available balance, currency (optional — low sensitivity).
  - Consider a Prisma middleware or a dedicated `CryptoService` that encrypt on `create`/`update` and decrypt on `findMany`/`findUnique` so encryption is not scattered across handlers.
  - A one-time migration script is needed to encrypt existing plain-text rows; run it with a dry-run flag first.
  - Related files: `apps/finance_service/src/mono/`, `apps/api_gateway/src/mono/`, DB schema for `LinkedAccount` / `MonoAccount` model.

### [BL-007] Marketing page — bank account data handling explainer

- **Type**: Feature
- **Priority**: Medium
- **Status**: Pending
- **Context**: Users need to understand exactly how their linked bank account data (via Mono) is accessed, stored, and protected before they trust the app with their financial credentials. A dedicated page or section should explain this clearly and honestly.
- **Notes**:
  - Suggested page: `/security` or `/how-we-protect-your-data` linked from the footer and from the Mono link flow.
  - Content to cover: what data is read from Mono (read-only access, no transaction initiation), how long it is retained, whether it is shared with third parties, how it is encrypted (BL-010), and how users can revoke access.
  - Tone: plain English, no legal jargon. Model after Plaid's "How Plaid Works" page or Mono's own transparency docs.
  - Should include a visual diagram of the data flow: User → Mono widget → Mono API → FinTrack backend → encrypted DB.
  - Related files: `apps/web/src/app/(marketing)/`, footer links, Mono link flow modal.

### [BL-006] Marketing page — legal and security trust section

- **Type**: Improvement
- **Priority**: High
- **Status**: Pending
- **Context**: The marketing/landing page currently has no meaningful legal or security trust signals. Before any public launch, users need visible proof that FinTrack takes security and data privacy seriously. This covers both the copy/UI and ensuring real legal documents exist.
- **Notes**:
  - Add a "Security & Trust" section to the landing page: highlight encryption at rest (BL-010), read-only Mono access, no credential storage, and 2FA support (BL-005).
  - Ensure real, accurate Privacy Policy and Terms of Service documents are linked from the footer. Replace any placeholder links. Minimum viable legal docs can be generated with a lawyer-reviewed template tailored to NDPR and CBN requirements (feeds from BL-009 research).
  - Add trust badges where appropriate: NDPR compliance notice, "Secured with 256-bit encryption", "Read-only bank access via Mono".
  - Related files: `apps/web/src/app/(marketing)/`, footer component, `/legal/privacy` and `/legal/terms` routes (create if missing). See also BL-006 (static content audit).

### [BL-005] Static content audit — realistic MVP copy and authorship

- **Type**: Tech Debt
- **Priority**: High
- **Status**: Pending
- **Context**: Various pages and components across the web app contain placeholder copy, fake client logos, fake sponsor names, dummy team members, and demo data that should never appear in a real MVP. Everything visible to a logged-in or logged-out user must reflect the actual product and its sole author before any public release.
- **Notes**:
  - **Landing / marketing pages**: Remove any fake client logos, sponsor badges, or partner sections. Replace with honest feature-focused copy or leave those sections out entirely.
  - **Team / about sections**: Update to show only the actual author — Damilare Oyewole. Remove any placeholder team members or avatars. Point to damilare limnkedin account and also to his giyhub account
  - **Testimonials / social proof**: Remove fake testimonials. If the section exists on a public page, either remove it or replace it with a factual product statement until real feedback is available.
  - **Dashboard demo data**: Ensure the dashboard shows a proper empty state for new users — no seeded transactions, budgets, goals, or analytics. The onboarding tour (BL-004) covers guiding users through the empty state.
  - **Footer / legal**: Confirm copyright year and author name are correct. Update any placeholder privacy policy or terms links to point to real documents or remove them.
  - **App name and branding**: Confirm every instance of the product name, logo alt text, and meta tags (title, description, og:image) are accurate.
  - Audit scope: `apps/web/src/app/(marketing|landing|home|about|legal)/`, root layout metadata, any `_components` with hardcoded copy. A simple `grep -r "Lorem\|placeholder\|example\.com\|Fake\|Demo User\|Sponsor"` pass will surface most issues.

  ### [BL-004] Research legal and compliance requirements for finance apps

- **Type**: Tech Debt
- **Priority**: High
- **Status**: Pending
- **Context**: As a fintech handling real bank account data (via Mono), FinTrack must comply with applicable Nigerian and international data regulations before public launch. A structured research doc should inform the legal copy, privacy policy, and technical controls.
- **Notes**:
  - Key frameworks to cover: **NDPR** (Nigeria Data Protection Regulation), **CBN Consumer Protection Framework**, **PCI-DSS** (if card data is ever in scope), **ISO 27001** (optional but worth referencing), and Mono's own developer data terms.
  - Output should be a compliance checklist mapped to: (a) what FinTrack already does, (b) what is missing, and (c) the implementation priority for each gap.
  - This research should feed directly into BL-007 (legal pages), BL-008 (bank data handling copy), and BL-010 (encryption).
  - Assign to: legal review + engineering lead before any production launch.

### [BL-003] Post-registration 2FA setup prompt

- **Type**: Security
- **Priority**: High
- **Status**: Done
- **Context**: After a user registers or signs in for the first time, they should see a one-time modal prompting them to enable two-factor authentication (TOTP or SMS). The prompt appears once — if the user dismisses it or enables 2FA, it never appears again. This is the same pattern used by GitHub, Vercel, and Linear on first sign-in.
- **Notes**:
  - Gate the prompt on a `hasSeenTwoFaPrompt: boolean` field stored in the user's settings record (or a dedicated column). Write it via `user.updateSettings` on dismiss or on 2FA activation.
  - The modal should be a non-blocking overlay — not a full-page gate. It should have two clear actions: **"Set up 2FA"** (navigates to `/settings/security` or opens an inline TOTP flow) and **"Remind me later"** (dismisses for the session but re-prompts on the next login until the user explicitly clicks "Don't show again").
  - A third **"Don't show again"** link (small, muted) should permanently set the flag without enabling 2FA.
  - Mount the prompt component in the dashboard root layout, after the session is confirmed. Gate it with `!user.twoFaEnabled && !user.hasSeenTwoFaPrompt`.
  - Related files: `apps/web/src/app/(dashboard)/layout.tsx`, `packages/trpc_app/src/routers/user.ts`, `packages/types/proto/auth/user.proto`, `apps/auth_service/src/`.

### [BL-002] Tooltip-based onboarding flow for new web users

- **Type**: Feature
- **Priority**: High
- **Status**: Done
- **Context**: New users landing on the dashboard for the first time have no guidance on what each section does or how to get started. A modern spotlight/tooltip-driven onboarding tour — similar to what Notion, Linear, and Intercom use — should walk first-time users through the key areas of the app: the dashboard overview, adding a first transaction, setting up a budget, and creating a goal. The tour activates automatically on the user's first login and can be re-triggered from Settings. Each step anchors a highlighted popover to the relevant UI element with a short description, a step counter, and Prev / Next / Skip controls.
- **Notes**:
  - Use a library the Onborda library thats nextjs compatible and app router aware
  - Tour steps to cover (in order):
    1. **Dashboard hero** — net balance chip and month selector
    2. **Stat cards** — income, expense, savings, transactions count
    3. **Monthly Cashflow chart** — brief explanation of income vs expense bars
    4. **Add Transaction button** — CTA to log their first transaction
    5. **Budgets** — link to the budgets page, brief value prop
    6. **Goals** — link to goals page
    7. **Splits** — link to splits page (group expense tracking)
  - Track completion state in the user's settings record (`hasCompletedOnboarding: boolean`) — write it via `user.updateSettings` mutation when the user finishes or skips. Do not re-trigger the tour if the flag is set.
  - The tour component should live in `apps/web/src/app/(dashboard)/_components/onboarding_tour.tsx` and be mounted once inside `DashboardClient`. Gate it with `!summary?.hasCompletedOnboarding` (or a dedicated field) so it only renders for genuinely new users.
  - Style the spotlight overlay and tooltip to match `--ft-color-bg-elevated` background, `--ft-color-border-subtle` borders, and the existing button variants. The "Next" button should use the primary style; "Skip" should be ghost.
  - The tour should be skippable at any step and should not block any user action — it should dissolve immediately on outside click or Esc.
  - Related files: `apps/web/src/app/(dashboard)/_components/dashboard_client.tsx`, `apps/web/src/app/(dashboard)/_components/`, `packages/trpc_app/src/routers/user.ts`, `packages/types/proto/auth/user.proto`.

### [BL-001] Use Mailtrap sandbox API in dev and Mailtrap sending API in production

- **Type**: Improvement
- **Priority**: High
- **Status**: Done
- **Context**: Mailtrap provides two distinct API modes: a **sandbox** (emails are captured in a Mailtrap inbox and never delivered — free, no domain required, ideal for dev/staging) and a **sending API** (emails are actually delivered to real inboxes using a verified domain — charged per volume, for production). The Notification Service currently uses `MailtrapTransport` unconditionally without switching modes. In production, the sending API should be used with the verified domain so OTP codes, welcome emails, and security alerts reach real users.
- **Notes**:
  - Both modes use the same `MailtrapTransport` from `mailtrap` — the difference is which API token is provided and whether `testInboxId` is set (sandbox) or omitted (sending).
  - Switch on `NODE_ENV`: use the sandbox token + `testInboxId` when `NODE_ENV !== 'production'`; use the sending API token when `NODE_ENV === 'production'`.
  - Add `MAIL_ENV` (or rely on `NODE_ENV`) and separate env vars `MAIL_TOKEN_SANDBOX` / `MAIL_TOKEN_PROD` (or a single `MAIL_TOKEN` set per environment) to `apps/notification_service/.env.example`.
  - The `MAIL_FROM` address must match the verified sending domain configured in the Mailtrap account.
  - Related files: `apps/notification_service/src/notification.module.ts`, `apps/notification_service/.env.example`.

---

## 🚨 Urgent

### [URG-001] Migrate payment collection from Stripe to Paystack

- **Type**: Tech Debt / Feature
- **Priority**: Critical
- **Status**: Pending
- **Context**: Stripe does not natively support Nigerian Naira (NGN) billing and has poor card acceptance rates for Nigerian-issued cards, making it a bad fit for Fintrack's primary user base. Paystack is purpose-built for the Nigerian and African market, supports NGN natively, and has significantly higher acceptance rates for local cards and bank transfers. All subscription billing must be migrated from Stripe to Paystack.
- **Notes**:
  - **Remove**: `payment_service` Stripe SDK, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID` env vars.
  - **Add**: Paystack SDK (`paystack-node` or official Paystack client), `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `PAYSTACK_PRO_MONTHLY_PLAN_CODE` env vars.
  - **Subscription flow changes**:
    - Replace Stripe Checkout with Paystack's hosted payment page (`/transaction/initialize`).
    - Replace Stripe subscription objects with Paystack Plans + Subscriptions API.
    - Replace Stripe webhook events (`customer.subscription.updated`, `invoice.payment_succeeded`, etc.) with Paystack equivalents (`subscription.create`, `charge.success`, `subscription.disable`, `invoice.create`).
  - **Webhook verification**: replace Stripe signature verification with Paystack HMAC-SHA512 header check (`x-paystack-signature`).
  - **Frontend**: replace `loadStripe` / Stripe Elements with Paystack Inline JS or a redirect to Paystack's hosted page. Remove `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from the web app.
  - **DB**: `Subscription` model stores `stripePriceId`, `stripeCustomerId`, `stripeSubscriptionId`, `stripeCurrentPeriodEnd`, `stripeCancelAtPeriodEnd` — rename or add Paystack equivalents (`paystackCustomerCode`, `paystackSubscriptionCode`, `paystackPlanCode`, `paystackNextPaymentDate`, `paystackStatus`). Run a migration.
  - **Related files**:
    - `apps/payment_service/src/payment.service.ts`
    - `apps/payment_service/src/payment.module.ts`
    - `apps/api_gateway/src/payment/payment.service.ts`
    - `apps/api_gateway/src/payment/payment.controller.ts`
    - `apps/notification_service/src/processors/payment_notification.pro.ts`
    - `packages/database/prisma/schema.prisma` (Subscription model)
    - Root `.env.example` (Stripe vars block)

---

## 🐛 Bugs

### [BG-001] Component Export issues on Budget Page

- **Type**: Bug
- **Priority**: High
- **Status**: Done
- **Context**: Unbudgeted category card does not apply edit and delete props.The page goes into constanst errors of 500 with complaints of mixed exports
  **Notes**:
- Edit and Delete must be fully functional on those cards for user generated category
- No 500 error from mixed exports

## 📌 Notes

- Add new items at the top of their respective section.
- Prefix bug IDs with `BUG-`, backlog IDs with `BL-`.
- Move completed items to a `## ✅ Done` section at the bottom rather than deleting them.
