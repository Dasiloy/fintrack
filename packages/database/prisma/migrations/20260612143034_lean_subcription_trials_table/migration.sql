/*
  Warnings:

  - You are about to drop the column `isOnTrial` on the `SusbcriptionFreeTrials` table. All the data in the column will be lost.
  - You are about to drop the column `trialUsed` on the `SusbcriptionFreeTrials` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SusbcriptionFreeTrials" DROP COLUMN "isOnTrial",
DROP COLUMN "trialUsed";
