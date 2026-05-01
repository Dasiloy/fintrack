# Auth Service — Architecture & Implementation Guide

## What the Auth Service Is Responsible For

Everything related to identity. No other service performs authentication logic —
they delegate to auth_service via gRPC.

```
┌─────────────────────────────────────────────────────────────┐
│                        auth_service                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Registration │  │    Login     │  │ Token Management │  │
│  │   & Email    │  │  & Sessions  │  │  & 2FA & OAuth   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Password   │  │   Account    │                        │
│  │    Flows     │  │  Management  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Domain 1 — Registration & Email Verification

### What it does

Creates a new user record, sends a one-time verification OTP, then activates
the account once confirmed. Registration does not log the user in — that is a
separate call to `login` after verification.

### How it works

```
register({ email, password, firstName, lastName })
  │
  hash password (bcrypt, 12 rounds)
  │
  Prisma transaction:
    create User (emailVerified: false)
    create Subscription (plan: FREE)
    create UsageTrackers (AI_INSIGHTS_QUERIES, AI_CHAT_MESSAGES, RECEIPT_UPLOADS)
  │
  call PaymentService.CreateCustomer() via gRPC
    → creates Stripe customer record, stores stripeCustomerId
  │
  generate OTP token (6-digit TOTP, expires per config)
  store VerificationToken in Postgres
  │
  BullMQ → TOKEN_NOTIFICATION_QUEUE → EMAIL_VERIFICATION_JOB
    → notification_service sends verification email
  │
  RegisterRes { message: "Verification email sent" }

─────────────────────────────────────────────────

verifyEmail({ token })             [guarded: otp_token]
  │
  validate OTP token signature and expiry
  │
  Prisma transaction:
    update User.emailVerified = true
    delete VerificationToken
  │
  BullMQ → TOKEN_NOTIFICATION_QUEUE → WELCOME_EMAIL_JOB
  │
  VerifyEmailRes { message: "Email verified" }
```

### gRPC methods

```proto
rpc Register(RegisterReq) returns (RegisterRes) {}
rpc VerifyEmail(VerifyEmailReq) returns (VerifyEmailRes) {}
rpc ResendVerifyEmailToken(ResendVerifyEmailTokenReq) returns (ResendVerifyEmailTokenRes) {}
```

---

## Domain 2 — Login & Session Management

### What it does

Authenticates a user by email/password (or Google OAuth), creates a session
record, and returns a JWT access token and refresh token. Login is blocked if
the email is unverified or the account is rate-limited.

### How it works — local login

```
login({ email, password, deviceInfo })
  │
  find User by email → 404 if not found
  │
  check emailVerified → reject if false
  │
  check loginAttempts > MAX_ATTEMPTS → reject if exceeded (lockout period)
  │
  bcrypt.compare(password, user.passwordHash)
    → on mismatch: increment loginAttempts, reject
    → on match: reset loginAttempts
  │
  if user.twoFactorEnabled:
    return { requiresTwoFactor: true, twoFactorToken: <signed JWT> }
    → client must call verifyTwoFactor() next
  │
  createSession(userId, deviceInfo)
    → writes Session row to Postgres (deviceId, deviceName, platform, expiresAt)
  │
  issue access_token (signed with ACCESS_SECRET, 15m TTL)
  issue refresh_token (signed with REFRESH_SECRET, 30d TTL, scoped to sessionId)
  cache user in Redis (TTL: USER_CACHE_TTL)
  │
  LoginRes { accessToken, refreshToken, user }
```

### How it works — Google OAuth

```
loginWithGoogle({ idToken })
  │
  OAuth2Client.verifyIdToken() → extract { email, name, picture, googleId }
  │
  upsert User (create if first time, update lastLoginAt if existing)
  upsert Account (provider: GOOGLE, providerAccountId: googleId)
  │
  if new user: create Subscription + UsageTrackers
             call PaymentService.CreateCustomer()
  │
  createSession → issue tokens → LoginRes
```

### Token types

The service issues four distinct JWT types, each signed with a different secret:

| Token | Secret | TTL | Used for |
|---|---|---|---|
| `access_token` | ACCESS_SECRET | 15m | API calls |
| `refresh_token` | REFRESH_SECRET | 30d | Token renewal |
| `otp_token` | OTP_SECRET | per config | Email verification, password reset |
| `2fa_token` | TWO_FACTOR_SECRET | short | 2FA challenge |

### gRPC methods

```proto
rpc Login(LoginReq) returns (LoginRes) {}
rpc LoginWithGoogle(LoginWithGoogleReq) returns (LoginRes) {}
rpc VerifyTwoFactor(VerifyTwoFactorReq) returns (LoginRes) {}
rpc ValidateToken(Empty) returns (ValidateTokenRes) {}
rpc RefreshToken(Empty) returns (RefreshTokenRes) {}
```

---

## Domain 3 — Two-Factor Authentication (TOTP)

### What it does

Adds a time-based one-time password (TOTP) second factor to a user's account,
compatible with any TOTP app (Google Authenticator, Authy, etc.). Also generates
backup codes for account recovery.

### How it works

```
initiateTwoFactorSetup()           [guarded: access_token]
  │
  generate TOTP secret via otplib
  store secret (unconfirmed) on User row
  │
  return { secret, qrCodeUrl }
    → client renders QR code, user scans with authenticator app

─────────────────────────────────────────────────

confirmTwoFactorSetup({ totpCode })  [guarded: access_token]
  │
  otp.verify(totpCode, user.twoFactorSecret)
    → reject if invalid (secret not yet confirmed)
  │
  generate 8 backup codes (crypto.randomBytes, hashed with bcrypt)
  │
  Prisma transaction:
    update User.twoFactorEnabled = true
    store hashed backup codes
  │
  return { backupCodes }  ← shown once, never again

─────────────────────────────────────────────────

verifyTwoFactor({ code })           [guarded: 2fa_token]
  │
  try TOTP code first → otp.verify(code, user.twoFactorSecret)
  if invalid: try backup codes (bcrypt compare each) → mark used
  if both fail: reject
  │
  createSession → issue access_token + refresh_token → LoginRes
```

### gRPC methods

```proto
rpc InitiateTwoFactorSetup(Empty) returns (InitiateTwoFactorSetupRes) {}
rpc ConfirmTwoFactorSetup(ConfirmTwoFactorSetupReq) returns (ConfirmTwoFactorSetupRes) {}
rpc DisableTwoFactor(DisableTwoFactorReq) returns (Empty) {}
rpc RegenerateBackupCodes(Empty) returns (RegenerateBackupCodesRes) {}
```

---

## Domain 4 — Password Flows

### What it does

Handles both unauthenticated password reset (forgot password) and authenticated
password change (in-app settings). Both paths use OTP tokens for verification.

### How it works

```
forgotPassword({ email })
  │
  find User by email (silent 200 even if not found — no enumeration)
  │
  generate OTP → store VerificationToken
  BullMQ → FORGOT_PASSWORD_EMAIL_JOB
  │
  ForgotPasswordRes {}

─────────────────────────────────────────────────

verifyPasswordToken({ token })      [guarded: otp_token]
  │
  TokenGuard validates OTP token signature
  │
  return { valid: true }
    → client now holds a valid otp_token to call resetPassword

─────────────────────────────────────────────────

resetPassword({ newPassword })      [guarded: otp_token]
  │
  hash new password
  │
  Prisma transaction:
    update User.passwordHash
    delete VerificationToken
    delete all Sessions (force re-login everywhere)
  │
  BullMQ → PASSWORD_CHANGE_JOB → password changed email

─────────────────────────────────────────────────

changePassword({ currentPassword, newPassword })  [guarded: access_token]
  │
  bcrypt.compare(currentPassword, user.passwordHash)
  │
  hash new password → update User
  BullMQ → PASSWORD_CHANGE_JOB
```

### gRPC methods

```proto
rpc ForgotPassword(ForgotPasswordReq) returns (ForgotPasswordRes) {}
rpc ResendForgotPasswordToken(ResendForgotPasswordTokenReq) returns (ResendForgotPasswordTokenRes) {}
rpc VerifyPasswordToken(VerifyPasswordTokenReq) returns (VerifyPasswordTokenRes) {}
rpc ResetPassword(ResetPasswordReq) returns (Empty) {}
rpc ChangePassword(ChangePasswordReq) returns (Empty) {}
```

---

## Domain 5 — Account Management

### What it does

In-app account operations available to authenticated users: email change and
account deletion. Both are security-sensitive and use OTP verification.

### How it works

```
initiateEmailChange({ newEmail })   [guarded: access_token]
  │
  check newEmail not already taken
  │
  generate OTP → store VerificationToken (scoped to newEmail)
  BullMQ → EMAIL_CHANGE_JOB → OTP sent to new email address
  BullMQ → EMAIL_CHANGED_JOB → security alert to old email
  │
  InitiateEmailChangeRes {}

─────────────────────────────────────────────────

verifyEmailChange({ token })        [guarded: otp_token]
  │
  validate OTP → extract new email from token claims
  │
  Prisma transaction:
    update User.email
    delete VerificationToken
  │
  Empty {}

─────────────────────────────────────────────────

deleteAccount({ password })         [guarded: access_token]
  │
  bcrypt.compare(password, user.passwordHash)
  │
  update User.scheduledDeletionAt = now + 30 days
  │
  BullMQ → ACCOUNT_DELETION_EMAIL_JOB → confirmation email
  BullMQ → PAYMENT_QUEUE → SUBSCRIPTION_DEACTIVATED_JOB
    → cancels Stripe subscription, notifies user
  │
  Empty {}
  → scheduler_service purges at 3:00 AM once scheduledDeletionAt passes
```

### gRPC methods

```proto
rpc InitiateEmailChange(ChangeEmailReq) returns (InitiateEmailChangeRes) {}
rpc VerifyEmailChange(VerifyEmailChangeReq) returns (Empty) {}
rpc DeleteAccount(DeleteAccountReq) returns (Empty) {}
```

---

## TokenGuard — How All Guards Work

The `TokenGuard` is the service's only guard. It reads the token from gRPC
metadata, verifies the signature with the correct secret for the token type,
and checks session expiry for access tokens.

```typescript
// auth.controller.ts — example usage
@UseGuards(TokenGuard)
@TokenMeta('access_token')
async validateToken(@Metadata() meta: Metadata) { ... }

@UseGuards(TokenGuard)
@TokenMeta('otp_token')
async resetPassword(...) { ... }
```

The `@TokenMeta(type)` decorator sets metadata that `TokenGuard` reads at
runtime to know which JWT secret and which validation rules to apply. Every
guarded endpoint specifies exactly one token type.

---

## Queue Topology

```
auth_service publishes to:

TOKEN_NOTIFICATION_QUEUE
  EMAIL_VERIFICATION_JOB      → new user registration
  WELCOME_EMAIL_JOB           → after email verified
  FORGOT_PASSWORD_EMAIL_JOB   → password reset requested
  PASSWORD_CHANGE_JOB         → password changed
  EMAIL_CHANGE_JOB            → new email verification OTP
  EMAIL_CHANGED_JOB           → security alert to old email
  ACCOUNT_DELETION_EMAIL_JOB  → account scheduled for deletion

PAYMENT_QUEUE
  SUBSCRIPTION_DEACTIVATED_JOB → on account deletion
```

All queue jobs are fire-and-forget. The auth flow never waits for the email
to send — the `TokenNotification` processor in notification_service handles
delivery asynchronously.

---

## gRPC Contract Summary

```proto
service AuthService {
  rpc Register(RegisterReq) returns (RegisterRes) {}
  rpc VerifyEmail(VerifyEmailReq) returns (VerifyEmailRes) {}
  rpc ResendVerifyEmailToken(ResendVerifyEmailTokenReq) returns (ResendVerifyEmailTokenRes) {}
  rpc Login(LoginReq) returns (LoginRes) {}
  rpc LoginWithGoogle(LoginWithGoogleReq) returns (LoginRes) {}
  rpc VerifyTwoFactor(VerifyTwoFactorReq) returns (LoginRes) {}
  rpc ForgotPassword(ForgotPasswordReq) returns (ForgotPasswordRes) {}
  rpc ResendForgotPasswordToken(ResendForgotPasswordTokenReq) returns (ResendForgotPasswordTokenRes) {}
  rpc VerifyPasswordToken(VerifyPasswordTokenReq) returns (VerifyPasswordTokenRes) {}
  rpc ResetPassword(ResetPasswordReq) returns (Empty) {}
  rpc ValidateToken(Empty) returns (ValidateTokenRes) {}
  rpc RefreshToken(Empty) returns (RefreshTokenRes) {}
  rpc InitiateTwoFactorSetup(Empty) returns (InitiateTwoFactorSetupRes) {}
  rpc ConfirmTwoFactorSetup(ConfirmTwoFactorSetupReq) returns (ConfirmTwoFactorSetupRes) {}
  rpc DisableTwoFactor(DisableTwoFactorReq) returns (Empty) {}
  rpc ChangePassword(ChangePasswordReq) returns (Empty) {}
  rpc InitiateEmailChange(ChangeEmailReq) returns (InitiateEmailChangeRes) {}
  rpc VerifyEmailChange(VerifyEmailChangeReq) returns (Empty) {}
  rpc RegenerateBackupCodes(Empty) returns (RegenerateBackupCodesRes) {}
  rpc DeleteAccount(DeleteAccountReq) returns (Empty) {}
}
```

---

## Implementation Order

### Step 1 — Registration + Email Verification

Build `register` and `verifyEmail`. This unlocks the entire onboarding flow.
No 2FA, no OAuth, no password reset yet. One happy path, end-to-end.

Deliverable: user can register, receive OTP email, verify email, and their
account is active in Postgres.

### Step 2 — Login + Token Validation

Build `login`, `validateToken`, `refreshToken`. This is the most critical path
— every other service depends on `validateToken` to authorise requests.

Deliverable: user can log in, get tokens, and api_gateway can validate them
via gRPC.

### Step 3 — Password Flows

Build `forgotPassword` → `verifyPasswordToken` → `resetPassword` and
`changePassword`. These are self-contained and don't depend on each other.

### Step 4 — 2FA

Build `initiateTwoFactorSetup` → `confirmTwoFactorSetup` → wire
`verifyTwoFactor` into the login flow. Add backup codes.

### Step 5 — Google OAuth

Build `loginWithGoogle`. Requires Google Cloud OAuth2 credentials configured.

### Step 6 — Account Management

Build email change and account deletion. These depend on Step 2 (access tokens)
and Step 1 (email queue) being complete.

---

## What to Ignore (Non-Goals)

- **SMS/phone 2FA** — TOTP is sufficient; SMS adds Twilio cost and complexity
- **Social logins beyond Google** — Google covers the majority of OAuth users
- **Multi-tenant / organisation auth** — single-user accounts only
- **Magic link login** — not planned; email/password + OAuth is the full auth surface
