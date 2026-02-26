# FinTrack — Auth Flow: Forgot Password

## Overview

The forgot-password flow uses **three API endpoints** and a **dual-credential pattern** (JWT + OTP). This document covers the current implementation, the token design rationale, a security analysis with recommended fixes, and the revised flow that addresses the identified gaps.

**Relevant source files:**
- `apps/auth_service/src/auth.service.ts` — `forgotPassword()`, `resendForgotPassword()`, `resetPassword()`
- `packages/database/prisma/schema.prisma` — `VerificationToken` model

---

## 1. Routes

```
POST /auth/forgot-password
  Body:     { email: string }
  Response: { email: string, forgotPasswordToken: string }

POST /auth/resend-forgot-password
  Body:     { email: string }
  Response: { email: string, forgotPasswordToken: string }
  Error:    409 if a valid (non-expired) token already exists

POST /auth/reset-password
  Header:   x-token: <forgotPasswordToken>
  Body:     { otp: string, newPassword: string }
  Response: {} (empty on success)
  Errors:   401 invalid/expired OTP or JWT, 409 same password as current
```

---

## 2. Current Flow (as-implemented)

```
Step 1 — User requests reset
  POST /auth/forgot-password { email }
    → Generate 6-digit OTP: crypto.randomInt(100000, 1000000).toString()
    → Store OTP plain-text in VerificationToken table
        { identifier: 'PASSWORD', email, token: otp, expires: now + OTP_EXPIRY_MINUTES }
    → Sign JWT with JWT_OTP_SECRET
        { type: 'otp_token', id, email, avatar, firstName, lastName, exp: JWT_OTP_TOKEN_EXPIRATION }
    → Queue email job → user receives 6-digit code in inbox
    → Return { email, forgotPasswordToken: JWT }

Step 2 — User checks email, reads OTP

Step 3 — User submits OTP + new password
  POST /auth/reset-password
    Header x-token: <JWT from step 1>
    Body:  { otp: "123456", newPassword: "..." }
    → Guard validates JWT: type must be 'otp_token', not expired
    → Look up VerificationToken: { email (from JWT), token: otp, identifier: 'PASSWORD' }
    → Validate VerificationToken.expires > now
    → Validate bcrypt.compare(newPassword, user.password) === false (must differ from old)
    → Hash new password with bcrypt (cost 10)
    → Update user.password
    → Delete used VerificationToken immediately
    → Drop all user sessions (prevents session fixation / account takeover persistence)
    → Queue password-changed notification email
    → Return {}
```

**Database model:**

```
VerificationToken {
  id:         cuid
  identifier: EMAIL | PASSWORD
  email:      string
  token:      string  ← plain OTP stored here
  expires:    DateTime
  createdAt:  DateTime

  @@unique([email, token, identifier])
}
```

---

## 3. Two-Token Design Rationale

The current design uses a **dual-credential pattern**:

- **JWT (`forgotPasswordToken`)** — stateless, identifies the user and the reset session. Issued at step 1, carries `email`, `type: otp_token`.
- **OTP** — one-time numeric code, stored in DB with expiry. Proves the user controls the email inbox.

Both must be valid simultaneously for the reset to succeed:
- JWT alone → blocked (no OTP match in DB)
- OTP alone → blocked (no JWT to identify user or verify request origin)

This is functionally equivalent to "magic link + confirmation code" patterns used by services like Supabase and Clerk. It is a valid, industrial-grade design.

---

## 4. Option A vs Option B

### Option A (current — recommended)

```
POST /forgot-password  →  { JWT + OTP issued together }
POST /reset-password   →  JWT + OTP verified simultaneously
```

Single round-trip for the user. Both credentials prove identity in one combined check.

### Option B (more granular — not implemented)

```
POST /forgot-password  →  { "pre-verify JWT" (scope: otp_verify only) }
POST /verify-otp       →  verify OTP, issue NEW "reset JWT" (scope: password_reset, TTL: 10 min)
POST /reset-password   →  use reset JWT only, no OTP re-check
```

Option B adds an explicit lifecycle boundary: OTP verified → new scoped token issued → password reset. Prevents re-use of the original JWT if OTP is re-requested.

**Decision: Keep Option A.** The extra round-trip in Option B adds complexity without meaningful security gain, because:
- The original JWT becomes useless if the VerificationToken is deleted (which happens on successful reset)
- Rate limiting and jti invalidation (see gap 6 below) provide equivalent replay protection

---

## 5. Security Analysis

### Strengths (keep as-is)

- OTP generated with `crypto.randomInt` — cryptographically secure, not `Math.random`
- OTP is one-time use: `VerificationToken` deleted immediately after successful reset
- Both JWT AND OTP must match — neither alone is sufficient for an attacker
- All user sessions dropped after reset — prevents session fixation / account takeover persistence
- Bcrypt cost factor 10 — appropriate for passwords
- Password strength enforced (8+ chars, uppercase, lowercase, symbol)
- DB-level expiry check AND JWT expiry check — belt-and-suspenders
- Serializable transaction isolation on the reset mutation
- `unique([email, token, identifier])` constraint prevents duplicate tokens

### Gaps and Recommended Fixes

| # | Gap | Risk | Fix |
|---|-----|------|-----|
| 1 | OTP stored plain-text in DB | If DB is compromised, attacker reads all active OTPs and can reset any account within the expiry window | Hash OTP with bcrypt (cost 6 — faster than passwords, still secure) before storing. Compare using `bcrypt.compare(submittedOtp, storedHash)` on verify. User still receives plain OTP by email. |
| 2 | No brute-force protection on `/reset-password` | Attacker with a valid JWT can attempt OTP guesses. 1M combinations with 5-min window = ~3,333/sec needed, but no throttle currently blocks this | After N failed OTP attempts (recommended: 5): delete the VerificationToken, forcing a new forgot-password request. Track fail count in Redis keyed by JWT `jti`. |
| 3 | No rate-limit on `/forgot-password` | Any email address can be flooded (email bombing / account enumeration via response timing) | Rate limit: max 3 requests per email per hour + max 10 per IP per hour, via Redis sliding window. Return generic response regardless of whether email exists. |
| 4 | Multiple active PASSWORD tokens allowed | User can hold several valid JWTs from multiple requests, creating confusing state and extended attack window | On `forgotPassword()`: delete any existing PASSWORD tokens for the email before creating a new one. Only one active token per email at any time. |
| 5 | JWT expiry vs OTP expiry alignment | If `JWT_OTP_TOKEN_EXPIRATION` > `OTP_EXPIRY_MINUTES`, a user could hold a valid JWT and then request a new OTP (via resend) — the old JWT still works with the new OTP | Configure both to the same value (10–15 min recommended). Document the required alignment. |
| 6 | No `jti` on otp_token JWTs | After successful reset, the JWT is still technically valid until expiry. If intercepted, attacker could replay against a re-requested OTP | Add `jti: cuid()` to JWT payload at issue time. Store jti in Redis (TTL = JWT expiry) on issue. Mark as used in Redis on successful reset. Reject any jti seen twice. |

**Priority for implementation:** 4 → 3 → 1 → 2 → 6 → 5

---

## 6. Revised Flow (with recommended fixes applied)

```
POST /auth/forgot-password { email }
  → Rate limit check: 3/email/hour, 10/IP/hour  [gap 3]
  → Delete any existing PASSWORD VerificationToken for email  [gap 4]
  → Generate plain OTP = crypto.randomInt(100000, 1000000).toString()
  → Hash OTP = bcrypt.hashSync(otp, 6)  [gap 1]
  → Generate jti = cuid()  [gap 6]
  → Store VerificationToken: { email, token: hashedOtp, identifier: 'PASSWORD', jti, expires: +10min }
  → Sign JWT: { type: 'otp_token', jti, email, exp: 10min }  [gap 6]
  → Store jti in Redis: SET jti:<jti> "issued" EX 600  [gap 6]
  → Queue email job with PLAIN otp (user never sees hashed version)
  → Return { email, forgotPasswordToken: JWT }

POST /auth/reset-password { otp, newPassword }  (x-token: JWT)
  → Guard: validate JWT, check type = otp_token, not expired
  → Check Redis: GET jti:<jti> must be "issued" (not "used")  [gap 6]
  → Look up VerificationToken by { email, jti, identifier: 'PASSWORD' }  [gap 6]
  → Validate VerificationToken.expires > now
  → bcrypt.compare(otp, storedHashedOTP)  [gap 1]
    → On fail: increment Redis counter INCR fail:<jti>  [gap 2]
               If count > 5: delete VerificationToken, return 401  [gap 2]
               Else: return 401 without deleting token (retry allowed)
  → On pass:
    → SET jti:<jti> "used" EX (remaining JWT TTL)  [gap 6]
    → Validate new password ≠ current (bcrypt compare)
    → Hash new password (cost 10), update user
    → Delete VerificationToken
    → Drop all user sessions
    → Queue password-changed email
    → Return {}
```

---

## 7. Environment Variables

```bash
OTP_EXPIRY_MINUTES          # Controls VerificationToken.expires duration
JWT_OTP_SECRET              # Secret used to sign otp_token JWTs
JWT_OTP_TOKEN_EXPIRATION    # JWT expiry — MUST equal OTP_EXPIRY_MINUTES (both 10–15 min recommended)
```

**Alignment rule:** `JWT_OTP_TOKEN_EXPIRATION` and `OTP_EXPIRY_MINUTES` should always be set to the same value. If the JWT outlives the OTP, the JWT is useless (no valid DB token). If the OTP outlives the JWT, the OTP is unreachable (JWT rejected). Either case is a user-facing error.

No new environment variables are needed for the gap fixes — Redis is already in the stack for BullMQ.

---

## 8. Resend Flow

`POST /auth/resend-forgot-password { email }`:

1. Check if a non-expired PASSWORD token exists for the email
   - If yes: return `409 ALREADY_EXISTS` with remaining minutes before retry
   - If no: proceed
2. Delete all expired PASSWORD tokens for the email
3. Create new OTP + new JWT (same flow as `forgotPassword`)
4. Return `{ email, forgotPasswordToken: new JWT }`

With the gap fixes applied: the resend endpoint should also delete any existing PASSWORD token (not just expired ones), generate a fresh jti, and invalidate the old jti in Redis.

---

## 9. Out of Scope

The following alternatives were considered but are not implemented:

- **Magic links** (signed URL emailed to user, click to reset): higher phishing risk (user clicking links vs entering a code), more complex to implement securely (signed URL must be one-time use, HTTPS-only)
- **PKCE flow**: designed for OAuth cross-device scenarios, not email-based password reset
- **SMS OTP**: adds cost and a third-party dependency; email OTP is sufficient for this use case
- **Passkeys / WebAuthn**: future consideration for passwordless auth, separate from password reset

---

## Summary

The current forgot-password implementation is fundamentally sound — dual-credential pattern, cryptographically secure OTP, immediate one-time-use deletion, full session invalidation on reset. The six gaps identified above are security hardening tasks that should be addressed before production launch, with gap 4 (single active token per email) and gap 3 (rate limiting) being the highest priority.
