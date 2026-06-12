-- AlterTable
ALTER TABLE "NotificationSetting" ADD COLUMN     "dailyInsightsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "paystackAuthorizationCode" TEXT,
ADD COLUMN     "paystackEmailToken" TEXT;

-- CreateTable
CREATE TABLE "SusbcriptionFreeTrials" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "userId" TEXT,
    "subscriptionId" TEXT,
    "trialStartsAt" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "isOnTrial" BOOLEAN NOT NULL DEFAULT true,
    "trialUsed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SusbcriptionFreeTrials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SusbcriptionFreeTrials_emailHash_key" ON "SusbcriptionFreeTrials"("emailHash");
