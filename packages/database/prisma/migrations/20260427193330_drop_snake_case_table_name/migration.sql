/*
  Warnings:

  - You are about to drop the `classification_corrections` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "classification_corrections" DROP CONSTRAINT "classification_corrections_userId_fkey";

-- DropIndex
DROP INDEX "transactions_embedding_hnsw";

-- DropTable
DROP TABLE "classification_corrections";

-- CreateTable
CREATE TABLE "ClassificationCorrection" (
    "id" TEXT NOT NULL,
    "narration" TEXT NOT NULL,
    "correctedSlug" TEXT NOT NULL,
    "embedding" vector(1536),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassificationCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassificationCorrection_userId_idx" ON "ClassificationCorrection"("userId");

-- AddForeignKey
ALTER TABLE "ClassificationCorrection" ADD CONSTRAINT "ClassificationCorrection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
