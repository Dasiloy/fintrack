/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `SplitSettlement` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SplitSettlement" ALTER COLUMN "transactionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SplitSettlement_transactionId_key" ON "SplitSettlement"("transactionId");
