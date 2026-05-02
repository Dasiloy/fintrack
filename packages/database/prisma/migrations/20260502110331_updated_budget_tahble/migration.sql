-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "alertAtFrequency" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "alertedAt" TIMESTAMP(3);
