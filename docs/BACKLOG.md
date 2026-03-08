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

---

## 🐛 Bugs

_No known bugs at this time._

---

## 📌 Notes

- Add new items at the top of their respective section.
- Prefix bug IDs with `BUG-`, backlog IDs with `BL-`.
- Move completed items to a `## ✅ Done` section at the bottom rather than deleting them.
