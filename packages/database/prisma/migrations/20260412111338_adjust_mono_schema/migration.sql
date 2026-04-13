/*
  Warnings:

  - You are about to drop the column `isActive` on the `MonoBankAccount` table. All the data in the column will be lost.
  - Added the required column `status` to the `MonoBankAccount` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MonoBankAccountStatus" AS ENUM ('AVAILABLE', 'PARTIAL', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "MonoBankAccount" DROP COLUMN "isActive",
ADD COLUMN     "status" "MonoBankAccountStatus" NOT NULL;
