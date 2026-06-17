-- CreateTable
CREATE TABLE "FinanceScoreBoard" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "score" DECIMAL(4,1) NOT NULL,
    "budgetScore" DECIMAL(4,1) NOT NULL,
    "savingScore" DECIMAL(4,1) NOT NULL,
    "goalScore" DECIMAL(4,1) NOT NULL,
    "splitScore" DECIMAL(4,1) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceScoreBoard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FinanceScoreBoard" ADD CONSTRAINT "FinanceScoreBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
