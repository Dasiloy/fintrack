# OAuth Setup — Google & Apple

> **Scope of this document:** End-to-end setup for both OAuth providers — console configuration, environment variables, code changes, and local dev HTTPS. Google OAuth is already wired into the codebase; Apple requires the additional code steps documented below.

**References**

- [Auth.js Google provider](https://authjs.dev/getting-started/providers/google)
- [Auth.js Apple provider](https://authjs.dev/getting-started/providers/apple)
- [Apple Sign in with Apple — developer overview](https://developer.apple.com/sign-in-with-apple/)
- [Google OAuth 2.0 overview](https://developers.google.com/identity/protocols/oauth2)

---

## Architecture Overview

```
Browser
  └── NextAuth (apps/web → packages/next_auth)
        ├── Google Provider  → Google OAuth  → signIn callback → POST /auth/oauth/google
        └── Apple Provider   → Apple OAuth   → signIn callback → POST /auth/oauth/apple
                                                                     ↓
                                                              api_gateway
                                                                     ↓
                                                              auth_service (gRPC)
                                                                     ↓
                                                              Neon DB (upsert user)
```

The OAuth `signIn` callback in `packages/next_auth/src/config.ts` receives the provider's user data and syncs it with the backend via the API gateway. The backend upserts the user and returns `accessToken` + `refreshToken`.

---

## Part 1 — Google OAuth

### 1.1 Google Cloud Console Setup

**Step 1 — Create or select a project**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown (top-left) → **New Project**
3. Name it `fintrack` → **Create**

**Step 2 — Enable the Google Identity API**

1. In the left sidebar → **APIs & Services → Library**
2. Search for `Google Identity` → select **Google Identity Toolkit API** → **Enable**
3. Also enable **People API** (needed for profile photo)

**Step 3 — Configure the OAuth consent screen**

1. **APIs & Services → OAuth consent screen**
2. User type: **External** → **Create**
3. Fill in:
   - App name: `FinTrack`
   - User support email: your email
   - Developer contact: your email
4. **Save and Continue** through Scopes (add `email`, `profile`, `openid`)
5. Add test users during development (your own email)
6. Publish the app when ready for production

**Step 4 — Create OAuth credentials**

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `FinTrack Web`
4. Add **Authorised JavaScript origins**:
   ```
   http://localhost:3000
   https://app.fintrack.live
   ```
5. Add **Authorised redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://app.fintrack.live/api/auth/callback/google
   ```
6. **Create** → copy **Client ID** and **Client Secret**

### 1.2 Environment Variables

```env
# apps/web/.env.local (development)
AUTH_GOOGLE_ID=<Client ID from step 4>
AUTH_GOOGLE_SECRET=<Client Secret from step 4>
```

```env
# Render → fintrack-web service → Settings → Environment (production)
AUTH_GOOGLE_ID=<Client ID>
AUTH_GOOGLE_SECRET=<Client Secret>
```

### 1.3 Code Status

Google is **already implemented**. The relevant files:

**`packages/next_auth/src/config.ts`** — provider + callback

```typescript
import GoogleProvider from 'next-auth/providers/google';

providers: [
  GoogleProvider({
    clientId: env.AUTH_GOOGLE_ID,
    clientSecret: env.AUTH_GOOGLE_SECRET,
  }),
  // ...
],

callbacks: {
  async signIn({ user, account }) {
    if (account?.provider === 'google') {
      console.log("user",user);
      console.log("account",account)
      const response = await fetch(`${env.API_GATEWAY_URL}/auth/oauth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          image: user.image,
          google_id: account.providerAccountId,
        }),
      });
      // ...
    }
  },
},
```

**`packages/next_auth/src/config.ts` → `AuthEnv` interface**

```typescript
export interface AuthEnv {
  AUTH_SECRET: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
  API_GATEWAY_URL: string;
  JWT_ACCESS_TOKEN_EXPIRATION: string;
}
```

**`apps/web/src/env.js`** — validation

```javascript
server: {
  AUTH_GOOGLE_ID: z.string(),
  AUTH_GOOGLE_SECRET: z.string(),
  // ...
}
```

---

## Part 2 — Apple OAuth

Apple OAuth is more involved than Google. It uses OIDC with a JWT-based client secret (not a static string), has strict HTTPS requirements, and only sends user data on the **first** sign-in.

### 2.1 Apple Developer Console Setup

> **Prerequisite:** An Apple Developer account ($99/year) at [developer.apple.com](https://developer.apple.com)

#### Step 1 — Create an App ID

1. [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. **Identifiers → (+)** → Select **App IDs** → **App** → **Continue**
3. Description: `FinTrack`
4. Bundle ID: `live.fintrack.app` (reverse domain, explicit)
5. Scroll to **Capabilities** → enable **Sign in with Apple** → **Continue** → **Register**

#### Step 2 — Create a Services ID (this is the OAuth client)

1. **Identifiers → (+)** → Select **Services IDs** → **Continue**
2. Description: `FinTrack Web`
3. Identifier: `live.fintrack.web` ← this becomes your `AUTH_APPLE_ID`
4. **Continue** → **Register**
5. Click the newly created Services ID → enable **Sign in with Apple** → **Configure**
6. Primary App ID: select `live.fintrack.app` (from Step 1)
7. Add **Domains and Subdomains**:
   ```
   app.fintrack.live
   ```
   For development (Apple requires HTTPS — see Local Dev section below):
   ```
   your-ngrok-subdomain.ngrok.io
   ```
8. Add **Return URLs**:
   ```
   https://app.fintrack.live/api/auth/callback/apple
   https://your-ngrok-subdomain.ngrok.io/api/auth/callback/apple
   ```
9. **Save** → **Continue** → **Save**

#### Step 3 — Generate a Private Key

1. **Keys → (+)**
2. Key Name: `FinTrack Sign in with Apple`
3. Enable **Sign in with Apple** → **Configure** → select `live.fintrack.app` as Primary App ID
4. **Continue** → **Register**
5. **Download** the `.p8` file immediately — **it can only be downloaded once**
6. Note your **Key ID** (10-character string shown on the key detail page)
7. Note your **Team ID** (top-right of developer.apple.com, under your name — also 10 chars)

#### Step 4 — Generate the Client Secret JWT

Apple's "client secret" is not a static string. It's a JWT you sign with your private key. It expires after 6 months maximum.

**Generate using Node.js:**

```javascript
// scripts/generate-apple-secret.mjs
import { SignJWT } from 'jose';
import { createPrivateKey } from 'crypto';
import { readFileSync } from 'fs';

const TEAM_ID = 'XXXXXXXXXX'; // Your Apple Team ID
const CLIENT_ID = 'live.fintrack.web'; // Your Services ID
const KEY_ID = 'YYYYYYYYYY'; // Your Key ID
const PRIVATE_KEY_PATH = './AuthKey_YYYYYYYYYY.p8'; // Path to downloaded .p8 file

const privateKey = createPrivateKey(readFileSync(PRIVATE_KEY_PATH));

const secret = await new SignJWT({})
  .setProtectedHeader({ alg: 'ES256', kid: KEY_ID })
  .setIssuedAt()
  .setIssuer(TEAM_ID)
  .setAudience('https://appleid.apple.com')
  .setSubject(CLIENT_ID)
  .setExpirationTime('180d') // Max 6 months
  .sign(privateKey);

console.log('AUTH_APPLE_SECRET=', secret);
```

```bash
node scripts/generate-apple-secret.mjs
```

Copy the output JWT as `AUTH_APPLE_SECRET`. **Regenerate this every 6 months.**

> Docs: [Generate and validate tokens — Apple](https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens)

### 2.2 Environment Variables

```env
# apps/web/.env.local (development)
AUTH_APPLE_ID=live.fintrack.web
AUTH_APPLE_SECRET=<JWT from generate-apple-secret.mjs>
```

```env
# Render → fintrack-web → Settings → Environment (production)
AUTH_APPLE_ID=live.fintrack.web
AUTH_APPLE_SECRET=<JWT from generate-apple-secret.mjs>
```

### 2.3 Code Changes Required

#### 1 — `apps/web/src/env.js`

Add Apple vars to the schema:

```javascript
server: {
  // existing...
  AUTH_GOOGLE_ID: z.string(),
  AUTH_GOOGLE_SECRET: z.string(),

  // add:
  AUTH_APPLE_ID: z.string().optional(),
  AUTH_APPLE_SECRET: z.string().optional(),
},

runtimeEnv: {
  // existing...
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,

  // add:
  AUTH_APPLE_ID: process.env.AUTH_APPLE_ID,
  AUTH_APPLE_SECRET: process.env.AUTH_APPLE_SECRET,
},
```

#### 2 — `packages/next_auth/src/config.ts`

Add Apple to `AuthEnv`, import the provider, add to providers array, and handle in `signIn` callback:

```typescript
import AppleProvider from 'next-auth/providers/apple';

export interface AuthEnv {
  AUTH_SECRET: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
  AUTH_APPLE_ID?: string; // add
  AUTH_APPLE_SECRET?: string; // add
  API_GATEWAY_URL: string;
  JWT_ACCESS_TOKEN_EXPIRATION: string;
}
```

In `createAuthConfig`, add Apple to the providers array:

```typescript
providers: [
  GoogleProvider({
    clientId: env.AUTH_GOOGLE_ID,
    clientSecret: env.AUTH_GOOGLE_SECRET,
  }),

  // Add Apple provider (only if env vars are present):
  ...(env.AUTH_APPLE_ID && env.AUTH_APPLE_SECRET
    ? [
        AppleProvider({
          clientId: env.AUTH_APPLE_ID,
          clientSecret: env.AUTH_APPLE_SECRET,
        }),
      ]
    : []),

  CredentialsProvider({ /* existing */ }),
],
```

In the `signIn` callback, add the Apple handler alongside Google:

```typescript
async signIn({ user, account }) {
  if (account?.provider === 'google') {
    // existing Google handler...
  }

  // Add Apple handler:
  if (account?.provider === 'apple') {
    try {
      const response = await fetch(`${env.API_GATEWAY_URL}/auth/oauth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name,   // ⚠️ Only present on FIRST login — see note below
          image: user.image, // Apple does not provide an avatar
          apple_id: account.providerAccountId,
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      user.id = data.user.id;
      user.access_token = data.accessToken;
      user.refresh_token = data.refreshToken;
      user.name = `${data.user.firstName} ${data.user.lastName}`;

      return true;
    } catch (error) {
      console.error('Apple OAuth sync failed:', error);
      return false;
    }
  }

  if (account?.provider === 'credentials') return true;
  return false;
},
```

#### 3 — `apps/web/src/lib/nextauth/index.ts`

Pass the Apple env vars to `initAuth`:

```typescript
const { auth, handlers, signIn, signOut } = initAuth(
  {
    AUTH_SECRET: env.AUTH_SECRET,
    AUTH_GOOGLE_ID: env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: env.AUTH_GOOGLE_SECRET,
    AUTH_APPLE_ID: env.AUTH_APPLE_ID, // add
    AUTH_APPLE_SECRET: env.AUTH_APPLE_SECRET, // add
    API_GATEWAY_URL: env.API_GATEWAY_URL,
    JWT_ACCESS_TOKEN_EXPIRATION: env.JWT_ACCESS_TOKEN_EXPIRATION,
  },
  { parseJwtExpiration },
);
```

#### 4 — Backend: `/auth/oauth/apple` endpoint

The `api_gateway` needs a new route that mirrors the Google OAuth endpoint. The auth_service needs to handle Apple user upserts. The key difference from Google:

- Apple does **not** provide a profile photo
- The `name` field is **only sent on first login** — the backend must store it on first upsert and not overwrite with `null` on subsequent logins
- Apple may provide a private relay email (`xxxx@privaterelay.appleid.com`) if the user chose to hide their email

---

## Part 3 — Local Development with HTTPS (required for Apple)

Apple's OAuth requires HTTPS for redirect URIs — `localhost` does not work. Google accepts `localhost` so this is Apple-only.

### Option A — ngrok (recommended)

```bash
# Install
brew install ngrok

# Expose local port 3000 over HTTPS
ngrok http 3000
```

ngrok gives you a URL like `https://abc123.ngrok.io`. Add this to:

1. Apple Services ID → Return URLs: `https://abc123.ngrok.io/api/auth/callback/apple`
2. Apple Services ID → Domains: `abc123.ngrok.io`
3. Your `.env.local`:
   ```env
   NEXTAUTH_URL=https://abc123.ngrok.io
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

> ngrok free tier generates a new subdomain each restart. For stable dev URLs use a paid ngrok account or a static subdomain.

### Option B — Local HTTPS with mkcert

```bash
brew install mkcert
mkcert -install
mkcert localhost

# Outputs: localhost.pem + localhost-key.pem
```

Then configure Next.js to serve HTTPS locally by creating a `server.mjs`:

```javascript
// server.mjs
import { createServer } from 'https';
import { readFileSync } from 'fs';
import next from 'next';

const app = next({ dev: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(
    {
      key: readFileSync('./localhost-key.pem'),
      cert: readFileSync('./localhost.pem'),
    },
    handle,
  ).listen(3000, () => {
    console.log('> Ready on https://localhost:3000');
  });
});
```

```bash
node server.mjs
```

Apple's domain verification requires a publicly accessible URL, so **ngrok is the better option for local Apple OAuth testing**.

---

## Part 4 — Apple-Specific Gotchas

| Behaviour                         | Detail                                                                                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User data only on first login** | Apple only sends `name` and `email` in the OAuth callback during the very first sign-in. Subsequent logins only return `apple_id`. The backend must persist the name on first upsert.        |
| **Private relay email**           | If the user taps "Hide My Email", Apple sends a relay address (`xxxx@privaterelay.appleid.com`). This is a real email that forwards to the user. Treat it as a real email — do not block it. |
| **No avatar**                     | Apple does not provide a profile photo. Show a generated avatar (initials) instead.                                                                                                          |
| **Client secret expiry**          | The JWT client secret (`AUTH_APPLE_SECRET`) expires in up to 6 months. Set a calendar reminder to regenerate it. If it expires, Apple logins silently fail.                                  |
| **HTTPS mandatory**               | Apple requires HTTPS for all redirect URIs — including in development. Use ngrok or mkcert locally.                                                                                          |
| **One key download**              | The `.p8` private key can only be downloaded once. Store it securely (1Password, AWS Secrets Manager, etc.).                                                                                 |

---

## Part 5 — Environment Variables Summary

### `apps/web/.env.local` (development)

```env
AUTH_SECRET=<same-long-random-string-as-jwt-secret>

AUTH_GOOGLE_ID=<from Google Cloud Console>
AUTH_GOOGLE_SECRET=<from Google Cloud Console>

AUTH_APPLE_ID=live.fintrack.web
AUTH_APPLE_SECRET=<JWT from generate-apple-secret.mjs>

API_GATEWAY_URL=http://localhost:4001
NEXT_PUBLIC_APP_URL=http://localhost:3000   # or ngrok URL if testing Apple
```

### Render `fintrack-web` service (production)

| Variable              | Value                                      |
| --------------------- | ------------------------------------------ |
| `AUTH_SECRET`         | Same value as `JWT_SECRET` in auth_service |
| `AUTH_GOOGLE_ID`      | From Google Cloud Console                  |
| `AUTH_GOOGLE_SECRET`  | From Google Cloud Console                  |
| `AUTH_APPLE_ID`       | `live.fintrack.web` (your Services ID)     |
| `AUTH_APPLE_SECRET`   | JWT from `generate-apple-secret.mjs`       |
| `API_GATEWAY_URL`     | Render internal URL of api_gateway         |
| `NEXT_PUBLIC_APP_URL` | `https://app.fintrack.live`                |

---

## Part 6 — Redirect URI Quick Reference

| Provider | Environment | Redirect URI                                                 |
| -------- | ----------- | ------------------------------------------------------------ |
| Google   | Development | `http://localhost:3000/api/auth/callback/google`             |
| Google   | Production  | `https://app.fintrack.live/api/auth/callback/google`         |
| Apple    | Development | `https://<ngrok-subdomain>.ngrok.io/api/auth/callback/apple` |
| Apple    | Production  | `https://app.fintrack.live/api/auth/callback/apple`          |

---

## Part 7 — Checklist

### Google

- [ ] Google Cloud project created
- [ ] Google Identity Toolkit API + People API enabled
- [ ] OAuth consent screen configured (External, scopes: email, profile, openid)
- [ ] OAuth credentials created with correct redirect URIs
- [ ] `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` set in `.env.local`
- [ ] Same vars set on Render for production

### Apple

- [ ] App ID created with Sign in with Apple capability (`live.fintrack.app`)
- [ ] Services ID created (`live.fintrack.web`)
- [ ] Services ID configured with correct domains and return URLs
- [ ] Private Key generated and `.p8` file securely stored
- [ ] `generate-apple-secret.mjs` run — JWT stored as `AUTH_APPLE_SECRET`
- [ ] Calendar reminder set for secret regeneration (every ~5 months)
- [ ] Code changes made (env.js, config.ts, nextauth/index.ts)
- [ ] Backend `/auth/oauth/apple` endpoint implemented
- [ ] Apple tested locally with ngrok HTTPS URL
- [ ] `AUTH_APPLE_ID` and `AUTH_APPLE_SECRET` set on Render for production
