/*
  Warnings:

  - You are about to drop the column `gaolsAlertApp` on the `NotificationSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NotificationSetting" DROP COLUMN "gaolsAlertApp",
ADD COLUMN     "goalsAlertApp" BOOLEAN NOT NULL DEFAULT true;
