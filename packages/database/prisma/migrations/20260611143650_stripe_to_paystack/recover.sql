-- Recovery script for migration 20260611143650_stripe_to_paystack
--
-- Context: The BEGIN...COMMIT enum block at the top of migration.sql already
-- committed successfully in production. The migration then failed at:
--   DROP INDEX "Subscription_stripeCustomerId_key"  (error 42704 — index does not exist)
-- Everything from that line onwards never ran.
--
-- This script applies exactly those remaining steps with IF EXISTS / IF NOT EXISTS
-- guards so it is safe to run even if some steps already landed.
--
-- Run this manually on the prod DB, then mark the migration applied:
--   prisma migrate resolve --applied "20260611143650_stripe_to_paystack"

-- DropIndex (use IF EXISTS — these may not exist, which is what caused the failure)
DROP INDEX IF EXISTS "Subscription_stripeCustomerId_key";
DROP INDEX IF EXISTS "Subscription_stripeSubscriptionId_key";

-- AlterTable — drop stripe columns, add paystack columns
-- Subscription table is empty (rows were deleted before the migration run),
-- so the NOT NULL column paystackPlanCode is safe without a pre-existing default.
ALTER TABLE "Subscription"
  DROP COLUMN IF EXISTS "stripeCancelAtPeriodEnd",
  DROP COLUMN IF EXISTS "stripeCurrentPeriodEnd",
  DROP COLUMN IF EXISTS "stripeCurrentPeriodStart",
  DROP COLUMN IF EXISTS "stripeCustomerId",
  DROP COLUMN IF EXISTS "stripePriceId",
  DROP COLUMN IF EXISTS "stripeSubscriptionId";

ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "paystackCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "paystackCurrentPeriodEnd"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paystackCurrentPeriodStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "paystackCustomerCode"      TEXT,
  ADD COLUMN IF NOT EXISTS "paystackPlanCode"          TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "paystackSubscriptionCode"  TEXT;

-- DropTable
DROP TABLE IF EXISTS "StripeWebhookEvent";

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaystackWebhookEvent" (
    "id"          TEXT NOT NULL,
    "eventId"     TEXT NOT NULL,
    "eventType"   TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaystackWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PaystackWebhookEvent_eventId_key"
  ON "PaystackWebhookEvent"("eventId");

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_paystackCustomerCode_key"
  ON "Subscription"("paystackCustomerCode");

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_paystackSubscriptionCode_key"
  ON "Subscription"("paystackSubscriptionCode");
