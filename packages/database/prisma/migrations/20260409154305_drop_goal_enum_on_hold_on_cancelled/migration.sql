/*
  Warnings:

  - The values [ON_HOLD,CANCELLED] on the enum `Goalstatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "GoalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
BEGIN;
CREATE TYPE "Goalstatus_new" AS ENUM ('ACTIVE', 'COMPLETED');
ALTER TABLE "public"."Goal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Goal" ALTER COLUMN "status" TYPE "Goalstatus_new" USING ("status"::text::"Goalstatus_new");
ALTER TYPE "Goalstatus" RENAME TO "Goalstatus_old";
ALTER TYPE "Goalstatus_new" RENAME TO "Goalstatus";
DROP TYPE "public"."Goalstatus_old";
ALTER TABLE "Goal" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "priority" "GoalPriority" NOT NULL DEFAULT 'MEDIUM';
