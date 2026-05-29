-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('MONTHLY_SUMMARY', 'QUARTERLY_SUMMARY', 'YEARLY_SUMMARY');

-- CreateEnum
CREATE TYPE "InsightTrigger" AS ENUM ('DAILY', 'POST_SYNC', 'MONTH_END', 'BUDGET_BREACH');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" "SnapshotType" NOT NULL,
    "data" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trigger" "InsightTrigger" NOT NULL,
    "severity" "InsightSeverity" NOT NULL,
    "summary" TEXT NOT NULL,
    "anomalies" JSONB NOT NULL DEFAULT '[]',
    "goalAlerts" JSONB NOT NULL DEFAULT '[]',
    "cashFlowForecast" TEXT,
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "macroContext" JSONB NOT NULL DEFAULT '{}',
    "conversationThreadId" TEXT,
    "readAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_userId_period_idx" ON "AnalyticsSnapshot"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_userId_period_type_key" ON "AnalyticsSnapshot"("userId", "period", "type");

-- CreateIndex
CREATE INDEX "AiInsight_userId_generatedAt_idx" ON "AiInsight"("userId", "generatedAt" DESC);

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
