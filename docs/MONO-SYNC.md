# Mono Bank Account Sync — Architecture

## Overview

Mono is used for bank account linking and automatic transaction syncing.
The integration is split into two distinct phases: **account linking** and **transaction syncing**.
These are intentionally decoupled — linking a bank account does not trigger a transaction import.

---

## Account Linking Flow

1. User opens the Mono Connect widget on the FE (`useMonoConnect.linkAccount`)
2. On success, the widget returns a short-lived `code`
3. FE calls `POST /api/transaction/account/link` with the `code`
4. BE exchanges the code for a permanent `accountId` via `POST https://api.withmono.com/v2/accounts/auth`
5. Mono fires `mono.events.account_connected` — no account data, just an internal ID. Handled as log-only.
6. Mono fires `mono.events.account_updated` with full account snapshot
7. BE creates the `MonoBankAccount` record with `lastSyncedAt = now` (the moment of linking)

### Race Condition Handling

Mono fires the webhook **before** the FE sends the code to BE.
A bi-directional Redis buffer resolves this:

- `mono:pending_user:{accountId}` — set by `/link` with TTL 350s, consumed by the webhook
- `mono:pending_account:{accountId}` — set by the webhook with TTL 350s, consumed by `/link`

Whichever side arrives second reads and deletes the buffered value and creates the record.

### `MonoBankAccount` State After Linking

| Field          | Value          |
| -------------- | -------------- |
| `status`       | from Mono meta |
| `lastSyncedAt` | `now`          |

`lastSyncedAt` is always set at link time. No transactions are fetched at this point.
No persistent banner is shown on the FE after linking.

---

## Account Status — `dataStatus`

`isActive` is replaced with Mono's `meta.data_status` mirrored as `dataStatus` on `MonoBankAccount`.

| `dataStatus`  | Meaning                                       | Transaction Sync |
| ------------- | --------------------------------------------- | ---------------- |
| `AVAILABLE`   | Account is healthy and data is accessible     | Proceed          |
| `PARTIAL`     | Some data may be missing or stale             | Proceed          |
| `UNAVAILABLE` | Session expired, bank blocked, or error state | Skip entirely    |

When `account_updated` fires and `dataStatus` is `UNAVAILABLE`, skip the sync job entirely.
The user needs to re-authenticate — surfaced on the FE via the account's status field.

---

## Transaction Sync Flow

### Design Decision

- No transaction sync happens on initial account link
- No historical import, no date picker — `lastSyncedAt` is set to `now` at link time
- All syncs (manual or webhook) are **incremental from `lastSyncedAt`**
- The FE shows no persistent banner after linking

---

## Sync Trigger Sources

### 1. Webhook-Triggered Sync (`mono.events.account_updated`)

```
Webhook fires
  → update MonoBankAccount (balance, name, accountNumber, dataStatus)
  → if dataStatus is UNAVAILABLE: skip transaction sync
  → else: queue sync job with startDate = lastSyncedAt
  → return 200 immediately (Mono doesn't wait for job result)
```

### 2. Manual Sync (FE button)

```
POST /api/transaction/account/:accountId/sync
  → guard: verify account belongs to user
  → if dataStatus is UNAVAILABLE: 400 "Account session expired, please re-authenticate"
  → queue sync job with startDate = lastSyncedAt, priority: high
  → return 202 "Sync started"
  → on job complete: push realtime notification to user via websocket
```

---

## Why BullMQ for Sync

The transaction fetch from Mono is paginated and unbounded — it could be tens or hundreds of API calls for active accounts. Doing this inline would:

- Timeout on the HTTP response
- Have no retry on partial failure
- Give no visibility into the job state

With BullMQ:

- Webhook returns 200 immediately (Mono doesn't retry)
- Manual sync returns 202 immediately, FE is notified via websocket when done
- Failed jobs retry automatically with backoff
- If the process crashes mid-sync, the job is requeued

**What we tell the user on manual sync:** Return `202 Accepted` with `{ message: "Sync started" }`. When the processor completes, push a realtime event through the existing websocket infrastructure — same pattern as analytics notifications.

---

## Sync Job (BullMQ — `MONO_SYNC_QUEUE`)

**Job payload:**

```ts
{
  accountId: string; // Mono accountId
  monoAccountDbId: string; // MonoBankAccount.id (PK)
  userId: string;
  startDate: string; // ISO date — lastSyncedAt at time of job creation
}
```

**Processor (`MonoSyncProcessor`):**

1. Check `dataStatus` — skip if `UNAVAILABLE`
2. Load all categories for the user (`userId = ? OR isSystem = true`) — once per job, reused across all pages
3. Fetch paginated transactions from Mono `GET /v2/accounts/{accountId}/transactions?start={startDate}`
4. For each transaction: call `resolveCategory(tx, categories)` → get `categorySlug`
5. For each page: call finance_service via gRPC → `upsertBankTransaction` batch (idempotent)
6. Continue pagination until `meta.next` is null
7. Update `MonoBankAccount.lastSyncedAt = now`
8. Push realtime notification to user (sync complete + count of new transactions)
9. On failure: BullMQ retries up to 3x with exponential backoff

**Idempotency:**
Transactions are upserted by `@@unique([userId, bankTransactionId, monoBankAccountId])` — safe to re-run.

---

## Auto-Categorization

### Why it can't live in `@fintrack/types`

Categories are not static. Each user can create their own categories alongside system defaults (`isSystem: true`). A global keyword→slug map in the types package would only ever know about system slugs — it would miss any category the user created. Categorization must run at job time with the user's actual category list.

### Where it lives

`resolveCategory(tx: MonoTransaction, categories: Category[]): string` — a private method on `MonoSyncProcessor`.

### Resolution order

**Step 1 — Load user's category list once per sync job**

At the start of each job, fetch all categories available to the user:
```
WHERE userId = {userId} OR isSystem = true
```
This gives both system defaults and any custom categories the user created.

**Step 2 — Mono category → slug (when not `unknown`)**

Mono provides a `category` field on each transaction. Map it to a slug that exists in the user's category list:

```
mono category     →  preferred slug to look up
─────────────────────────────────────────────
salary            →  cat-income
bills_and_utilities → cat-utilities
food_and_drinks   →  cat-food
transport         →  cat-transport
bank_charges      →  cat-misc
entertainment     →  cat-misc
groceries         →  cat-food
health_and_beauty →  cat-health
insurance         →  cat-misc
investment        →  cat-misc
loan_repayment    →  cat-misc
savings           →  cat-misc
shopping          →  cat-shopping
top_up            →  cat-misc
transfer          →  cat-misc
tax               →  cat-misc
mortgage          →  cat-housing
retail            →  cat-shopping
gambling          →  cat-misc
unknown           →  (skip, go to step 3)
```

After mapping, verify the resolved slug actually exists in the user's loaded categories.
If it doesn't exist (user deleted the system category or their categories differ), fall through to step 3.

**Step 3 — Keyword match on `narration` (for `unknown` or unresolved slugs)**

Check the lowercased narration against a ranked keyword list.
The list is defined inside `MonoSyncProcessor` — not in the types package.
First match wins:

```
Keywords (examples)                          →  slug
─────────────────────────────────────────────────────
salary, payroll, wages, credit alert         →  cat-income
uber, bolt, taxify, keke, okada, brt         →  cat-transport
shoprite, spar, market, grocery, supermarket →  cat-food
kfc, chicken republic, dominos, restaurant   →  cat-food
hospital, pharmacy, clinic, medic, health    →  cat-health
dstv, gotv, netflix, spotify, showmax        →  cat-misc
mtn, airtel, glo, 9mobile, airtime, data     →  cat-misc
rent, landlord, property, estate             →  cat-housing
shoprite (non-food), jumia, konga, amazon    →  cat-shopping
transfer, nip, neft, naps                    →  cat-misc
pos, atm, withdrawal, bank charge            →  cat-misc
```

After matching, again verify the resolved slug exists in the user's loaded categories.
If the user has a custom slug that overlaps (e.g. they named their category "bolt-rides" instead of "transport"), the keyword match will fail to find "transport" and fall through.

**Step 4 — Fallback**

If no match found in steps 2 or 3, assign `cat-misc`.
This is the guaranteed system fallback — always exists, always resolvable.
The user can re-categorize from the transaction list.

### Summary

```
MonoTransaction
  ├─ category != 'unknown'  →  map to slug  →  verify in user categories  →  use it
  │                                                      ↓ not found
  ├─ category == 'unknown'  →  keyword match narration  →  verify in user categories  →  use it
  │                                                      ↓ not found
  └─ fallback  →  'uncategorized'
```

---

## Finance Service — `upsertBankTransaction` gRPC Method

**Input:**

- Standard transaction fields (amount, date, description, type mapped from debit/credit)
- `bankTransactionId` — Mono's transaction ID
- `monoBankAccountId` — FK to `MonoBankAccount.id`
- `source: BANK`
- `categorySlug` — resolved by `MonoSyncProcessor.resolveCategory` before the gRPC call

**Behaviour:** upsert — create if not exists, skip update if already exists (bank transactions are immutable once imported).

---

## `MonoBankAccount` Lifecycle Summary

| Event                               | `dataStatus`   | `lastSyncedAt`                 |
| ----------------------------------- | -------------- | ------------------------------ |
| Account linked                      | from Mono meta | set to `now`                   |
| `account_updated` — healthy         | `AVAILABLE`    | updated to `now` after sync    |
| `account_updated` — degraded        | `PARTIAL`      | updated to `now` after sync    |
| `account_updated` — session gone    | `UNAVAILABLE`  | unchanged, sync skipped        |
| Reauth complete (`/account/relink`) | `AVAILABLE`    | unchanged (next webhook syncs) |

---

## What Needs to Be Built

1. `MONO_SYNC_QUEUE` — BullMQ queue registration in `TransactionModule`
2. `MonoSyncProcessor` — paginated Mono fetch + gRPC upsert batch + `lastSyncedAt` update + realtime notification
3. `POST /api/transaction/account/:accountId/sync` — manual sync endpoint (returns 202)
4. `upsertBankTransaction` gRPC method in finance_service (proto + service + controller)
5. FE: "Sync" button on bank account card — shows last synced time, disabled if `UNAVAILABLE`
6. FE: realtime notification handler for sync completion event
