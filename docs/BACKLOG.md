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

### [BL-002] Implement insights-to-advisor flow

- **Type**: Feature
- **Priority**: High
- **Status**: Pending
- **Context**: Insights should hand off cleanly into Advisor so users can discuss, act on, and resolve recommendations without losing context from the original insight.
- **Notes**:
  - Ensure the insights-to-advisor handoff is smooth and preserves the insight context.
  - Fix the insights unread count bug.
  - Ensure budget insights prefill missing parts from the most recent related insight when the current insight is incomplete.
  - Readjust the insights model so Advisor can mark actions or recommendations as completed.
  - Do not clear/delete insights after Advisor action completion, since insights are retained in the database.

### [BL-001] Verify workflow actions work end to end

- **Type**: Improvement
- **Priority**: High
- **Status**: Pending
- **Context**: Workflow action approvals now execute through structured workflow candidates and atomic batch paths, but the real user flows still need full verification across supported workflow types.
- **Notes**:
  - Manually verify bill audit workflow approvals.
  - Manually verify budget rebalancer workflow approvals.
  - Confirm success, failed, and plan-limit cases render only through workflow card states and ephemeral errors.
  - Confirm terminal candidate states persist after refresh.

---

## ✅ Completed Backlog

---

## 🐛 Bugs

1. On refresh, the activeconversationid needs to be persisted so that refrehsing does not lead to empty chat state if user was on a convesration

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

### [BG-001] 2FA confirmation fails during setup

- **Type**: Bug
- **Priority**: High
- **Status**: Pending
- **Context**: Users can start two-factor authentication setup, but the confirmation step fails before 2FA is fully enabled. This blocks users from securing their accounts and undermines the security trust work before deployment.
- **Notes**:
  - Reproduce from settings → security → enable 2FA → enter/confirm the generated code.
  - Verify whether the failure is caused by secret generation/storage, OTP verification, session/auth headers, or mismatched env values between `web`, `api_gateway`, and `auth_service`.
  - Confirm the UI shows a useful error and does not leave the account in a half-enabled 2FA state.
  - Related files: `apps/web/src/app/(dashboard)/settings/security/_components/two_factor_section.tsx`, `apps/api_gateway/src/auth/`, `apps/auth_service/src/auth.service.ts`, `packages/next_auth/src/config.ts`.

---

## ✅ Resolved Bugs

---

## 📌 Notes

- Add new items at the top of the Backlog section with the next sequential `BL-xxx` ID.
- Prefix bug IDs with `BG-`.
- Move completed items to `## ✅Completed Backlog` or `## ✅ Resolved Bugs` rather than deleting them.
