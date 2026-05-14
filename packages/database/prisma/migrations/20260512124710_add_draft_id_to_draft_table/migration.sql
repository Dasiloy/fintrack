/*
  Warnings:

  - A unique constraint covering the columns `[draftId]` on the table `OCRDraft` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `draftId` to the `OCRDraft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OCRDraft" ADD COLUMN     "draftId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OCRDraft_draftId_key" ON "OCRDraft"("draftId");
