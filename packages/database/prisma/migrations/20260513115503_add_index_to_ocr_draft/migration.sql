-- DropIndex
DROP INDEX "OCRDraft_imageKey_idx";

-- CreateIndex
CREATE INDEX "OCRDraft_userId_imageKey_idx" ON "OCRDraft"("userId", "imageKey");
