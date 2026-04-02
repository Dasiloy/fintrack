/*
  Warnings:

  - A unique constraint covering the columns `[userId,source,sourceId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,bankTransactionId,monoBankAccountId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Made the column `sourceId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "sourceId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_source_sourceId_key" ON "Transaction"("userId", "source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_bankTransactionId_monoBankAccountId_key" ON "Transaction"("userId", "bankTransactionId", "monoBankAccountId");
