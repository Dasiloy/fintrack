/*
  Warnings:

  - You are about to drop the column `draftId` on the `OCRDraft` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "OCRDraft_draftId_key";

-- AlterTable
ALTER TABLE "OCRDraft" DROP COLUMN "draftId";
