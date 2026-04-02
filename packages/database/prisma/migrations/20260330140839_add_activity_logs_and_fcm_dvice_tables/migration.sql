/*
  Warnings:

  - Added the required column `data` to the `ActivityLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityId` to the `ActivityLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entityType` to the `ActivityLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `event` to the `ActivityLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ActivityLogs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ActivityLogs" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "entityId" TEXT NOT NULL,
ADD COLUMN     "entityType" TEXT NOT NULL,
ADD COLUMN     "event" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "FcmDevice" (
    "id" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FcmDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FcmDevice_fcmToken_key" ON "FcmDevice"("fcmToken");

-- CreateIndex
CREATE INDEX "FcmDevice_userId_fcmToken_idx" ON "FcmDevice"("userId", "fcmToken");

-- AddForeignKey
ALTER TABLE "ActivityLogs" ADD CONSTRAINT "ActivityLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FcmDevice" ADD CONSTRAINT "FcmDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
