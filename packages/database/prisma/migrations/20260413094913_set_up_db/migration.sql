-- DropIndex
DROP INDEX "Goal_id_userId_idx";

-- DropIndex
DROP INDEX "GoalContribution_id_goalId_idx";

-- DropIndex
DROP INDEX "Transaction_userId_categoryId_idx";

-- DropIndex
DROP INDEX "Transaction_userId_source_idx";

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "ActivityLogs_userId_createdAt_idx" ON "ActivityLogs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BackupCodes_userId_usedAt_idx" ON "BackupCodes"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "Goal_userId_status_idx" ON "Goal"("userId", "status");

-- CreateIndex
CREATE INDEX "GoalContribution_goalId_idx" ON "GoalContribution"("goalId");

-- CreateIndex
CREATE INDEX "LoginActivity_userId_createdAt_idx" ON "LoginActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MonoBankAccount_userId_accountNumber_idx" ON "MonoBankAccount"("userId", "accountNumber");

-- CreateIndex
CREATE INDEX "Notification_userId_archived_createdAt_idx" ON "Notification"("userId", "archived", "createdAt");

-- CreateIndex
CREATE INDEX "RecurringItem_userId_isActive_idx" ON "RecurringItem"("userId", "isActive");

-- CreateIndex
CREATE INDEX "RecurringItem_isActive_nextRunAt_idx" ON "RecurringItem"("isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "Split_userId_status_idx" ON "Split"("userId", "status");

-- CreateIndex
CREATE INDEX "Transaction_userId_source_date_idx" ON "Transaction"("userId", "source", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_date_idx" ON "Transaction"("userId", "categoryId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_sourceId_idx" ON "Transaction"("userId", "sourceId");
