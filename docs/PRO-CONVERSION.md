# FinTrack — Pro Conversion Quick Wins

Items here are scoped, standalone changes that can be shipped without architectural work.
Complex or multi-service features live in `BACKLOG.md`.

---

## 6. 2-Month Free Pro Trial for Every New User

**Why:** The single biggest reason users don't upgrade is that they have never experienced what Pro feels like. A 2-month trial removes the risk entirely — the user can explore unlimited AI insights, full analytics history, and unlimited budgets without spending anything. Once they have lived with Pro for 8 weeks and built habits around it, going back to the free plan feels like a downgrade. That friction is what converts.

**How it works:**

- Every new account gets **2 months of Pro automatically on signup**, no card required.
- After the trial ends, the account reverts to Free unless the user subscribes.
- A countdown banner appears in the app from day 45 onward: "Your Pro trial ends in 16 days — keep unlimited access for ₦4,500/month."
- On trial expiry, a single email is sent with a direct link to `/pricing`.

**What to track in the DB:**

```typescript
// Subscription model additions (schema.prisma)
trialEndsAt   DateTime?   // set to signup + 60 days on account creation
isOnTrial     Boolean     @default(false)
trialUsed     Boolean     @default(false)  // prevents a second trial if user re-registers
```

**Implementation touchpoints:**

- `apps/auth_service/src/` — on user registration, set `trialEndsAt = now + 60d`, `isOnTrial = true`
- `apps/api_gateway/src/usage/usage.service.ts` — when checking plan limits, treat `isOnTrial = true` the same as `plan = 'PRO'`
- `apps/scheduler_service/src/` — daily cron to expire trials: find all `isOnTrial = true` where `trialEndsAt < now`, set `isOnTrial = false`
- `apps/web/src/app/_components/` — trial countdown banner component
- `apps/notification_service/` — trial expiry email (new templates: `trial_ending.hbs`, `trial_expired.hbs`)

**Expected impact:** Users who experience Pro for 2 months and use AI insights regularly have a very high conversion rate to paid. PiggyVest, Cowrywise, and every successful Nigerian fintech acquired early users through generous free periods before monetising. The goal is habit formation first, billing second.

---

### Trial Expiry Design — Making the Downgrade Felt

The trial expiry must be *felt*, not just *noticed*.

#### 1. Expiry email sequence (not a single email)

- Day 45: "Your Pro trial ends in 15 days — here is what you will keep and what will change"
- Day 58: "2 days left — your bank sync for additional accounts will pause unless you upgrade"
- Day 61 (expiry): "Your trial has ended. AI insights are now limited to 5/month. Bank sync for accounts beyond your first has paused."

Add three email templates to `apps/notification_service/templates/`:

```text
trial_warning.hbs     — day 45 and day 58 (parameterised by days remaining)
trial_expired.hbs     — day 61
```

#### 2. In-app expiry modal on first login after trial ends

Not a banner — a modal with a 5-second non-dismissible countdown before "Continue on free" becomes clickable. The user must consciously decide to stay on free.

```text
Your Pro trial has ended.

AI insights: limited to 5/month
AI advisor: limited to 10 messages/month
Bank sync: [N] additional accounts paused

[Upgrade to Pro — ₦4,500/month]     [Continue on free plan (available in 5s)]
```

File: `apps/web/src/app/_components/trial_expired_modal.tsx` — shown once per user after trial expiry, gated by a `trialExpiredAcknowledged` flag on the subscription.

#### 3. Freeze connected bank accounts — do not disconnect

When the trial expires, accounts 2+ stop syncing but remain visible as greyed-out cards:

```text
[GTBank ••• 4521]    Last synced: 2 days ago    [Sync paused — Upgrade to resume]
```

Do not delete the connection or historical data. Visibility without access is more motivating than removal. Depends on **BL-014** being shipped before or alongside the trial feature.

#### 4. User-controlled daily insights toggle (prerequisite)

The daily scheduler runs automatically and will consume all 5 free monthly insights within the first 5 days if left unchecked. This is not acceptable UX — users need control over whether automated daily insights run on their account.

Before tightening limits or shipping the trial, add a toggle in notification preferences:

```text
Settings → Notifications → AI Insights
  [●] Daily AI insights    — automatically generate a morning briefing each day
```

- Defaults to **on** during the Pro trial (full experience)
- On trial expiry, if the user remains on free, prompt them: "Daily AI insights are on. With 5 insights/month on the free plan, 5 days of daily generation will exhaust your quota. Turn off daily to save them for manual use."
- Free users who leave it on are consciously choosing that trade-off

This toggle already has an infrastructure path — the `InsightsDailyProcessor` in `scheduler_service` queries active users. Adding a `dailyInsightsEnabled` boolean to `NotificationSetting` (already in the DB) is the entire backend change. The frontend toggle lives in `apps/web/src/app/(dashboard)/settings/account/_components/notification_prefrences.tsx`.

---

## 1. Tighten Free Plan AI Limits

**Why:** Free users currently get 10 insights and 20 chat messages per month — generous enough that many never feel pressure to upgrade. Tighter limits create urgency earlier in the user journey.

**Change one file:**

```text
packages/types/src/constants/plan.constants.ts
```

```typescript
// Before
AI_INSIGHTS_QUERIES_PER_MONTH: 10,
AI_CHAT_MESSAGES_PER_MONTH:    20,

// After
AI_INSIGHTS_QUERIES_PER_MONTH: 5,
AI_CHAT_MESSAGES_PER_MONTH:    10,
```

At 5 insights/month, a user generating one insight every 6 days hits their ceiling. The daily automated insight alone consumes 5 in 5 days, meaning any active user will feel the limit within the first week without even manually triggering one.

**Also update the pricing page display** in:

```text
apps/web/src/app/(static)/pricing/_data.ts   — highlights array
apps/web/src/app/(static)/pricing/_data.ts   — COMPARISON_ROWS
```

---

## 2. In-App Soft Limit Warning Banner

**Why:** Users who do not know they are close to their limit cannot be nudged to upgrade. Showing "3 of 5 AI insights used this month" at 60%+ creates a countdown effect that is more motivating than a hard wall.

**What to build:** A small persistent chip/banner on the Advisor page and Dashboard that reads from the plan usage provider (already available via `plan_usage_provider.tsx`).

Show when usage ≥ 60% of the monthly limit:

```text
AI Insights · 3 of 5 used this month   [Upgrade to Pro →]
```

- Below 60%: hidden
- 60–99%: amber warning chip
- 100% (limit hit): red — "You've reached your limit. Upgrade to continue."

**Files to create/modify:**

- `apps/web/src/app/_components/usage_warning_banner.tsx` — new component
- `apps/web/src/app/(ai)/advisor/_components/insights_panel.tsx` — render the banner above the insights list
- `apps/web/src/app/(dashboard)/dashboard_layout.tsx` or top-level dashboard — render for AI chat usage

The plan usage data is already fetched in `plan_usage_provider.tsx`. No new API calls needed.

---

## 3. Analytics History Teaser for Free Users

**Why:** Free users are limited to 6 months of analytics. Most new users will not notice this for months — but when they do, it is one of the cleanest, most natural upgrade moments in the product.

**What to build:** On the analytics page, when the selected date range extends beyond the 6-month free window, render a locked overlay on the out-of-range section rather than silently hiding it.

```text
[Unlocked data]  ←── visible, interactive
[Locked section] ←── blurred/grayed, with a lock icon and "Upgrade to Pro to see data from Dec 2025 and earlier"
```

The analytics query already enforces the limit server-side. This change is purely presentational — detect that the user is on Free, calculate the cutoff date, and render the overlay on the appropriate section of the chart/table.

**Files to modify:**

- `apps/web/src/app/(dashboard)/analytics/` — add cutoff date calculation and overlay component
- No backend changes needed

---

## 5. Post-Limit Upgrade Flow Improvement

**Why:** When a free user hits a hard limit (e.g. tries to add a 6th budget), the `ProGateModal` currently shows immediately and routes to `/pricing`. This is good. What is missing is a soft warning *before* they hit the wall.

**What to build:** When a user is at 4 of 5 budgets (or 2 of 3 goals), show an inline callout on the relevant list page:

```text
You have 1 budget slot remaining on the free plan.
Upgrade to Pro for unlimited budgets. →
```

This primes the upgrade decision before the frustration of hitting a hard wall.

**Files to modify:**

- `apps/web/src/app/(dashboard)/finances/budgets/` — read current count vs limit, show callout when within 1 of limit
- `apps/web/src/app/(dashboard)/planning/goals/` — same pattern
- The limit and current count are already available via `plan_usage_provider.tsx` and `useCanUseFeature`
