# Database Migrations — Developer Guide

FinTrack uses **Prisma Migrate** with a two-database strategy: a local dev database for day-to-day development, and a separate production database managed via GitHub Actions on every merge to `main`.

---

## How the Pipeline Works

When a PR is merged to `main`, two things happen **simultaneously**:

1. **GitHub Actions** runs `prisma migrate deploy` against the production database using `PROD_DATABASE_URL` and `PROD_DATABASE_CA_CERTIFICATE` secrets.
2. **Render** detects the Git push and starts deploying the new application code.

Because they run in parallel, there is a window — typically 30 seconds to a few minutes — where the **old code is still serving traffic against the already-migrated schema**. This means every migration must leave the old code fully functional. The rule is simple: **migrations must be additive only**.

---

## Creating a Migration (Local Dev)

```bash
# After editing packages/database/prisma/schema.prisma:
pnpm --filter @fintrack/database exec prisma migrate dev --name describe_your_change

# Regenerate the Prisma client after the migration:
pnpm --filter @fintrack/database exec prisma generate
```

`migrate dev` creates a new timestamped SQL file under `packages/database/prisma/migrations/`. Commit both the schema change and the migration file.

> Never run `prisma migrate dev` against production. The CI/CD pipeline uses `prisma migrate deploy` (applies existing migrations only — never creates new ones).

---

## ✅ Safe — Additive Migrations

These can be deployed in a single release.

### Add a nullable column

```prisma
// Adding phone to User
model User {
  phone String? // new — nullable, old code ignores it safely
}
```

### Add a column with a default

```prisma
// Adding a risk level to Goal
model Goal {
  riskLevel String @default("MEDIUM") // NOT NULL with DEFAULT is safe
}
```

Postgres fills the default for all existing rows at migration time. Old code that doesn't know about `riskLevel` simply ignores it.

### Add a new table

`UserBalance` and `MonthlyBalanceSnapshot` are the live example — entirely new tables with a foreign key to `User`. Old code made no reference to them. Adding them was zero-risk.

### Add a new index

```prisma
@@index([userId, type]) // on Transaction — improves queries, never breaks reads/writes
```

### Add a new enum value

```prisma
enum RecurringItemFrequency {
  // ... existing values
  BIANNUAL // safe to add — old code just won't produce rows with this value
}
```

---

## ❌ Unsafe — Use the Two-Release Strategy

These changes break the old code if applied while it is still running.

### Dropping a column

**Example:** removing `notes` from `Transaction` (currently `String?` in the schema).

| Release           | Schema                                          | Code                                             |
| ----------------- | ----------------------------------------------- | ------------------------------------------------ |
| **N — Deprecate** | Keep `notes` column                             | Stop reading/writing `notes` in application code |
| **N+1 — Drop**    | `ALTER TABLE "Transaction" DROP COLUMN "notes"` | Column is gone; code already doesn't use it      |

If you drop the column in the same release that removes the code, the old code (still running during the deploy window) tries to write `notes` and gets a Postgres column-not-found error on every transaction write.

---

### Renaming a column

**Example:** renaming `alertThreshold` → `alertPercent` on `Budget`.

| Release | Migration                                                            | Code                           |
| ------- | -------------------------------------------------------------------- | ------------------------------ |
| **N**   | Add `alertPercent FLOAT DEFAULT 0.8`, backfill from `alertThreshold` | Write to both columns          |
| **N+1** | Drop `alertThreshold`                                                | Read/write only `alertPercent` |

---

### Changing a column type

**Example:** changing `Budget.amount` from `Float` to `Decimal(20,2)` (like `UserBalance`).

| Release | Migration                                              | Code                                     |
| ------- | ------------------------------------------------------ | ---------------------------------------- |
| **N**   | Add `amountDecimal DECIMAL(20,2)`, backfill            | Write to both; read from `amountDecimal` |
| **N+1** | Drop `amount Float`, rename `amountDecimal` → `amount` | Single column                            |

---

### Adding NOT NULL without a default

```sql
-- ❌ Fails immediately if Transaction has any rows
ALTER TABLE "Transaction" ADD COLUMN "referenceCode" TEXT NOT NULL;
```

| Release | Migration                                   | Code                                             |
| ------- | ------------------------------------------- | ------------------------------------------------ |
| **N**   | Add `referenceCode TEXT` (nullable)         | Backfill existing rows, write on all new creates |
| **N+1** | `ALTER COLUMN "referenceCode" SET NOT NULL` | Constraint is safe — all rows are filled         |

---

## Quick Reference

| Operation                      | Safe in one release? |
| ------------------------------ | -------------------- |
| Add nullable column            | ✅                   |
| Add column with `DEFAULT`      | ✅                   |
| Add new table                  | ✅                   |
| Add index                      | ✅                   |
| Add enum value                 | ✅                   |
| Drop column                    | ❌ Two releases      |
| Rename column                  | ❌ Two releases      |
| Change column type             | ❌ Two releases      |
| Add `NOT NULL` with no default | ❌ Two releases      |
| Remove enum value              | ❌ Two releases      |
