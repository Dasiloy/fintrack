/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionId]` on the table `Split` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[monoBankAccountId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetAmount` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetDate` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `RecurringItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `RecurringItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency` to the `RecurringItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextRunAt` to the `RecurringItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `RecurringItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `RecurringItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RecurringItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `Split` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Split` table without a default value. This is not possible if the table is not empty.
  - Made the column `categoryId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY');

-- CreateEnum
CREATE TYPE "OCRDraftStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'BANK', 'RECURRING', 'OCR', 'SPLIT');

-- CreateEnum
CREATE TYPE "BankTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RecurringItemFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Goalstatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SplitStatus" AS ENUM ('OPEN', 'PARTIALLY_SETTLED', 'SETTLED');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";

-- DropIndex
DROP INDEX "Transaction_type_categoryId_userId_idx";

-- DropIndex
DROP INDEX "Transaction_userId_idx";

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
ADD COLUMN     "carryOver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "period" "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" "Goalstatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "targetAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "targetDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RecurringItem" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "frequency" "RecurringItemFrequency" NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "merchant" TEXT,
ADD COLUMN     "nextRunAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "type" "TransactionType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Split" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "SplitStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "bankTransactionId" TEXT,
ADD COLUMN     "bankTransactionStatus" "BankTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "merchant" TEXT,
ADD COLUMN     "monoBankAccountId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "source" "TransactionSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceData" JSONB,
ADD COLUMN     "sourceId" TEXT,
ALTER COLUMN "categoryId" SET NOT NULL;

-- CreateTable
CREATE TABLE "BudgetHistory" (
    "id" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "budgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OCRDraft" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "merchant" TEXT,
    "imageKey" TEXT NOT NULL,
    "status" "OCRDraftStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION,
    "faliureReason" TEXT,
    "rawData" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OCRDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalContribution" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "goalId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitParticipant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "splitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitSettlement" (
    "id" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "splitId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SplitSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonoBankAccount" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "bankLogoUrl" TEXT,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountBalance" DOUBLE PRECISION NOT NULL,
    "accountCurrency" "Currency" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonoBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetHistory_budgetId_startDate_idx" ON "BudgetHistory"("budgetId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "OCRDraft_imageKey_key" ON "OCRDraft"("imageKey");

-- CreateIndex
CREATE INDEX "OCRDraft_userId_status_idx" ON "OCRDraft"("userId", "status");

-- CreateIndex
CREATE INDEX "OCRDraft_imageKey_idx" ON "OCRDraft"("imageKey");

-- CreateIndex
CREATE UNIQUE INDEX "GoalContribution_transactionId_key" ON "GoalContribution"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "MonoBankAccount_accountId_key" ON "MonoBankAccount"("accountId");

-- CreateIndex
CREATE INDEX "MonoBankAccount_userId_accountId_idx" ON "MonoBankAccount"("userId", "accountId");

-- CreateIndex
CREATE INDEX "Budget_userId_categoryId_period_idx" ON "Budget"("userId", "categoryId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Split_transactionId_key" ON "Split"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_monoBankAccountId_key" ON "Transaction"("monoBankAccountId");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_source_idx" ON "Transaction"("userId", "source");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_idx" ON "Transaction"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "Transaction_monoBankAccountId_bankTransactionId_idx" ON "Transaction"("monoBankAccountId", "bankTransactionId");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetHistory" ADD CONSTRAINT "BudgetHistory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OCRDraft" ADD CONSTRAINT "OCRDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_monoBankAccountId_fkey" FOREIGN KEY ("monoBankAccountId") REFERENCES "MonoBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringItem" ADD CONSTRAINT "RecurringItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalContribution" ADD CONSTRAINT "GoalContribution_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalContribution" ADD CONSTRAINT "GoalContribution_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Split" ADD CONSTRAINT "Split_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitParticipant" ADD CONSTRAINT "SplitParticipant_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "Split"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "Split"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "SplitParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSettlement" ADD CONSTRAINT "SplitSettlement_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonoBankAccount" ADD CONSTRAINT "MonoBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
