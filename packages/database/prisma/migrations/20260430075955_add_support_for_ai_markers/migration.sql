/*
  Warnings:

  - A unique constraint covering the columns `[userId,narration]` on the table `ClassificationCorrection` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "aiClassified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "ClassificationCorrection_userId_narration_key" ON "ClassificationCorrection"("userId", "narration");
