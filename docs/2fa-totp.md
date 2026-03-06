# Two-Factor Authentication (TOTP) — Complete Reference

## Table of Contents

1. [What is 2FA?](#1-what-is-2fa)
2. [TOTP Theory — How It Works](#2-totp-theory--how-it-works)
3. [The otplib Library](#3-the-otplib-library)
4. [Fintrack Architecture Overview](#4-fintrack-architecture-overview)
5. [Database Changes](#5-database-changes)
6. [Proto / gRPC Contract](#6-proto--grpc-contract)
7. [Auth Service Implementation](#7-auth-service-implementation)
8. [API Gateway Endpoints](#8-api-gateway-endpoints)
9. [Frontend — Login 2FA Step](#9-frontend--login-2fa-step)
10. [Frontend — Settings Security Page](#10-frontend--settings-security-page)
11. [Backup Codes](#11-backup-codes)
12. [Security Considerations](#12-security-considerations)
13. [End-to-End Flow Diagrams](#13-end-to-end-flow-diagrams)
14. [Testing Checklist](#14-testing-checklist)

---

## 1. What is 2FA?

Two-Factor Authentication (2FA) requires a user to prove their identity using two independent methods before gaining access. The idea is that even if an attacker steals a password, they still cannot log in without the second factor.

The three factor categories are:

| Category | Example |
|---|---|
| Something you **know** | Password, PIN |
| Something you **have** | Phone, hardware key |
| Something you **are** | Fingerprint, Face ID |

2FA = password (know) + one-time code from phone (have).

In Fintrack we use **TOTP** — the most widely adopted standard for app-based 2FA, used by GitHub, Google, Stripe, and every major financial platform.

---

## 2. TOTP Theory — How It Works

### 2.1 The Building Block: HMAC

HMAC (Hash-based Message Authentication Code) is a cryptographic function that takes two inputs and produces a fixed-size tag:

```
HMAC(key, message) → fixed-size digest
```

Properties:
- Given the same key and message, always produces the same output
- Without the key, the output is computationally indistinguishable from random
- Changing the message or key by even one bit produces a completely different output

TOTP uses **HMAC-SHA1** — SHA-1 as the underlying hash, 20-byte (160-bit) output.

---

### 2.2 HOTP — The Predecessor (RFC 4226)

HOTP (HMAC-based OTP) is the foundation TOTP builds on. It uses an integer **counter** as the message:

```
HOTP(secret, counter) → 6-digit code
```

The full derivation step by step:

```
Step 1: HS = HMAC-SHA1(secret_bytes, counter_as_8_byte_big_endian)
        → 20-byte digest, e.g. [0x1f, 0x86, 0x98, 0x69, 0x0e...]

Step 2: offset = HS[19] & 0x0F
        → last 4 bits of the last byte, gives a number 0-15

Step 3: P = HS[offset] HS[offset+1] HS[offset+2] HS[offset+3]
        → 4 consecutive bytes starting at offset

Step 4: code_int = P & 0x7FFFFFFF
        → mask the top bit to ensure positive integer (31-bit)

Step 5: OTP = code_int % 10^6
        → 6-digit code, zero-padded on the left
           e.g. 37391 → "037391"
```

HOTP requires the server and device to share a **counter** that increments together. This sync problem is why TOTP was invented.

---

### 2.3 TOTP — Time as the Counter (RFC 6238)

TOTP solves the sync problem by replacing the counter with the current Unix timestamp, divided into 30-second windows:

```
T = floor(Unix_timestamp_seconds / 30)
TOTP(secret, T) = HOTP(secret, T)
```

**Why this works:** Both the server and the authenticator app read the system clock independently. As long as their clocks agree (within a reasonable tolerance), they compute the same T, feed it into HOTP, and get the same 6-digit code — with no network communication needed.

**30-second windows:** Every 30 seconds, T increments by 1, and a completely different code is generated. An attacker who steals a code only has at most 30 seconds to use it.

**Clock skew tolerance:** Clocks are never perfectly synced. Servers accept the code for `T-1`, `T`, and `T+1` (±30 seconds). This is controlled by the `window` option in otplib.

---

### 2.4 The Shared Secret

Both parties must agree on a secret before any codes can be generated. This secret is:

- A **random 160-bit (20-byte) value**, generated once during setup
- **Base32-encoded** for portability (e.g. `JBSWY3DPEHPK3PXP`) — base32 uses only A-Z and 2-7, avoiding ambiguous characters like 0/O and 1/l
- **Never transmitted during login** — it is shared exactly once during the setup QR scan and then stored by both parties forever

The server stores the secret in the `User.twoFactorSecret` field. The authenticator app stores it in its secure enclave.

---

### 2.5 The QR Code

The QR code is simply a standardised URI format called `otpauth`:

```
otpauth://totp/Fintrack:user@email.com?secret=JBSWY3DP&issuer=Fintrack&algorithm=SHA1&digits=6&period=30
```

Parameters:
| Parameter | Value | Meaning |
|---|---|---|
| `totp` | fixed | Time-based (vs `hotp`) |
| label | `Fintrack:email` | Display name in app |
| `secret` | base32 string | The shared secret |
| `issuer` | `Fintrack` | Organisation name |
| `algorithm` | `SHA1` | Hash function |
| `digits` | `6` | Code length |
| `period` | `30` | Window in seconds |

The authenticator app (Google Authenticator, Authy, 1Password, Bitwarden) parses this URI from the QR scan and stores the secret. From that point it generates codes locally, forever, with no network access required.

---

### 2.6 Why TOTP is Right for a Financial App

| Criterion | Email OTP | SMS OTP | TOTP |
|---|---|---|---|
| Security | Medium — if email compromised, 2FA fails | Low — SIM swapping is a known fintech attack vector | High — completely independent of email/phone |
| Cost | Low (already have email infra) | High (per-SMS fee) | Zero per-auth cost |
| Works offline | No | No | Yes |
| Standard for financial apps | No | No | Yes |
| User familiarity | High | Very high | High (most users have authenticator apps) |

---

## 3. The otplib Library

`otplib` is the standard Node.js TOTP library. It implements RFC 6238 and RFC 4226 exactly.

```bash
npm install otplib
```

Key API used in this project:

```typescript
import { authenticator } from 'otplib';

// Generate a new random base32 secret (call once at setup)
const secret = authenticator.generateSecret();
// → "JBSWY3DPEHPK3PXP" (example)

// Generate the otpauth URI for the QR code
const uri = authenticator.keyuri('user@email.com', 'Fintrack', secret);
// → "otpauth://totp/Fintrack%3Auser%40email.com?..."

// Verify a 6-digit code from the user
const isValid = authenticator.verify({
  token: '123456',  // code entered by user
  secret,           // stored secret
});
// → true or false

// Options (set globally or per call)
authenticator.options = {
  window: 1,  // accept T-1, T, T+1 (±30 seconds clock tolerance)
};
```

---

## 4. Fintrack Architecture Overview

### Current Login Flow (No 2FA)

```
User enters email + password
         │
         ▼
  auth_service: Login RPC
         │
   ┌─────▼─────┐
   │ verify     │ → fail → UNAUTHENTICATED error
   │ password   │
   └─────┬─────┘
         │ success
         ▼
   Create Session (Prisma)
         │
         ▼
   Generate access_token + refresh_token
         │
         ▼
   Return tokens to client
         │
         ▼
   Client stores tokens in NextAuth session cookie
```

### New Login Flow (With 2FA)

```
User enters email + password
         │
         ▼
  auth_service: Login RPC
         │
   ┌─────▼─────┐
   │ verify     │ → fail → UNAUTHENTICATED error
   │ password   │
   └─────┬─────┘
         │ success
         ▼
   twoFactorEnabled?
    │               │
   NO              YES
    │               │
    ▼               ▼
  [normal]    Return {
  session +     requiresTwoFactor: true,
  tokens        twoFactorToken: <5-min JWT>
              }
              (NO session created yet)
                   │
                   ▼
         Frontend shows 2FA screen
                   │
         User enters 6-digit code
                   │
                   ▼
        auth_service: VerifyTwoFactor RPC
                   │
        ┌──────────▼──────────┐
        │ Validate challenge   │
        │ JWT (5-min expiry)   │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │ TOTP verify         │ → fail → try backup code → fail → INVALID_ARGUMENT
        │ authenticator.      │
        │ verify(code,secret) │
        └──────────┬──────────┘
                   │ valid
                   ▼
           Create Session
                   │
                   ▼
           Return access_token + refresh_token
                   │
                   ▼
           Client stores in NextAuth session cookie
```

---

## 5. Database Changes

### 5.1 Schema additions (`packages/database/prisma/schema.prisma`)

```prisma
model User {
  id                   String    @id @default(uuid())
  email                String    @unique
  // ... all existing fields unchanged ...

  // 2FA fields — new
  twoFactorEnabled     Boolean   @default(false)
  twoFactorSecret      String?   // base32 TOTP secret, null until setup initiated

  // relation — new
  twoFactorBackupCodes TwoFactorBackupCode[]
}

model TwoFactorBackupCode {
  id        String    @id @default(cuid())
  userId    String
  codeHash  String    // bcrypt hash of the original 8-char code
  usedAt    DateTime? // null = unused, DateTime = consumed (single-use)
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Why `twoFactorSecret` is nullable:**
When the user clicks "Enable 2FA", the secret is generated and stored immediately (so the QR code can be shown). But `twoFactorEnabled` stays `false` until the user successfully enters their first code. If they abandon setup, the unused secret is harmless — it just sits there until overwritten on the next attempt.

**Why a separate `TwoFactorBackupCode` model:**
Backup codes are independent entities — they have their own lifecycle (created in bulk, consumed one-by-one, regenerated together). Putting them in a separate model keeps the User model clean and allows clean `deleteMany({ where: { userId } })` operations.

**Migration command:**
```bash
cd packages/database
pnpm prisma migrate dev --name add_2fa_totp
```

---

## 6. Proto / gRPC Contract

### 6.1 File: `packages/types/proto/auth/auth.proto`

#### New request/response messages

```proto
// --- Setup ---

message InitiateTwoFactorSetupReq {
  string userId = 1;
}

message InitiateTwoFactorSetupRes {
  string secret     = 1; // base32 — for manual entry in authenticator app
  string otpauthUri = 2; // full otpauth://totp/... URI — render as QR code
}

message ConfirmTwoFactorSetupReq {
  string userId = 1;
  string code   = 2; // 6-digit code from authenticator app — proves setup worked
}

message ConfirmTwoFactorSetupRes {
  repeated string backupCodes = 1; // 10 plain codes — shown ONCE, never stored plain
}

message DisableTwoFactorReq {
  string userId = 1;
  string code   = 2; // requires current TOTP code — prevents unauthorised disable
}

message DisableTwoFactorRes {
  bool success = 1;
}

// --- Mid-login verification ---

message VerifyTwoFactorReq {
  string twoFactorToken  = 1; // short-lived JWT returned by Login when 2FA required
  string code            = 2; // 6-digit TOTP or 8-char backup code
  string deviceId        = 3;
  optional string userAgent  = 4;
  optional string ipAddress  = 5;
  optional string location   = 6;
}
// Response reuses LoginRes
```

#### Modified `LoginRes`

```proto
message LoginRes {
  // existing fields (keep all):
  string accessToken  = 1;
  string refreshToken = 2;
  // ... user fields ...

  // new fields:
  bool             requiresTwoFactor = 5; // true = don't store tokens yet, show 2FA screen
  optional string  twoFactorToken    = 6; // 5-minute challenge JWT, only set when requiresTwoFactor=true
}
```

#### New RPC methods on `AuthService`

```proto
service AuthService {
  // ... existing RPCs unchanged ...

  rpc InitiateTwoFactorSetup (InitiateTwoFactorSetupReq) returns (InitiateTwoFactorSetupRes);
  rpc ConfirmTwoFactorSetup  (ConfirmTwoFactorSetupReq)  returns (ConfirmTwoFactorSetupRes);
  rpc DisableTwoFactor       (DisableTwoFactorReq)       returns (DisableTwoFactorRes);
  rpc VerifyTwoFactor        (VerifyTwoFactorReq)        returns (LoginRes);
}
```

**After editing the proto file, regenerate TypeScript types:**
```bash
cd packages/types
buf generate
```

---

## 7. Auth Service Implementation

### 7.1 Install dependency

```bash
cd apps/auth_service
npm install otplib
```

### 7.2 Helper: generate backup code

Add to `auth.service.ts` (private method):

```typescript
private generateBackupCode(): string {
  // Generates an 8-character hex code formatted as XXXX-XXXX
  // e.g. "3A9F-C042"
  const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}
```

### 7.3 `initiateTwoFactorSetup(req: InitiateTwoFactorSetupReq)`

```typescript
async initiateTwoFactorSetup(req: InitiateTwoFactorSetupReq) {
  const user = await this.prismaService.user.findUniqueOrThrow({
    where: { id: req.userId },
  });

  // Generate a fresh secret every time (idempotent — safe to call again if abandoned)
  const secret = authenticator.generateSecret();

  // Store the unconfirmed secret (twoFactorEnabled stays false)
  await this.prismaService.user.update({
    where: { id: req.userId },
    data: { twoFactorSecret: secret },
  });

  // Build the QR code URI — the frontend renders this as a QR code
  const otpauthUri = authenticator.keyuri(user.email, 'Fintrack', secret);

  return { secret, otpauthUri };
}
```

**What happens if the user abandons setup?**
The secret is stored but `twoFactorEnabled = false`. The next time they click "Enable 2FA", `initiateTwoFactorSetup` runs again and overwrites the old secret with a new one. No cleanup needed.

---

### 7.4 `confirmTwoFactorSetup(req: ConfirmTwoFactorSetupReq)`

```typescript
async confirmTwoFactorSetup(req: ConfirmTwoFactorSetupReq) {
  const user = await this.prismaService.user.findUniqueOrThrow({
    where: { id: req.userId },
  });

  if (!user.twoFactorSecret) {
    throw new RpcException({
      code: status.FAILED_PRECONDITION,
      message: 'Two-factor setup not initiated',
    });
  }

  // Verify the code the user just entered against the stored secret
  const isValid = authenticator.verify({
    token: req.code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: 'Invalid verification code',
    });
  }

  // Generate 10 single-use backup codes (shown once, never stored plain)
  const plainCodes = Array.from({ length: 10 }, () => this.generateBackupCode());
  const hashedCodes = await Promise.all(
    plainCodes.map(code => bcrypt.hash(code, 10)),
  );

  // Atomically: enable 2FA + store hashed backup codes
  await this.prismaService.$transaction([
    this.prismaService.user.update({
      where: { id: req.userId },
      data: { twoFactorEnabled: true },
    }),
    this.prismaService.twoFactorBackupCode.createMany({
      data: hashedCodes.map(codeHash => ({
        userId: req.userId,
        codeHash,
      })),
    }),
  ]);

  // Return PLAIN codes — this is the only time they will ever be visible
  return { backupCodes: plainCodes };
}
```

---

### 7.5 `login()` modification

Inside the existing `login()` method, after the password check passes and before session creation:

```typescript
// After: comparing password, checking emailVerified, resetting loginAttempts
// Before: createSession / generateTokens

if (user.twoFactorEnabled) {
  // Issue a short-lived challenge token instead of a real session
  const twoFactorToken = this.jwtService.sign(
    {
      sub: user.id,
      type: 'two_factor_challenge',
    },
    {
      secret: this.configService.get<string>('JWT_OTP_SECRET'),
      expiresIn: '5m',  // user has 5 minutes to complete 2FA
    },
  );

  // Return early — NO session created, NO real tokens issued
  return {
    requiresTwoFactor: true,
    twoFactorToken,
    // all other LoginRes fields left empty/default
  };
}

// else: fall through to normal session creation (unchanged)
```

---

### 7.6 `verifyTwoFactor(req: VerifyTwoFactorReq)`

```typescript
async verifyTwoFactor(req: VerifyTwoFactorReq) {
  // Step 1: Validate the challenge JWT
  let payload: { sub: string; type: string };
  try {
    payload = this.jwtService.verify(req.twoFactorToken, {
      secret: this.configService.get<string>('JWT_OTP_SECRET'),
    });
  } catch {
    throw new RpcException({
      code: status.UNAUTHENTICATED,
      message: 'Invalid or expired challenge token',
    });
  }

  if (payload.type !== 'two_factor_challenge') {
    throw new RpcException({ code: status.UNAUTHENTICATED });
  }

  // Step 2: Load the user
  const user = await this.prismaService.user.findUniqueOrThrow({
    where: { id: payload.sub },
  });

  if (!user.twoFactorSecret || !user.twoFactorEnabled) {
    throw new RpcException({ code: status.FAILED_PRECONDITION });
  }

  // Step 3: Try TOTP verification first
  const isTOTPValid = authenticator.verify({
    token: req.code,
    secret: user.twoFactorSecret,
  });

  if (!isTOTPValid) {
    // Step 4: Try backup codes as fallback
    const unusedBackupCodes = await this.prismaService.twoFactorBackupCode.findMany({
      where: { userId: user.id, usedAt: null },
    });

    // Compare the entered code against each hashed backup code
    const matchResults = await Promise.all(
      unusedBackupCodes.map(async bc => ({
        id: bc.id,
        valid: await bcrypt.compare(req.code, bc.codeHash),
      })),
    );
    const matched = matchResults.find(r => r.valid);

    if (!matched) {
      // Neither TOTP nor backup code matched
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid authentication code',
      });
    }

    // Mark backup code as used (single-use — can never be reused)
    await this.prismaService.twoFactorBackupCode.update({
      where: { id: matched.id },
      data: { usedAt: new Date() },
    });
  }

  // Step 5: 2FA passed — complete the login (create session, issue real tokens)
  return this.completeLogin(user, {
    deviceId:  req.deviceId,
    userAgent: req.userAgent,
    ipAddress: req.ipAddress,
    location:  req.location,
  });
}
```

> `completeLogin()` is a private method extracted from the existing `login()` method that handles session creation and token generation. Extract it during implementation to avoid duplicating logic between `login()` and `verifyTwoFactor()`.

---

### 7.7 `disableTwoFactor(req: DisableTwoFactorReq)`

```typescript
async disableTwoFactor(req: DisableTwoFactorReq) {
  const user = await this.prismaService.user.findUniqueOrThrow({
    where: { id: req.userId },
  });

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new RpcException({
      code: status.FAILED_PRECONDITION,
      message: '2FA is not enabled',
    });
  }

  // Require current TOTP code to disable — prevents attacker with stolen session from disabling 2FA
  const isValid = authenticator.verify({
    token: req.code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    throw new RpcException({
      code: status.PERMISSION_DENIED,
      message: 'Invalid verification code',
    });
  }

  // Atomically disable + wipe all secrets and backup codes
  await this.prismaService.$transaction([
    this.prismaService.user.update({
      where: { id: req.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    }),
    this.prismaService.twoFactorBackupCode.deleteMany({
      where: { userId: req.userId },
    }),
  ]);

  return { success: true };
}
```

---

## 8. API Gateway Endpoints

### 8.1 New routes (`apps/api_gateway/src/auth/auth.controller.ts`)

```
POST   /api/auth/2fa/initiate   → InitiateTwoFactorSetup
POST   /api/auth/2fa/confirm    → ConfirmTwoFactorSetup
POST   /api/auth/2fa/verify     → VerifyTwoFactor
DELETE /api/auth/2fa            → DisableTwoFactor
```

### 8.2 Authentication requirements

| Endpoint | Auth required | Why |
|---|---|---|
| `POST /2fa/initiate` | Bearer token (normal session) | User must be logged in to set up 2FA |
| `POST /2fa/confirm` | Bearer token (normal session) | Same |
| `POST /2fa/verify` | `twoFactorToken` in request body | Called before a real session exists |
| `DELETE /2fa` | Bearer token (normal session) + TOTP code in body | User must be logged in and prove identity |

### 8.3 Request/response shapes

```typescript
// POST /api/auth/2fa/initiate
// Body: none (userId derived from JWT)
// Response:
{
  secret: "JBSWY3DPEHPK3PXP",
  otpauthUri: "otpauth://totp/Fintrack%3Auser%40email.com?..."
}

// POST /api/auth/2fa/confirm
// Body:
{ code: "123456" }
// Response:
{
  backupCodes: ["3A9F-C042", "F71B-8E30", ...] // 10 codes
}

// POST /api/auth/2fa/verify
// Body:
{
  twoFactorToken: "eyJ...",
  code: "123456",          // or "3A9F-C042" for backup code
  deviceId: "...",
  userAgent: "...",
  ipAddress: "..."
}
// Response: same as normal login (accessToken + refreshToken + user)

// DELETE /api/auth/2fa
// Body:
{ code: "123456" }
// Response:
{ success: true }
```

---

## 9. Frontend — Login 2FA Step

### 9.1 Login mutation change

In the login handler (wherever `POST /api/proxy-auth/login` is called):

```typescript
const result = await loginMutation(credentials);

if (result.requiresTwoFactor) {
  // Store challenge token in React state (NOT localStorage — memory only)
  setTwoFactorToken(result.twoFactorToken);
  setStep('two-factor');  // switch the login form to 2FA screen
  return;
}

// else: normal post-login (store session etc)
```

### 9.2 2FA screen component

```
┌─────────────────────────────────────────┐
│                                         │
│          Two-Factor Authentication      │
│                                         │
│  Open your authenticator app and enter  │
│  the 6-digit code for Fintrack.         │
│                                         │
│  [ _ ][ _ ][ _ ] - [ _ ][ _ ][ _ ]    │
│                                         │
│              [Verify]                   │
│                                         │
│  ─────────────────────────────────────  │
│  Lost access to your app?               │
│  [Use a backup code instead →]          │
│                                         │
└─────────────────────────────────────────┘
```

Behaviour:
- 6-digit numeric input, auto-submits on 6th digit (no button press needed)
- "Use a backup code instead" toggle switches to a plain text input (accepts `XXXX-XXXX` format)
- On submit: `POST /api/auth/2fa/verify` with `{ twoFactorToken, code, deviceId }`
- On success: exactly same flow as normal login completion (session cookie set by NextAuth)
- On failure: show error, clear code input, do NOT clear `twoFactorToken` (let user retry)

### 9.3 twoFactorToken security

The `twoFactorToken` is a 5-minute JWT. It should:
- Live in React component state only — not `localStorage`, not `sessionStorage`
- Be discarded if the user navigates away from the login page
- Never be sent to any endpoint except `/api/auth/2fa/verify`

---

## 10. Frontend — Settings Security Page

### 10.1 Route

```
/dashboard/settings/security
```

### 10.2 States and screens

**State 1: 2FA Disabled**
```
┌─ Security ──────────────────────────────────────────────┐
│                                                         │
│  Two-Factor Authentication                              │
│  ● Disabled                                             │
│                                                         │
│  Add an extra layer of security to your account.       │
│  When enabled, you'll need your authenticator app      │
│  to log in.                                             │
│                                                         │
│  [Enable Two-Factor Authentication]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**State 2: Setup Step 1 — Scan QR Code**

Calls `POST /api/auth/2fa/initiate` on mount.

```
┌─ Set Up Two-Factor Authentication ──────────────────────┐
│                                                         │
│  Step 1 of 2 — Scan this QR code                       │
│                                                         │
│  ┌──────────────┐                                       │
│  │              │   Use Google Authenticator, Authy,   │
│  │   QR CODE    │   1Password, or Bitwarden.            │
│  │              │                                       │
│  └──────────────┘   Can't scan?                         │
│                     Enter this key manually:            │
│                     JBSWY3DP EHPK3PXP                   │
│                     (spaces added for readability)      │
│                                                         │
│  [Next →]                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**State 3: Setup Step 2 — Confirm Code**

```
┌─ Set Up Two-Factor Authentication ──────────────────────┐
│                                                         │
│  Step 2 of 2 — Enter the code from your app            │
│                                                         │
│  [ _ ][ _ ][ _ ] - [ _ ][ _ ][ _ ]                    │
│                                                         │
│  [← Back]                          [Confirm]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Calls `POST /api/auth/2fa/confirm` with the entered code.

**State 4: Backup Codes — shown once after successful confirm**

```
┌─ Save Your Backup Codes ────────────────────────────────┐
│                                                         │
│  These codes can be used to access your account if     │
│  you lose your authenticator device. Each code can     │
│  only be used once.                                     │
│                                                         │
│  KEEP THESE SAFE — they will not be shown again.       │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│  │3A9F-C042│  │F71B-8E30│  │9D2C-A157│               │
│  └─────────┘  └─────────┘  └─────────┘               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│  │... etc  │  │... etc  │  │... etc  │               │
│  └─────────┘  └─────────┘  └─────────┘               │
│                                                         │
│  [Copy all]  [Download as .txt]                        │
│                                                         │
│  [I've saved my backup codes — Done]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**State 5: 2FA Enabled**
```
┌─ Security ──────────────────────────────────────────────┐
│                                                         │
│  Two-Factor Authentication                              │
│  ● Active                                               │
│                                                         │
│  Your account is protected with an authenticator app.  │
│                                                         │
│  [Disable 2FA]                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Disable 2FA confirmation modal:**
```
┌─────────────────────────────────────────────────────────┐
│  Disable Two-Factor Authentication?                     │
│                                                         │
│  Enter the current code from your authenticator app    │
│  to confirm.                                            │
│                                                         │
│  [ _ ][ _ ][ _ ] - [ _ ][ _ ][ _ ]                    │
│                                                         │
│  [Cancel]                      [Disable 2FA]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 10.3 QR Code rendering

```bash
cd apps/web
npm install react-qr-code
```

```tsx
import QRCode from 'react-qr-code';

<QRCode
  value={otpauthUri}  // the full otpauth://totp/... string
  size={200}
  bgColor="transparent"
  fgColor="currentColor"
/>
```

---

## 11. Backup Codes

### Why they exist

TOTP requires the user's device. If the device is lost, stolen, or factory reset without warning, the user is permanently locked out — unless backup codes exist.

### Generation

```typescript
// 10 codes per setup
// Format: XXXX-XXXX where X = uppercase hex character
// e.g. "3A9F-C042"

const plainCodes = Array.from({ length: 10 }, () => {
  const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
});
```

Each code is:
- 32 bits of entropy (4 random bytes)
- Case-insensitive (hex chars only)
- Hyphen-separated for readability

### Storage

Only the **bcrypt hash** of each code is stored. The plain code is returned to the user once and never stored:

```typescript
const hashedCodes = await Promise.all(
  plainCodes.map(code => bcrypt.hash(code, 10)),
);
// store hashedCodes in TwoFactorBackupCode table
// return plainCodes to the user (once, never again)
```

### Usage

When a user enters a backup code at the 2FA screen:
1. Load all unused codes (`usedAt = null`) for the user
2. `bcrypt.compare(entered, hash)` for each — O(n) but n is max 10
3. On match: `update({ usedAt: new Date() })` — the code is now permanently spent

### Lifecycle

| Event | Effect on backup codes |
|---|---|
| 2FA enabled | 10 codes created |
| Code used | `usedAt` set — can never be reused |
| 2FA disabled | All codes deleted |
| Codes regenerated | All old codes deleted, 10 new ones created |

### Warning UX

When the user has ≤ 2 unused backup codes remaining, the settings page should display a warning:
```
Warning: Only 2 backup codes remaining.
[Regenerate backup codes]  (requires current TOTP code)
```

---

## 12. Security Considerations

### Rate limiting

The `VerifyTwoFactor` endpoint must be rate-limited. Without it, an attacker with a stolen challenge token can brute-force 6-digit codes (1,000,000 possibilities, but with 30-second windows and only 3 valid codes at any time, it's manageable without rate limiting — still, implement it).

Recommended: 5 failed attempts → invalidate the `twoFactorToken` (force user to log in with password again).

### Replay prevention

A TOTP code is valid for 90 seconds (window ±1). Without replay prevention, the same code could be submitted twice within that window.

Solution: Track the last successfully used `T` value per user. On successful verification:
```typescript
await this.prismaService.user.update({
  where: { id: user.id },
  data: { twoFactorLastUsedAt: new Date() },
});
```

Before accepting a code: check that `floor(now/30)` is greater than `floor(twoFactorLastUsedAt/30)`. If equal, the same window was already consumed — reject.

### Secret storage

For production, `twoFactorSecret` should be encrypted at rest using AES-256 with an application-level key (not the database key). This means even a database dump does not expose TOTP secrets.

```typescript
// Encryption wrapper (example)
encrypt(secret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', APP_ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(secret), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

decrypt(stored: string): string {
  const [ivHex, encHex] = stored.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', APP_ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString();
}
```

### Challenge token scope

The `twoFactorToken` JWT contains `{ sub: userId, type: 'two_factor_challenge' }`. The `type` field ensures it cannot be used as a regular access token or any other token type — even if the same `JWT_OTP_SECRET` is used for regular OTPs.

### Disabling 2FA requires TOTP

An attacker who gains access to a logged-in session cannot disable 2FA without the current TOTP code. This means even a compromised session cannot permanently downgrade account security.

---

## 13. End-to-End Flow Diagrams

### Setup Flow

```
User (browser)          Next.js API         API Gateway         Auth Service
─────────────          ───────────         ───────────         ────────────
Click "Enable 2FA"
      │
      ├──POST /api/auth/2fa/initiate──►
      │                                ──gRPC InitiateTwoFactorSetup──►
      │                                                         Generate secret
      │                                                         Store in User.twoFactorSecret
      │                                                         Build otpauth URI
      │                                ◄──{ secret, otpauthUri }──────
      │◄──{ secret, otpauthUri }───────
      │
Render QR code
User scans with app
User enters 6-digit code
      │
      ├──POST /api/auth/2fa/confirm──►
      │                               ──gRPC ConfirmTwoFactorSetup──►
      │                                                        authenticator.verify(code, secret)
      │                                                        Generate 10 backup codes
      │                                                        bcrypt.hash each
      │                                                        $transaction:
      │                                                          user.twoFactorEnabled = true
      │                                                          createMany(hashedCodes)
      │                               ◄──{ backupCodes: [...] }──────
      │◄──{ backupCodes: [...] }──────
      │
Display backup codes once
User saves them
      │
Done
```

### Login Flow (with 2FA enabled)

```
User (browser)          Next.js API         API Gateway         Auth Service
─────────────          ───────────         ───────────         ────────────
Enter email + password
      │
      ├──POST /api/proxy-auth/login──►
      │                               ──gRPC Login──────────────►
      │                                                        Verify password ✓
      │                                                        twoFactorEnabled = true
      │                                                        Sign twoFactorToken JWT (5m)
      │                                                        Return (no session created)
      │                               ◄──{ requiresTwoFactor:true, twoFactorToken }──
      │◄──{ requiresTwoFactor:true, twoFactorToken }──────────
      │
Store twoFactorToken in state
Show 2FA code screen
User opens authenticator app
User enters 6-digit code
      │
      ├──POST /api/auth/2fa/verify──►
      │                              ──gRPC VerifyTwoFactor──►
      │                                                       Validate challenge JWT ✓
      │                                                       authenticator.verify(code, secret) ✓
      │                                                       Create Session
      │                                                       Generate access + refresh tokens
      │                              ◄──{ accessToken, refreshToken, user }──
      │◄──{ accessToken, refreshToken, user }──────────────
      │
Store in NextAuth session cookie
Redirect to /dashboard
```

---

## 14. Testing Checklist

### Setup
- [ ] Click "Enable 2FA" → QR code and manual secret appear
- [ ] Scan QR code with Google Authenticator → app shows 6-digit code
- [ ] Enter wrong code → error shown, not enabled
- [ ] Enter correct code → 10 backup codes displayed
- [ ] Backup codes are shown only once (refreshing the page does not show them again)
- [ ] `User.twoFactorEnabled = true` in database
- [ ] `TwoFactorBackupCode` table has 10 rows for this user, all hashed

### Login with 2FA
- [ ] Login with email + password → 2FA screen shown (not redirected to dashboard)
- [ ] Enter wrong TOTP code → error, can retry
- [ ] Enter correct TOTP code → redirected to dashboard
- [ ] Challenge token expires after 5 minutes → must log in with password again
- [ ] Same TOTP code cannot be used twice in the same 30-second window (replay prevention)

### Backup codes
- [ ] At 2FA screen, switch to "backup code" input
- [ ] Enter a valid backup code → log in successfully
- [ ] Try the same backup code again → rejected (single-use)
- [ ] `usedAt` is set in the database for the consumed code
- [ ] All 9 remaining codes still work individually

### Disable 2FA
- [ ] Click "Disable 2FA" → modal appears asking for current TOTP code
- [ ] Enter wrong code → rejected
- [ ] Enter correct code → 2FA disabled
- [ ] Login after disabling → goes straight through (no 2FA screen)
- [ ] `User.twoFactorEnabled = false`, `twoFactorSecret = null` in database
- [ ] All `TwoFactorBackupCode` rows deleted

### Edge cases
- [ ] User abandons setup midway → can start setup again cleanly
- [ ] User with no authenticator app uses backup code to log in → works
- [ ] Google OAuth users can also enable 2FA (they may have no password — only TOTP blocks login)
- [ ] 2FA cannot be disabled without current TOTP code (even with valid session)
