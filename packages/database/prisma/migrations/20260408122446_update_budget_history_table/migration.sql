/*
  Warnings:

  - Added the required column `updatedAt` to the `BudgetHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BudgetHistory" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
