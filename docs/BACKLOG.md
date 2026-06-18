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
  - Must ship before or alongside **BL-004** (Paystack + free trial) — the trial's account-freeze behaviour on expiry depends on this gate being in place.
  - Related files: `packages/types/src/constants/plan.constants.ts`, `apps/api_gateway/src/account/account.service.ts`, `apps/web/src/hooks/use_mono.ts`, `apps/web/src/app/(dashboard)/finances/accounts/`.

### [BL-004] ✅ Payment migration to Paystack + 2-month free Pro trial

- **Type**: Tech Debt / Feature
- **Priority**: Critical
- **Status**: Done
- **Context**: Two tightly-coupled workstreams. (1) Stripe does not natively support Nigerian Naira (NGN) billing and has poor card acceptance for Nigerian-issued cards — all subscription billing must move to Paystack, which is purpose-built for the Nigerian market. (2) Every new user gets a 2-month free Pro trial to experience the full product before paying — the single biggest conversion lever. The trial is implemented _on top of_ Paystack's future-dated subscription flow, which is why both are now one item: the trial cannot ship without the Paystack migration, and the migration's subscription model is shaped by the trial requirement. **Full code-level implementation lives in [`docs/PAYSTACK-PAYMENTS.md`](./PAYSTACK-PAYMENTS.md)** — this entry is the summary.
- **Notes**:

  **Part A — Stripe → Paystack migration**
  - **Remove**: `payment_service` Stripe SDK, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID` env vars.
  - **Add**: Paystack SDK / fetch wrapper, `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLISHABLE_KEY`, `PAYSTACK_PRO_MONTHLY_PRICE_ID` env vars (matches `.env.example` and `turbo.json`).
  - **Source of truth**: a `PaystackService` in `packages/common` (shared module) wraps all Paystack REST calls; both `payment_service` and `api_gateway` consume it rather than each re-implementing HTTP/signature logic.
  - **Subscription flow**: replace Stripe Checkout with Paystack hosted page (`/transaction/initialize`); replace Stripe subscription objects with Paystack Plans + Subscriptions; map webhook events (`charge.success`, `subscription.create`, `subscription.disable`, `invoice.create`, `invoice.payment_failed`).
  - **Webhook verification**: Paystack HMAC-SHA512 over the raw body, compared against the `x-paystack-signature` header.
  - **Frontend**: replace `loadStripe` / Stripe Elements with Paystack Inline JS or hosted-page redirect; drop `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
  - **DB migration**: `Subscription` model — replace `stripe*` columns with Paystack equivalents (`paystackCustomerCode`, `paystackSubscriptionCode`, `paystackPlanCode`, `paystackNextPaymentDate`, `paystackStatus`, `paystackAuthorizationCode`).

  **Part B — 2-month free Pro trial (Paystack future-dated subscription)**
  - **Trial-eligibility table is NOT related to `User`** — it is a standalone table keyed by normalized/hashed email that survives account deletion. When a user deletes their account (data removed/archived) and later re-registers with the same email, the prior trial record still blocks a second trial. This is the abuse guard; `trialUsed` must never live only on the user-scoped `Subscription` row.
  - **Activation = enterprise/future-dated subscription pattern**: tokenize the card with a small verification charge (e.g. ₦50, refunded or applied), then create a Paystack subscription with `start_date` set 2 months out. The user is granted Pro **immediately**; Paystack auto-charges the full plan at `start_date` unless the user cancels first. (No "downgrade nudge" model — this is opt-out auto-conversion.)
  - **Usage gating**: an active trial is treated identically to `plan = 'PRO'` across every feature gate in `apps/api_gateway/src/usage/usage.service.ts`.
  - **Pre-billing notices** (required for card-on-file auto-conversion): email at day ~45 and day ~58 — "Your card will be charged ₦X on [date]; cancel anytime." Templates in `apps/notification_service/templates/`.
  - **Cancellation before `start_date`**: disable the Paystack subscription, user reverts to FREE at trial end. Bank accounts 2+ freeze (greyed cards, "Sync paused — Upgrade to resume", data preserved). Requires **BL-003** (multi-account gating), already shipped.
  - **Trigger = post-registration onboarding** (decided): registration creates a FREE subscription with no card; the trial is activated from an onboarding step ("Start your 2-month free Pro trial"), which the user can skip. Industry standard for consumer fintech — users get in first, card is collected at the moment of intent.
  - **No card data stored**: the card is tokenized by Paystack (we keep only the `authorization_code` token — no card metadata). PCI scope stays SAQ-A.
  - **Self-service billing**: no in-app card-edit or cancel forms — a single "Manage subscription" button opens Paystack's hosted manage link (`/subscription/:code/manage/link`); cancellations flow back as `subscription.disable` / `subscription.not_renew` webhooks.
  - **Related files**: `packages/common/` (PaystackService), `apps/payment_service/src/`, `apps/api_gateway/src/payment/`, `apps/api_gateway/src/usage/usage.service.ts`, `apps/auth_service/src/` (registration), `apps/scheduler_service/src/` (trial-end sweep), `apps/notification_service/`, `packages/database/prisma/schema.prisma`, root `.env.example`.

### [BL-005] ✅ Upgrade nudge banners — quota progress and slot-approach warnings

- **Type**: Improvement
- **Priority**: High
- **Status**: Done
- **Context**: Free users have no visibility into how close they are to any of their limits until they hit a hard wall (`ProGateModal`). Two banner patterns are needed across all usage-gated and count-capped features: (1) a monthly quota progress bar that counts down toward zero for rolling monthly limits, and (2) an inline slot-approach warning shown on list pages when the user is within one slot of a count cap. Both patterns use the same upgrade CTA and share data already available in `plan_usage_provider.tsx` — no new API calls required.
- **Notes**:
  - **Pattern A — Monthly quota progress** (shown when usage ≥ 60% of monthly limit):
    - 60–99 %: amber chip — `"X of Y used this month · Upgrade to Pro →"`
    - 100 %: red chip — `"You've reached your limit. Upgrade to continue."`

    | Feature          | Free limit | Render location                               |
    | ---------------- | ---------- | --------------------------------------------- |
    | AI Insights      | 5 / month  | `(ai)/advisor/_components/insights_panel.tsx` |
    | AI Chat Messages | 10 / month | chat panel                                    |
    | Receipt Uploads  | 10 / month | Receipt upload page                           |

  - **Pattern B — Slot approach warning** (shown when current count ≥ limit − 1):
    - `"You have 1 budget slot remaining on the free plan. Upgrade to Pro for unlimited budgets. →"`
    - For features with a limit of 1 (bank accounts), show once the account is linked: `"You've used your 1 free bank account. Upgrade to link more."`

    | Feature           | Free limit | Render location                    |
    | ----------------- | ---------- | ---------------------------------- |
    | Budgets           | 5          | `(dashboard)/finances/budgets/`    |
    | Recurring Items   | 5          | `(dashboard)/finances/recurring/`  |
    | Goals             | 3          | `(dashboard)/planning/goals/`      |
    | Active Splits     | 3          | `(dashboard)/finances/splits/`     |
    | Custom Categories | 3          | `(dashboard)/settings/categories/` |
    | Bank Accounts     | 1          | `(dashboard)/finances/accounts/`   |

  - **Shared component:** `apps/web/src/app/_components/usage_banner.tsx` — accepts `{ used, limit, label, upgradeHref, variant: 'quota' | 'slot' }`. Pattern A drives the colour threshold logic; Pattern B drives the slot-remaining copy. One component, two display modes.
  - All usage counts and limits are already available via `plan_usage_provider.tsx` and `useCanUseFeature` — no new tRPC calls needed.
  - Boolean Pro-only gates (`PDF_REPORTS`, `CSV_EXPORT`, `ANALYTICS_ALL_TIME`) are hard-gated via `ProGateModal` and do not need progressive banners — there is no partial-usage concept for binary features.

### ✅ [BL-006] Recurring billing reminders — frequency-aware advance notice

- **Type**: Feature
- **Priority**: High
- **Status**: Done
- **Context**: Users have no advance warning when a recurring bill is about to charge. A single reminder notification should fire once before each upcoming occurrence, with the lead time scaled to the billing frequency — a daily charge doesn't need a week's notice, but a yearly subscription should warn well in advance.
- **Notes**:
  - Send exactly **one** reminder per billing cycle. Once sent for a given occurrence, do not re-send until the next cycle.
  - Lead time by frequency: `DAILY` → 1 hour, `WEEKLY` → 1 day, `BIWEEKLY` → 2 days, `MONTHLY` → 3 days, `QUARTERLY` → 7 days, `YEARLY` → 14 days.
  - Keep note that recuiuring items apre picked by a cron job which runs hopurly, so reminder cron must not clash with it. We need to come up with a way to ensure reminders always run before the actual billing
  - Track per-cycle send state: a `lastReminderSentAt` column on `RecurringItem`.
  - Add opt-in `reminderEnabled` boolean to `RecurringItem` (default `true`) so users can silence individual items without deleting them.
  - we need to add a new endpoint emnd to end top the fe for quicly toggling billing item remin der to be enabled or not.
  - on create remionder we should optioally accept this filed too, so users can turn it off if they want
  - Notification channel: in-app + push (if enabled). No email — per-bill email reminders are noisy.
  - Only send for `ACTIVE` items where `reminderEnabled = true`.
  - Related files: `apps/scheduler_service/src/`, `packages/database/prisma/schema.prisma` (`RecurringItem` model), notification service, `apps/web/src/app/(dashboard)/finances/bills/`.

### [BL-007] ✅ AI insights controls — user toggles, gated runs, usage accounting

- **Type**: Feature
- **Priority**: High
- **Status**: Done
- **Context**: Users have no control over the AI insight jobs that run on their account, and not every completed insight is counted against the monthly AI quota. Two `NotificationSetting` flags already exist in the DB (`dailyInsightsEnabled`, `budgetInsightsEnabled`, both default `true`) but are not surfaced in the UI or honoured by the background jobs. This item wires them end-to-end and fixes insight usage accounting so the free-plan limit is enforced consistently across every generation path.
- **Notes**:
  - **Settings UI**: add two switches to the account settings page (notification-preferences section) — "Daily AI insights" → `dailyInsightsEnabled`, "Budget breach insights" → `budgetInsightsEnabled`. DB fields already exist on `NotificationSetting`; expose them through the existing settings tRPC + gateway notification-settings update path.
  - **Gate the daily insights job**: the scheduler fires `DAILY_INSIGHTS_JOB` (`@Cron` 8am) → `insights_daily.processor.ts`. Only generate for users with `dailyInsightsEnabled = true` — filter at the user-selection query so opted-out users are never enqueued/run.
  - **Gate budget breach insights**: budget-breach insights (`apps/ai_service/src/insights/budget_breach.service.ts`, via `BUDGET_CHECK_QUEUE` / `BUDGET_BREACH_INSIGHTS_JOB`) must early-return for users with `budgetInsightsEnabled = false` — do not run the breach analysis or spend AI tokens.
  - **Usage accounting**: increment the `AI_INSIGHTS_QUERIES` usage tracker on insight **completion** (the `onComplete`/success path of the insight graph, not on enqueue) for all paths — daily, recurring, and manual/triggered. Today not every completed insight increments the counter, so the monthly free-plan limit is under-counted.
  - Decide explicitly and apply consistently whether background daily/breach runs count toward the same tracker as manual triggers (which already gate via `triggerInsights` → `limitReached`).
  - Related files: `apps/web/src/app/(dashboard)/settings/account/_components/`, settings tRPC router + `apps/api_gateway` notification-settings update, `apps/scheduler_service/src/scheduler.service.ts` + `processors/insights_daily.processor.ts`, `apps/ai_service/src/insights/` (`insights.service.ts`, `budget_breach.service.ts`), usage-tracker service, `packages/database/prisma/schema.prisma` (`NotificationSetting.dailyInsightsEnabled` / `budgetInsightsEnabled`).

  ### [BL-008] ✅ Category deletion — reassign or transfer related entities

- **Type**: Feature
- **Priority**: High
- **Status**: Done
- **Context**: When a user deletes a user-owned category, transactions currently auto-move to Miscellaneous while budgets and recurring items are lost. Instead, the user should be prompted to choose where those entities move before the category is removed.
- **Notes**:
  - On delete, if the category has linked entities, show a reassignment dialog: "X transactions, Y budgets, and Z recurring items are using this category. Reassign them to:" with a category picker defaulting to a sensible system category (e.g. "Miscellanous").
  - If the category has zero linked entities, skip the dialog and delete immediately.
  - Backend: the delete endpoint should accept an optional `transferToCategoryId` parameter. If provided, run a single DB transaction updating all `transactions.categoryId`, `budgets.categoryId`, and `recurringItems.categoryId` to the target before removing the source.
  - Since we run one category per budget, then the budget movement should be purely additive and not creating a new one.
  - By default picker should pick miscellenous category by default
  - Remmeber user can only delete user created category, system category cannot be deleted
  - If `transferToCategoryId` is omitted and linked entities exist, return `409 CONFLICT` with counts so the client can prompt the user.
  - Related files: `apps/api_gateway/src/category/`, `apps/finance_service/src/category/`, `packages/database/prisma/schema.prisma` (Category model — check `onDelete` behaviour on relations), `apps/web/src/app/(dashboard)/finances/budgets/_components/unbudgeted_card.tsx`.

### [BL-009] ✅ Financial health score — weekly Pro-only metric

- **Type**: Feature
- **Priority**: Medium
- **Status**: Done
- **Context**: A single weekly score (0–100) that reflects the user's financial health: budget adherence, goal pacing, savings rate, and debt/split settlement speed. Pro-only, shown on the dashboard. Free users see a blurred score with "Upgrade to unlock your Financial Health Score."
- **Notes**:
  - Score components (suggested weights): budget adherence 35%, savings rate 25%, goal pacing 25%, outstanding splits 15%.
  - A realtime finnacial score will give users higre trust in our product. The flow is to calculate on the fly for user.At the start of the new weekly scycle archive a finaceboard row for user for audit trails.
  - udget pacing. Users will never have too much budgets so it is easy to get the adherence rate and not too much compute
  - savings rate can be computed from user balance
  - goal pacing from user goals
    ssplit score from splist so not too much of compute is needed
  - on sunday od verey week, have a scheduler that archives the final score at 11pm utc, so that that way user can have an audit trial to look back to
  - Historical score trend (last 12 weeks) should be visualisable — provides a clear "am I improving?" signal that is highly sticky.
  - Related files: `apps/scheduler_service/src/processors/analytics_aggregation.processor.ts`, `packages/database/prisma/schema.prisma`, `apps/web/src/app/(dashboard)/`.

### [BL-010] Import and export transactions from CSV / PDF

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: Users need to be able to import transactions from CSV files and export their account data as high-quality CSV and PDF statements. Default export scope is the past 7 days; full account statement available on demand. Entry point is the dashboard screen.
- **Notes**:
  - Exports should be beautiful, high-resolution PDFs and well-structured CSVs.
  - Multi-sheet CSV and Excel export should be supported.
  - PDF should match FinTrack's visual identity — not a raw data dump.
  - CSV import must handle common Nigerian bank statement formats (GT Bank, Access, Zenith column layouts).
    -predictive warning when adding transaction as the case maybe, must be smart and fast but ,ost importantly, non blocking
  - add pre create transaction gate wrning to prevent duplicate transaction comming from different from different source

### [BL-011] ✅ Research legal and compliance requirements for finance apps

- **Type**: Tech Debt
- **Priority**: High
- **Status**: Done
- **Output**. The output of this research is in compliance txt fiule and has been done. Do not take every word for it. Instead look at the output of that research and basically trim out what we have and whet we need to fix
- **Context**: As a fintech handling real bank account data (via Mono), FinTrack must comply with applicable Nigerian and international data regulations before public launch. A structured research doc should inform the legal copy, privacy policy, and technical controls.
- **Notes**:
  - Key frameworks to cover: **NDPR** (Nigeria Data Protection Regulation), **CBN Consumer Protection Framework**, **ISO 27001** (optional but worth referencing), and Mono's own developer data terms.
  - Output should be a compliance checklist mapped to: (a) what FinTrack already does, (b) what is missing, and (c) implementation priority for each gap.
  - This research feeds directly into **BL-012** (legal trust page), **BL-013** (bank data handling copy), and **BL-002** (encryption).
  - Assign to: legal review + engineering lead before any production launch.

### ✅ [BL-012] Marketing page — legal and security trust section

- **Type**: Improvement
- **Priority**: High
- **Status**: Done
- **Context**: The marketing/landing page currently has no meaningful legal or security trust signals. Before any public launch, users need visible proof that FinTrack takes security and data privacy seriously. This covers both the copy/UI and ensuring real legal documents exist.
- **Notes**:
  - Add a "Security & Trust" section to the landing page: highlight encryption at rest (**BL-002**), read-only Mono access, no credential storage, and 2FA support.
  - Ensure real Privacy Policy and Terms of Service documents are linked from the footer. Replace any placeholder links. Minimum viable legal docs should be tailored to NDPR and CBN requirements (see **BL-011** research).
  - Add trust badges: NDPR compliance notice, "Secured with 256-bit encryption", "Read-only bank access via Mono".
  - Related files: `apps/web/src/app/(marketing)/`, footer component, `/legal/privacy` and `/legal/terms` routes (create if missing).

### ✅ [BL-013] Marketing page — bank account data handling explainer

- **Type**: Feature
- **Priority**: Medium
- **Status**: Done
- **Context**: Users need to understand exactly how their linked bank account data (via Mono) is accessed, stored, and protected before they trust the app with their financial credentials. A dedicated page or section should explain this clearly and honestly.
- **Notes**:
  - Suggested page: `/security` or `/how-we-protect-your-data` — linked from the footer and from the Mono link flow.
  - Content to cover: what data is read from Mono (read-only, no transaction initiation), retention period, third-party sharing policy, encryption (**BL-002**), and how users revoke access.
  - Tone: plain English, no legal jargon. Model after Plaid's "How Plaid Works" page or Mono's own transparency docs.
  - Include a visual data-flow diagram: User → Mono widget → Mono API → FinTrack backend → encrypted DB.
  - wire end to end from be to fe, flow for disconnecting and remobving linked bank account
  - Related files: `apps/web/src/app/(marketing)/`, footer links, Mono link flow modal.

### ✅ [BL-014] Static content audit — realistic MVP copy and authorship

- **Type**: Tech Debt
- **Priority**: High
- **Status**: Done
- **Context**: Various pages and components contain placeholder copy, fake client logos, fake sponsor names, dummy team members, and demo data that should never appear in a real MVP. Everything visible to a logged-in or logged-out user must reflect the actual product and its sole author before any public release.
- **Notes**:
- crucial, there must be no mention of beta or versioning oin the web app content, nno hyphens or dahses. Content must look humn written, no generic AI slop.No generic words, no oversharing.No over explanantion unless needed. avoid making it look like generic content. It must look like a professional content writer wrote this
- Landing page will be the last audited as we will redesign this using a few snapshots i will provide
  - **Landing / marketing pages**: Remove fake client logos, sponsor badges, or partner sections. Replace with honest feature-focused copy or remove those sections entirely.
  - **Team / about sections**: Update to show only the actual author — Damilare Oyewole. Remove placeholder team members or avatars. Link to his LinkedIn and GitHub accounts.
  - **Testimonials / social proof**: Remove fake testimonials. Either remove the section or replace with factual product statements until real feedback is available.
  - Audit every otehr ststiuc page not mentiooned here,
  - do not audit all at once or in apaprale, we will audit oine page at a time and only move to the next page when you provide a go ahed\
  - **Dashboard demo data**: Ensure the dashboard shows a proper empty state for new users — no seeded transactions, budgets, goals, or analytics.
  - **Footer / legal**: Confirm copyright year and author name are correct. Update placeholder privacy policy or terms links to real documents, or remove them.
  - in footer remove all social links untill we have those for the application itself
  - in team, link to damilare public linkedin profile and not github
  - no li ks to github
  - **App name and branding**: Confirm every instance of the product name, logo alt text, and meta tags (title, description, og:image) are accurate.
  - Audit scope: `apps/web/src/app/(marketing|landing|home|about|legal)/`, root layout metadata, any `_components` with hardcoded copy. Run `grep -r "Lorem\|placeholder\|example\.com\|Fake\|Demo User\|Sponsor"` to surface most issues.
  - Make sure to do a final audit of navbar, footer and every single ststic pages one after the other, before marking this as complete

---

## ✅ Completed Backlog

### ✅ [BL-015] Tighten Free Plan AI limits

- **Type**: Improvement
- **Priority**: High
- **Status**: Done
- **Context**: Free users were getting 10 insights and 20 chat messages per month — generous enough that many never felt pressure to upgrade. Tighter limits create urgency earlier in the user journey.
- **Notes**:
  - Changed `packages/types/src/constants/plan.constants.ts`:
    - `AI_INSIGHTS_QUERIES_PER_MONTH`: 10 → 5
    - `AI_CHAT_MESSAGES_PER_MONTH`: 20 → 10
  - Also updated `apps/web/src/app/(static)/pricing/_data.ts` — `highlights` array and `COMPARISON_ROWS`.

### ✅ [BL-016] Post-registration 2FA setup prompt

- **Type**: Security
- **Priority**: High
- **Status**: Done
- **Context**: After a user registers or signs in for the first time, they see a one-time modal prompting them to enable two-factor authentication (TOTP or SMS). The prompt appears once — if the user dismisses it or enables 2FA, it never appears again.
- **Notes**:
  - Gated on a `hasSeenTwoFaPrompt` boolean in the user's settings record.
  - Non-blocking overlay with "Set up 2FA", "Remind me later", and "Don't show again" actions.
  - Mount in the dashboard root layout, gated with `!user.twoFaEnabled && !user.hasSeenTwoFaPrompt`.
  - Related files: `apps/web/src/app/(dashboard)/layout.tsx`, `packages/trpc_app/src/routers/user.ts`, `packages/types/proto/auth/user.proto`, `apps/auth_service/src/`.

### ✅ [BL-017] Tooltip-based onboarding flow for new web users

- **Type**: Feature
- **Priority**: High
- **Status**: Done
- **Context**: A spotlight/tooltip-driven onboarding tour walks first-time users through the key areas of the app: the dashboard overview, adding a first transaction, setting up a budget, and creating a goal. Activates automatically on first login; re-triggerable from Settings.
- **Notes**:
  - Uses the Onborda library (Next.js app router compatible).
  - Tour steps: dashboard hero, stat cards, cashflow chart, Add Transaction, Budgets, Goals, Splits.
  - Completion tracked via `hasCompletedOnboarding` in user settings — tour never re-triggers once set.
  - Related files: `apps/web/src/app/(dashboard)/_components/onboarding_tour.tsx`, `apps/web/src/app/(dashboard)/_components/dashboard_client.tsx`, `packages/trpc_app/src/routers/user.ts`.

### ✅ [BL-018] Mailtrap — sandbox in dev, sending API in production

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

### [BG-003] Google sign-in fails in staging — "access denied" error

- **Type**: Bug
- **Priority**: High
- **Status**: Pending
- **Context**: Google OAuth sign-in is failing in the staging environment with an "access denied" error. Users attempting to authenticate via Google are blocked at the OAuth callback stage and cannot log in. Local and production environments are unaffected.
- **Notes**:
  - Likely cause: the staging redirect URI (`https://staging.fintrack.live/auth/callback` or equivalent) is not registered as an authorised redirect URI in the Google Cloud Console OAuth 2.0 client credentials.
  - Check the Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs — confirm the staging callback URL is listed under "Authorised redirect URIs".
  - Also verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars are correctly set for the staging environment on Railway — mismatched credentials between environments will produce the same error.
  - Confirm the OAuth consent screen is not restricted to internal/test users only, which would block staging logins from accounts outside the allowed test list.
  - Related files: `apps/auth_service/src/`, Google Cloud Console OAuth client config, Railway staging env vars.

### [BG-002] Mono webhook transactions not syncing for Kuda Bank in production

- **Type**: Bug
- **Priority**: High
- **Status**: Pending
- **Context**: Transactions from Kuda Bank are not being ingested via the Mono webhook after 24+ hours in production. The issue is confirmed on Kuda only — no other banks have been tested against the webhook path. It is unclear whether this is Kuda-specific (e.g. a different payload shape or institution code) or a broader webhook processing failure that other banks may also be experiencing silently.
- **Notes**:
  - Confirmed failing: Kuda Bank (production), 24+ hrs with no new transactions synced via webhook.
  - Untested banks: all other Mono-supported institutions (GTBank, Access, Zenith, First Bank, UBA, etc.) — must be validated before assuming they work.
  - Investigation starting points: Mono webhook delivery logs (Mono dashboard), `apps/finance_service/src/mono/` webhook handler, `apps/api_gateway/src/mono/` — check for institution-specific handling or payload differences for Kuda.
  - Check whether Kuda payloads use a different `institution.bankCode` or `type` field that the handler doesn't account for.
  - Add structured logging at the webhook ingestion boundary so failed or unrecognised payloads surface clearly.
  - **Test cases needed before closing**:
    - [ ] Kuda Bank: trigger a transaction and confirm it appears within expected SLA
    - [ ] GTBank, Access Bank, Zenith Bank, First Bank, UBA — at least one transaction each via webhook
    - [ ] Confirm sync also works via manual sync (not just webhook) as a fallback signal
    - [ ] Verify webhook signature validation is not silently rejecting Kuda payloads
    - [ ] Test with both debit and credit transaction types per bank

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
- Move completed items to `## ✅Completed Backlog` or `## ✅ Resolved Bugs` rather than deleting them.
