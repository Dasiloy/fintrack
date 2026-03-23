/*
  Warnings:

  - Added the required column `userId` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `RecurringItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Split` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RecurringItem" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Split" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "RecurringItem" ADD CONSTRAINT "RecurringItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Split" ADD CONSTRAINT "Split_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
