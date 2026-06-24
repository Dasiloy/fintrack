-- CreateEnum
CREATE TYPE "AdvisorScope" AS ENUM ('TRANSACTIONS', 'BUDGETS', 'GOALS', 'RECURRING', 'SPLITS', 'ANALYTICS');

-- CreateTable
CREATE TABLE "AdvisorSetting" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "grantedScopes" "AdvisorScope"[] DEFAULT ARRAY['TRANSACTIONS', 'BUDGETS', 'GOALS', 'RECURRING', 'SPLITS', 'ANALYTICS']::"AdvisorScope"[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorSetting_userId_key" ON "AdvisorSetting"("userId");

-- CreateIndex
CREATE INDEX "AdvisorSetting_userId_idx" ON "AdvisorSetting"("userId");

-- AddForeignKey
ALTER TABLE "AdvisorSetting" ADD CONSTRAINT "AdvisorSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
