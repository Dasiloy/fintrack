/*
  Warnings:

  - You are about to drop the column `bankLogoUrl` on the `MonoBankAccount` table. All the data in the column will be lost.
  - Added the required column `bankName` to the `MonoBankAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MonoBankAccount" DROP COLUMN "bankLogoUrl",
ADD COLUMN     "bankName" TEXT NOT NULL;
