/*
  Warnings:

  - A unique constraint covering the columns `[userId,fcmToken]` on the table `FcmDevice` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FcmDevice_fcmToken_key";

-- DropIndex
DROP INDEX "FcmDevice_userId_fcmToken_idx";

-- CreateIndex
CREATE UNIQUE INDEX "FcmDevice_userId_fcmToken_key" ON "FcmDevice"("userId", "fcmToken");
