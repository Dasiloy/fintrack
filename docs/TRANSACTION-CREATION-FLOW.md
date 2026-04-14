# Transaction Creation Flow

> UI rules: follow `docs/UI.md` non-negotiables throughout.
> Design system: follow `docs/DESIGN-SYSTEM.md` tokens and style language.

---

## Overview

Three methods of creating a transaction. Each gets a UI surface proportional to its complexity.

| Method           | Surface                  | Route                |
| ---------------- | ------------------------ | -------------------- |
| Manual           | Right-side Sheet         | (no route change)    |
| OCR scan         | Dedicated page (stepper) | `/transactions/scan` |
| Mono bank import | Dedicated page           | `/finances/accounts` |

---

## Entry Point — Method Chooser

Single `+` / "Add Transaction" button in the transaction list controls bar.

**Responsive behaviour:**

- **Mobile** → opens a bottom `Sheet` with three option cards
- **Desktop** → opens an `AnchoredPopover` / `DropdownMenu` anchored to the button

Both surfaces show the same three options. No page navigation for the chooser itself.

**Options:**

1. Manual entry → open `TransactionSheet` (right-side)
2. Scan receipt → `router.push('/finances/transactions/scan')`
3. Import from bank → `router.push('/finances/accounts')`

**UI rules (from `docs/UI.md`):**

- Every option must have hover/focus/active state
- Use design-system primitives from the `ui` package
- No prop drilling — sheet open state is self-contained inside the chooser component

---

## Section 1 — Manual Entry (TransactionSheet)

Convert the existing `TransactionFormDialog` from a `Dialog` to a right-side `Sheet`.

**Fields:** amount, type (INCOME/EXPENSE toggle), category, date (calendar picker), merchant, description.

**Behaviour:**

- `Sheet` opens from the right, `sm:max-w-md`
- Form submit calls `transaction.create` tRPC mutation
- On success: toast + invalidate `transaction.getAll` + close sheet
- `sourceId` generated as `trnx_${Math.random().toString(36).slice(2, 10)}`
- Amount: `type="text" inputMode="decimal"` + `onlyNumbers()` util

**Component location:** `apps/web/src/app/(dashboard)/finances/transactions/_components/transaction_sheet.tsx`

---

## Section 2 — OCR Scan (`/transactions/scan`)

Page with a three-step linear stepper. No sheets inside this flow.

### Step 1 — Upload

- File input (accept: image/\*, application/pdf) + drag-and-drop zone
- Camera capture option on supported devices
- "Next" triggers upload to BE, transitions to Step 2

### Step 2 — Scanning

- Receipt preview (thumbnail) on one side
- Animated scanning indicator (continuous, not a spinner — a scan-line animation) on the other
- FE polls the draft endpoint or listens for a push event
- User can cancel → goes back to Step 1
- No submit action here; transition to Step 3 is automatic when BE responds

**BE contract:** upload returns a `draftId`. FE polls `transaction.getDraft({ draftId })` until status is `READY`.// polling or websocket??

### Step 3 — Review & Confirm

- Pre-filled form with extracted values (amount, merchant, date, category best-guess)
- All fields editable inline (same field set as manual entry)
- Submit calls `transaction.confirmDraft({ draftId, ...edits })` or `transaction.create` with pre-filled data
- On success: toast + navigate back to `/transactions`

**Component location:** `apps/web/src/app/(dashboard)/finances/transactions/scan/`

- `page.tsx` — server component shell, `'use client'` stepper component imported
- `_components/scan_stepper.tsx` — stepper state machine
- `_components/upload_step.tsx`
- `_components/scanning_step.tsx`
- `_components/review_step.tsx`

**UI rules:**

- Stepper progress shown at top (step indicators, not a progress bar)
- Loading/scanning state must be structurally and visually as polished as the data state (UI.md rule 11)
- Use `next/image` for receipt preview thumbnail

---

## Section 3 — Linked Accounts (`/finances/accounts`)

Dedicated page for all linked Mono bank accounts.

### Page layout

```
Header: "Linked Accounts"                [+ Link Account]  ← triggers mono link hook
─────────────────────────────────────────────────────────
Account card (per linked account)
  Bank name · Account number · Account type
  Last synced: Apr 12, 2026
                                        [Relink]  [Sync]
```

### Actions

| Action       | Where                 | Hook/Mutation                                          |
| ------------ | --------------------- | ------------------------------------------------------ |
| Link Account | Page-level CTA button | existing mono link hook from dashboard                 |
| Relink       | Per-card button       | existing mono relink hook                              |
| Sync         | Per-card button       | `transaction.syncAccount({ accountId })` tRPC mutation |

- **Link Account** — top-right CTA, not on any card. Adds a new card when complete.
- **Relink** — only shown when connection status is broken/expired. Triggers relink hook.
- **Sync** — triggers sync for that specific account. Shows inline loading state on the card (not a page-level spinner). On success: toast "X transactions synced" + invalidate `transaction.getAll`.
- Mono push events (already handled on BE) require no manual trigger.

### Empty state

When no accounts are linked: centered illustration + "No linked accounts" + prominent "Link Account" button.

### Component location

`apps/web/src/app/(dashboard)/finances/accounts/`

- `page.tsx`
- `_components/account_card.tsx`
- `_components/empty_accounts.tsx`

**UI rules:**

- Empty and loading states must be structurally equivalent to the data state (UI.md rule 11)
- Account cards use category-color-style accent for bank initial avatar (no icons)
- `cursor-pointer` on all interactive buttons
- All form controls follow design system height: `h-10` for inputs/selects

---

## Implementation Order

1. **Section 1** — `TransactionSheet` (Dialog → Sheet conversion, lowest risk)
2. **Section 3** — `/finances/accounts` page (self-contained, no new BE work)
3. **Section 2** — `/finances/transactions/scan` page (most complex, needs BE draft polling contract confirmed first)

---

## Shared Components Already Available

| Component                        | Path                                            |
| -------------------------------- | ----------------------------------------------- |
| `DrawerHeader` / `DrawerFooter`  | `apps/web/src/app/_components/drawer_ui.tsx`    |
| `AnchoredPopover`                | `packages/ui/src/components/shared`             |
| `inputCls`                       | `apps/web/src/app/_components/drawer_ui.tsx`    |
| `onlyNumbers`                    | `packages/utils/src/format.ts`                  |
| `formatCurrency` (en-NG)         | `packages/utils/src/format.ts`                  |
| `Calendar` + date picker pattern | `packages/ui/src/components/atoms/calendar.tsx` |
