/*
  Warnings:

  - A unique constraint covering the columns `[budgetId,startDate]` on the table `BudgetHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BudgetHistory_budgetId_startDate_idx";

-- CreateIndex
CREATE UNIQUE INDEX "BudgetHistory_budgetId_startDate_key" ON "BudgetHistory"("budgetId", "startDate");
