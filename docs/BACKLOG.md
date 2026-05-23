# FinTrack — Backlog & Bug Tracker

Items are grouped by type. Each entry follows the format:

```
### [ID] Title
- **Type**: Feature | Bug | Improvement | Security | Tech Debt
- **Priority**: Critical | High | Medium | Low
- **Status**: Pending | In Progress | Blocked | Done
- **Context**: Brief explanation of the problem or goal
- **Notes**: Implementation hints, related files, or blockers
```

---

## 🗂️ Backlog

### [BL-004] Tooltip-based onboarding flow for new web users

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: New users landing on the dashboard for the first time have no guidance on what each section does or how to get started. A modern spotlight/tooltip-driven onboarding tour — similar to what Notion, Linear, and Intercom use — should walk first-time users through the key areas of the app: the dashboard overview, adding a first transaction, setting up a budget, and creating a goal. The tour activates automatically on the user's first login and can be re-triggered from Settings. Each step anchors a highlighted popover to the relevant UI element with a short description, a step counter, and Prev / Next / Skip controls.
- **Notes**:
  - Use a library like **Shepherd.js** (`shepherd.js`) or **driver.js** (`driver.js`) — both are framework-agnostic and work cleanly with Next.js App Router. `driver.js` is lighter (~5 kB gzip) and has a simpler API; Shepherd has more theming flexibility. Either should be styled to match the FinTrack design system (CSS var overrides).
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
- **Status**: Pending
- **Context**: Mailtrap provides two distinct API modes: a **sandbox** (emails are captured in a Mailtrap inbox and never delivered — free, no domain required, ideal for dev/staging) and a **sending API** (emails are actually delivered to real inboxes using a verified domain — charged per volume, for production). The Notification Service currently uses `MailtrapTransport` unconditionally without switching modes. In production, the sending API should be used with the verified domain so OTP codes, welcome emails, and security alerts reach real users.
- **Notes**:
  - Both modes use the same `MailtrapTransport` from `mailtrap` — the difference is which API token is provided and whether `testInboxId` is set (sandbox) or omitted (sending).
  - Switch on `NODE_ENV`: use the sandbox token + `testInboxId` when `NODE_ENV !== 'production'`; use the sending API token when `NODE_ENV === 'production'`.
  - Add `MAIL_ENV` (or rely on `NODE_ENV`) and separate env vars `MAIL_TOKEN_SANDBOX` / `MAIL_TOKEN_PROD` (or a single `MAIL_TOKEN` set per environment) to `apps/notification_service/.env.example`.
  - The `MAIL_FROM` address must match the verified sending domain configured in the Mailtrap account.
  - Related files: `apps/notification_service/src/notification.module.ts`, `apps/notification_service/.env.example`.

### [BL-002] Introduce Import Transactions data from csv files

- **Type**: Ferature
- **Priority**: High
- **Status**: Pending
- **Context**: Users need to be able to download and export high quality csv and pdf files containing account information, Should be ideally just past 7 days, and contains account statement. Intense export will be in dashboard screen
  **Notes**:
- Exports need to beautiful high ressolution pdfs and csv files
- multi sheet csv and excels should be possible

---

## 🐛 Bugs

---

## 📌 Notes

- Add new items at the top of their respective section.
- Prefix bug IDs with `BUG-`, backlog IDs with `BL-`.
- Move completed items to a `## ✅ Done` section at the bottom rather than deleting them.
