# FinTrack — Backlog & Bug Tracker

Items are ordered by priority. Each entry follows the format:

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

### ✅ [BL-001] Mono integration — go live (NGN only)

- **Type**: Feature
- **Priority**: High
- **Status**: Done
- **Context**: Mono bank-linking is currently behind a dev/staging gate. Going live requires verifying the Mono production credentials are wired in, restricting supported currencies to NGN only, and confirming the full link → sync → transaction ingestion flow works end-to-end on production.
- **Notes**:
  - NGN is the only currency to support at launch — block or hide the link flow for any account that returns a non-NGN currency from Mono.
  - Confirm `MONO_SECRET_KEY` and `MONO_APP_ID` production env vars are set on Railway for `api_gateway`.
  - End-to-end smoke test: link account → sync → verify transactions appear in the dashboard with correct NGN amounts.
  - Currency restriction should live at the Mono webhook/sync layer so non-NGN accounts are rejected early with a clear user-facing error rather than silently ingested with wrong amounts.
  - Related files: `apps/finance_service/src/mono/`, `apps/api_gateway/src/mono/`, `apps/web/src/app/(dashboard)/settings/profile/_components/profile_layout.tsx`.

### ✅ [BL-002] Field-level encryption for Mono bank account data

- **Type**: Security
- **Priority**: High
- **Status**: Done
- **Context**: All sensitive Mono-linked bank account fields (account number, BVN, NUBAN, balance, institution details, etc.) are currently stored in plain text in the database. These must be encrypted at rest to reduce exposure in the event of a database breach.
- **Notes**:
  - Use AES-256-GCM (symmetric, authenticated) with a secret key stored in an env var (`ENCRYPTION_KEY`). Never store the key in the DB or repo.
  - Apply encryption/decryption transparently at the service layer (finance_service or api_gateway) so the rest of the app works unchanged.
  - Fields to encrypt: account number, NUBAN, BVN, institution name/code, account name (PII), current balance, available balance, currency (optional — low sensitivity).
  - Consider a Prisma middleware or a dedicated `CryptoService` that encrypts on `create`/`update` and decrypts on `findMany`/`findUnique` so encryption is not scattered across handlers.
  - A one-time migration script is needed to encrypt existing plain-text rows; run it with a dry-run flag first.
  - Related files: `apps/finance_service/src/mono/`, `apps/api_gateway/src/mono/`, DB schema for `LinkedAccount` / `MonoAccount` model.

### ✅ [BL-003] Multi-account bank sync gating — Free: 1 account, Pro: unlimited

- **Type**: Feature
- **Priority**: High
- **Status**: Done
- **Context**: Bank account connectivity via Mono is the most compelling feature in the product — it is what makes FinTrack feel like more than a spreadsheet. Currently it is fully unrestricted on the free plan. Gating multi-account sync behind Pro is the single structural change most likely to drive upgrades, because users with a salary account, a savings account, and a business account cannot get full value without connecting all three.
- **Notes**:
  - Free plan: 1 Mono-connected account. Additional connections blocked at the API level with a `ProGateModal` in the UI.
  - Pro plan: unlimited connected accounts.
  - Backend: `account.service.ts` (api_gateway) must check `usageService.getGatedUsage()` before allowing a new Mono Connect flow.
  - Add `MONO_ACCOUNTS_LIMIT` to `PLAN_LIMITS` in `plan.constants.ts`: `FREE: 1, PRO: Infinity`.
  - The Mono Connect widget is triggered from `apps/web/src/hooks/use_mono.ts` — intercept there and gate.
  - Existing connected accounts on free users (if > 1 from before this change) should be grandfathered: show a banner "You have 2 accounts connected. Free plan now supports 1. Upgrade to keep both syncing."
  - Must ship before or alongside **BL-007** (free trial) — the trial's account-freeze behaviour on expiry depends on this gate being in place.
  - Related files: `packages/types/src/constants/plan.constants.ts`, `apps/api_gateway/src/account/account.service.ts`, `apps/web/src/hooks/use_mono.ts`, `apps/web/src/app/(dashboard)/finances/accounts/`.

### [BL-004] Migrate payment collection from Stripe to Paystack

- **Type**: Tech Debt / Feature
- **Priority**: Critical
- **Status**: Pending
- **Context**: Stripe does not natively support Nigerian Naira (NGN) billing and has poor card acceptance rates for Nigerian-issued cards, making it a bad fit for Fintrack's primary user base. Paystack is purpose-built for the Nigerian and African market, supports NGN natively, and has significantly higher acceptance rates for local cards and bank transfers. All subscription billing must be migrated from Stripe to Paystack.
- **Notes**:
  - **Remove**: `payment_service` Stripe SDK, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID` env vars.
  - **Add**: Paystack SDK (`paystack-node` or official Paystack client), `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `PAYSTACK_PRO_MONTHLY_PLAN_CODE` env vars.
  - **Subscription flow**:
    - Replace Stripe Checkout with Paystack's hosted payment page (`/transaction/initialize`).
    - Replace Stripe subscription objects with Paystack Plans + Subscriptions API.
    - Replace Stripe webhook events (`customer.subscription.updated`, `invoice.payment_succeeded`, etc.) with Paystack equivalents (`subscription.create`, `charge.success`, `subscription.disable`, `invoice.create`).
  - **Webhook verification**: replace Stripe signature verification with Paystack HMAC-SHA512 header check (`x-paystack-signature`).
  - **Frontend**: replace `loadStripe` / Stripe Elements with Paystack Inline JS or redirect to Paystack's hosted page. Remove `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from the web app.
  - **DB migration**: `Subscription` model stores `stripePriceId`, `stripeCustomerId`, `stripeSubscriptionId`, `stripeCurrentPeriodEnd`, `stripeCancelAtPeriodEnd` — rename or add Paystack equivalents (`paystackCustomerCode`, `paystackSubscriptionCode`, `paystackPlanCode`, `paystackNextPaymentDate`, `paystackStatus`).
  - **Related files**:
    - `apps/payment_service/src/payment.service.ts`
    - `apps/payment_service/src/payment.module.ts`
    - `apps/api_gateway/src/payment/payment.service.ts`
    - `apps/api_gateway/src/payment/payment.controller.ts`
    - `apps/notification_service/src/processors/payment_notification.pro.ts`
    - `packages/database/prisma/schema.prisma` (Subscription model)
    - Root `.env.example` (Stripe vars block)

### [BL-005] In-app soft limit warning banner

- **Type**: Improvement
- **Priority**: High
- **Status**: Pending
- **Context**: Users who do not know they are close to their limit cannot be nudged to upgrade. Showing "3 of 5 AI insights used this month" at 60%+ creates a countdown effect that is more motivating than a hard wall.
- **Notes**:
  - Show when usage ≥ 60% of the monthly limit:

    ```text
    AI Insights · 3 of 5 used this month   [Upgrade to Pro →]
    ```

  - Below 60%: hidden. 60–99%: amber warning chip. 100%: red — "You've reached your limit. Upgrade to continue."
  - Files to create/modify:
    - `apps/web/src/app/_components/usage_warning_banner.tsx` — new component
    - `apps/web/src/app/(ai)/advisor/_components/insights_panel.tsx` — render banner above insights list
    - `apps/web/src/app/(dashboard)/dashboard_layout.tsx` — render for AI chat usage
  - Plan usage data is already fetched in `plan_usage_provider.tsx`. No new API calls needed.

### [BL-006] Post-limit upgrade flow improvement

- **Type**: Improvement
- **Priority**: High
- **Status**: Pending
- **Context**: When a free user hits a hard limit (e.g. tries to add a 6th budget), the `ProGateModal` shows immediately and routes to `/pricing`. What is missing is a soft warning _before_ they hit the wall — priming the upgrade decision before the frustration of a hard stop.
- **Notes**:
  - When a user is at 4 of 5 budgets (or 2 of 3 goals), show an inline callout on the relevant list page:

    ```text
    You have 1 budget slot remaining on the free plan.
    Upgrade to Pro for unlimited budgets. →
    ```

  - Files to modify:
    - `apps/web/src/app/(dashboard)/finances/budgets/` — read current count vs limit, show callout when within 1 of limit
    - `apps/web/src/app/(dashboard)/planning/goals/` — same pattern
  - Limit and current count are already available via `plan_usage_provider.tsx` and `useCanUseFeature`.

### [BL-007] 2-month free Pro trial for every new user

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: The single biggest reason users don't upgrade is that they have never experienced what Pro feels like. A 2-month trial removes the risk entirely — once they have lived with Pro for 8 weeks and built habits around it, going back to the free plan feels like a downgrade. That friction is what converts. PiggyVest, Cowrywise, and every successful Nigerian fintech acquired early users through generous free periods before monetising.
- **Notes**:
  - **Schema additions** (`packages/database/prisma/schema.prisma`, Subscription model):

    ```typescript
    trialEndsAt   DateTime?
    isOnTrial     Boolean   @default(false)
    trialUsed     Boolean   @default(false)  // prevents re-trial on re-registration
    ```

  - **Auth service** (`apps/auth_service/src/`): on registration, set `trialEndsAt = now + 60d`, `isOnTrial = true`.
  - **Usage service** (`apps/api_gateway/src/usage/usage.service.ts`): treat `isOnTrial = true` identically to `plan = 'PRO'` when checking all feature gates.
  - **Scheduler** (`apps/scheduler_service/src/`): daily cron — find `isOnTrial = true` where `trialEndsAt < now`, set `isOnTrial = false`.
  - **Trial countdown banner** (`apps/web/src/app/_components/`): visible from day 45 onward — "Your Pro trial ends in N days — keep unlimited access for ₦4,500/month."
  - **Expiry email sequence** (templates in `apps/notification_service/templates/`):
    - Day 45 (`trial_warning.hbs`): "Your Pro trial ends in 15 days — here is what you will keep and what will change."
    - Day 58 (`trial_warning.hbs`, parameterised by days remaining): "2 days left — bank sync for additional accounts will pause unless you upgrade."
    - Day 61 (`trial_expired.hbs`): "Your trial has ended. AI insights are now limited to 5/month. Bank sync for accounts beyond your first has paused."
  - **Expiry modal** (`apps/web/src/app/_components/trial_expired_modal.tsx`): shown once on first login after trial ends. Non-dismissible for 5 seconds before "Continue on free" becomes clickable. Gate with `trialExpiredAcknowledged` flag on the subscription.

    ```text
    Your Pro trial has ended.
    AI insights: limited to 5/month
    AI advisor: limited to 10 messages/month
    Bank sync: [N] additional accounts paused
    [Upgrade to Pro — ₦4,500/month]     [Continue on free plan (available in 5s)]
    ```

  - **Account freeze on expiry**: accounts 2+ stop syncing but remain visible as greyed-out cards with "Sync paused — Upgrade to resume". Do not delete connections or historical data — visibility without access is more motivating than removal. Requires **BL-003** (multi-account gating) to be shipped first.
  - **Daily insights toggle prerequisite**: add `dailyInsightsEnabled` boolean to `NotificationSetting` (model already in DB). On trial expiry, prompt free users: "Daily insights are on — 5 days of auto-generation exhausts your monthly quota. Turn off to save them for manual use." Toggle lives in `apps/web/src/app/(dashboard)/settings/account/_components/notification_prefrences.tsx`. Defaults to **on** during the Pro trial.

### [BL-008] Marketing page — legal and security trust section

- **Type**: Improvement
- **Priority**: High
- **Status**: Pending
- **Context**: The marketing/landing page currently has no meaningful legal or security trust signals. Before any public launch, users need visible proof that FinTrack takes security and data privacy seriously. This covers both the copy/UI and ensuring real legal documents exist.
- **Notes**:
  - Add a "Security & Trust" section to the landing page: highlight encryption at rest (**BL-002**), read-only Mono access, no credential storage, and 2FA support.
  - Ensure real Privacy Policy and Terms of Service documents are linked from the footer. Replace any placeholder links. Minimum viable legal docs should be tailored to NDPR and CBN requirements (see **BL-009** research).
  - Add trust badges: NDPR compliance notice, "Secured with 256-bit encryption", "Read-only bank access via Mono".
  - Related files: `apps/web/src/app/(marketing)/`, footer component, `/legal/privacy` and `/legal/terms` routes (create if missing).

### [BL-009] Research legal and compliance requirements for finance apps

- **Type**: Tech Debt
- **Priority**: High
- **Status**: Pending
- **Context**: As a fintech handling real bank account data (via Mono), FinTrack must comply with applicable Nigerian and international data regulations before public launch. A structured research doc should inform the legal copy, privacy policy, and technical controls.
- **Notes**:
  - Key frameworks to cover: **NDPR** (Nigeria Data Protection Regulation), **CBN Consumer Protection Framework**, **PCI-DSS** (if card data is ever in scope), **ISO 27001** (optional but worth referencing), and Mono's own developer data terms.
  - Output should be a compliance checklist mapped to: (a) what FinTrack already does, (b) what is missing, and (c) implementation priority for each gap.
  - This research feeds directly into **BL-008** (legal trust page), **BL-010** (bank data handling copy), and **BL-002** (encryption).
  - Assign to: legal review + engineering lead before any production launch.

### [BL-010] Marketing page — bank account data handling explainer

- **Type**: Feature
- **Priority**: Medium
- **Status**: Pending
- **Context**: Users need to understand exactly how their linked bank account data (via Mono) is accessed, stored, and protected before they trust the app with their financial credentials. A dedicated page or section should explain this clearly and honestly.
- **Notes**:
  - Suggested page: `/security` or `/how-we-protect-your-data` — linked from the footer and from the Mono link flow.
  - Content to cover: what data is read from Mono (read-only, no transaction initiation), retention period, third-party sharing policy, encryption (**BL-002**), and how users revoke access.
  - Tone: plain English, no legal jargon. Model after Plaid's "How Plaid Works" page or Mono's own transparency docs.
  - Include a visual data-flow diagram: User → Mono widget → Mono API → FinTrack backend → encrypted DB.
  - Related files: `apps/web/src/app/(marketing)/`, footer links, Mono link flow modal.

### [BL-011] Static content audit — realistic MVP copy and authorship

- **Type**: Tech Debt
- **Priority**: High
- **Status**: Pending
- **Context**: Various pages and components contain placeholder copy, fake client logos, fake sponsor names, dummy team members, and demo data that should never appear in a real MVP. Everything visible to a logged-in or logged-out user must reflect the actual product and its sole author before any public release.
- **Notes**:
  - **Landing / marketing pages**: Remove fake client logos, sponsor badges, or partner sections. Replace with honest feature-focused copy or remove those sections entirely.
  - **Team / about sections**: Update to show only the actual author — Damilare Oyewole. Remove placeholder team members or avatars. Link to his LinkedIn and GitHub accounts.
  - **Testimonials / social proof**: Remove fake testimonials. Either remove the section or replace with factual product statements until real feedback is available.
  - **Dashboard demo data**: Ensure the dashboard shows a proper empty state for new users — no seeded transactions, budgets, goals, or analytics.
  - **Footer / legal**: Confirm copyright year and author name are correct. Update placeholder privacy policy or terms links to real documents, or remove them.
  - **App name and branding**: Confirm every instance of the product name, logo alt text, and meta tags (title, description, og:image) are accurate.
  - Audit scope: `apps/web/src/app/(marketing|landing|home|about|legal)/`, root layout metadata, any `_components` with hardcoded copy. Run `grep -r "Lorem\|placeholder\|example\.com\|Fake\|Demo User\|Sponsor"` to surface most issues.

### [BL-012] Recurring billing reminders — frequency-aware advance notice

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: Users have no advance warning when a recurring bill is about to charge. A single reminder notification should fire once before each upcoming occurrence, with the lead time scaled to the billing frequency — a daily charge doesn't need a week's notice, but a yearly subscription should warn well in advance.
- **Notes**:
  - Send exactly **one** reminder per billing cycle. Once sent for a given occurrence, do not re-send until the next cycle.
  - Lead time by frequency: `DAILY` → 1 hour, `WEEKLY` → 1 day, `BIWEEKLY` → 2 days, `MONTHLY` → 3 days, `QUARTERLY` → 7 days, `YEARLY` → 14 days.
  - Track per-cycle send state: a `lastReminderSentAt` column on `RecurringItem` or a Redis key keyed by `recurringItemId:cycleDate`.
  - Add opt-in `reminderEnabled` boolean to `RecurringItem` (default `true`) so users can silence individual items without deleting them.
  - Notification channel: in-app + push (if enabled). No email — per-bill email reminders are noisy.
  - Only send for `ACTIVE` items where `reminderEnabled = true`.
  - Related files: `apps/scheduler_service/src/`, `packages/database/prisma/schema.prisma` (`RecurringItem` model), notification service, `apps/web/src/app/(dashboard)/finances/bills/`.

### [BL-013] Category deletion — reassign or transfer related entities

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: When a user deletes a user-owned category, transactions currently auto-move to Miscellaneous while budgets and recurring items are lost. Instead, the user should be prompted to choose where those entities move before the category is removed.
- **Notes**:
  - On delete, if the category has linked entities, show a reassignment dialog: "X transactions, Y budgets, and Z recurring items are using this category. Reassign them to:" with a category picker defaulting to a sensible system category (e.g. "Uncategorized").
  - If the category has zero linked entities, skip the dialog and delete immediately.
  - Backend: the delete endpoint should accept an optional `transferToCategoryId` parameter. If provided, run a single DB transaction updating all `transactions.categoryId`, `budgets.categoryId`, and `recurringItems.categoryId` to the target before removing the source.
  - If `transferToCategoryId` is omitted and linked entities exist, return `409 CONFLICT` with counts so the client can prompt the user.
  - The "Uncategorized" fallback system category should be seeded and guaranteed to exist (`isSystem: true`) so it is always a valid transfer target.
  - Related files: `apps/api_gateway/src/category/`, `apps/finance_service/src/category/`, `packages/database/prisma/schema.prisma` (Category model — check `onDelete` behaviour on relations), `apps/web/src/app/(dashboard)/finances/budgets/_components/unbudgeted_card.tsx`.

### [BL-014] Import and export transactions from CSV / PDF

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: Users need to be able to import transactions from CSV files and export their account data as high-quality CSV and PDF statements. Default export scope is the past 7 days; full account statement available on demand. Entry point is the dashboard screen.
- **Notes**:
  - Exports should be beautiful, high-resolution PDFs and well-structured CSVs.
  - Multi-sheet CSV and Excel export should be supported.
  - PDF should match FinTrack's visual identity — not a raw data dump.
  - CSV import must handle common Nigerian bank statement formats (GT Bank, Access, Zenith column layouts).

### [BL-015] Financial health score — weekly Pro-only metric

- **Type**: Feature
- **Priority**: Medium
- **Status**: Pending
- **Context**: A single weekly score (0–100) that reflects the user's financial health: budget adherence, goal pacing, savings rate, and debt/split settlement speed. Pro-only, shown on the dashboard and in the weekly insight. Free users see a blurred score with "Upgrade to unlock your Financial Health Score."
- **Notes**:
  - Score components (suggested weights): budget adherence 35%, savings rate 25%, goal pacing 25%, outstanding splits 15%.
  - Computed by the scheduler weekly (not real-time) and stored as a new DB field or analytics snapshot type.
  - Historical score trend (last 12 weeks) should be visualisable — provides a clear "am I improving?" signal that is highly sticky.
  - Push notification when score drops ≥10 points week-over-week — creates re-engagement.
  - Related files: `apps/scheduler_service/src/processors/analytics_aggregation.processor.ts`, `packages/database/prisma/schema.prisma`, `apps/web/src/app/(dashboard)/`.

---

## ✅ Done

### ✅ [BL-016] Tighten Free Plan AI limits

- **Type**: Improvement
- **Priority**: High
- **Status**: Done
- **Context**: Free users were getting 10 insights and 20 chat messages per month — generous enough that many never felt pressure to upgrade. Tighter limits create urgency earlier in the user journey.
- **Notes**:
  - Changed `packages/types/src/constants/plan.constants.ts`:
    - `AI_INSIGHTS_QUERIES_PER_MONTH`: 10 → 5
    - `AI_CHAT_MESSAGES_PER_MONTH`: 20 → 10
  - Also updated `apps/web/src/app/(static)/pricing/_data.ts` — `highlights` array and `COMPARISON_ROWS`.

### ✅ [BL-017] Post-registration 2FA setup prompt

- **Type**: Security
- **Priority**: High
- **Status**: Done
- **Context**: After a user registers or signs in for the first time, they see a one-time modal prompting them to enable two-factor authentication (TOTP or SMS). The prompt appears once — if the user dismisses it or enables 2FA, it never appears again.
- **Notes**:
  - Gated on a `hasSeenTwoFaPrompt` boolean in the user's settings record.
  - Non-blocking overlay with "Set up 2FA", "Remind me later", and "Don't show again" actions.
  - Mount in the dashboard root layout, gated with `!user.twoFaEnabled && !user.hasSeenTwoFaPrompt`.
  - Related files: `apps/web/src/app/(dashboard)/layout.tsx`, `packages/trpc_app/src/routers/user.ts`, `packages/types/proto/auth/user.proto`, `apps/auth_service/src/`.

### ✅ [BL-018] Tooltip-based onboarding flow for new web users

- **Type**: Feature
- **Priority**: High
- **Status**: Done
- **Context**: A spotlight/tooltip-driven onboarding tour walks first-time users through the key areas of the app: the dashboard overview, adding a first transaction, setting up a budget, and creating a goal. Activates automatically on first login; re-triggerable from Settings.
- **Notes**:
  - Uses the Onborda library (Next.js app router compatible).
  - Tour steps: dashboard hero, stat cards, cashflow chart, Add Transaction, Budgets, Goals, Splits.
  - Completion tracked via `hasCompletedOnboarding` in user settings — tour never re-triggers once set.
  - Related files: `apps/web/src/app/(dashboard)/_components/onboarding_tour.tsx`, `apps/web/src/app/(dashboard)/_components/dashboard_client.tsx`, `packages/trpc_app/src/routers/user.ts`.

### ✅ [BL-019] Mailtrap — sandbox in dev, sending API in production

- **Type**: Improvement
- **Priority**: High
- **Status**: Done
- **Context**: Mailtrap provides two API modes: sandbox (captures emails, never delivered, free, ideal for dev/staging) and sending API (delivers to real inboxes using a verified domain). The Notification Service must switch modes based on `NODE_ENV`.
- **Notes**:
  - Switch on `NODE_ENV`: sandbox token + `testInboxId` in non-production; sending API token in production.
  - `MAIL_FROM` must match the verified sending domain configured in the Mailtrap account.
  - Related files: `apps/notification_service/src/notification.module.ts`, `apps/notification_service/.env.example`.

---

## 🐛 Bugs

No open bugs.

---

## ✅ Resolved Bugs

### ✅ [BG-001] Component export issues on Budget page

- **Type**: Bug
- **Priority**: High
- **Status**: Done
- **Context**: Unbudgeted category card did not apply edit and delete props. The page produced constant 500 errors from mixed exports.
- **Notes**:
  - Edit and Delete are now fully functional on user-generated category cards.
  - Mixed export errors resolved.

---

## 📌 Notes

- Add new items at the top of the Backlog section with the next sequential `BL-xxx` ID.
- Prefix bug IDs with `BG-`.
- Move completed items to `## ✅ Done` or `## ✅ Resolved Bugs` rather than deleting them.
