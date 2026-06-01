/*
  Warnings:

  - The values [POST_SYNC,MONTH_END] on the enum `InsightTrigger` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InsightTrigger_new" AS ENUM ('DAILY', 'BUDGET_BREACH', 'MANUAL');
ALTER TABLE "AiInsight" ALTER COLUMN "trigger" TYPE "InsightTrigger_new" USING ("trigger"::text::"InsightTrigger_new");
ALTER TYPE "InsightTrigger" RENAME TO "InsightTrigger_old";
ALTER TYPE "InsightTrigger_new" RENAME TO "InsightTrigger";
DROP TYPE "public"."InsightTrigger_old";
COMMIT;

-- AlterTable
ALTER TABLE "AiInsight" ADD COLUMN     "budgetBreach" JSONB NOT NULL DEFAULT '[]';
