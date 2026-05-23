-- CreateTable
CREATE TABLE "UserBalance" (
    "id" TEXT NOT NULL,
    "netBalance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "totalIncome" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "totalExpense" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "monthlyIncome" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "monthlyExpense" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "monthYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyBalanceSnapshot" (
    "id" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "income" DECIMAL(20,2) NOT NULL,
    "expense" DECIMAL(20,2) NOT NULL,
    "net" DECIMAL(20,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MonthlyBalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBalance_userId_key" ON "UserBalance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBalanceSnapshot_userId_monthYear_key" ON "MonthlyBalanceSnapshot"("userId", "monthYear");

-- AddForeignKey
ALTER TABLE "UserBalance" ADD CONSTRAINT "UserBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyBalanceSnapshot" ADD CONSTRAINT "MonthlyBalanceSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
