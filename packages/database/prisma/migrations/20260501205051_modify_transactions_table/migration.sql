-- DropIndex
DROP INDEX "Transaction_monoBankAccountId_key";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "recurringItemId" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recurringItemId_fkey" FOREIGN KEY ("recurringItemId") REFERENCES "RecurringItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
