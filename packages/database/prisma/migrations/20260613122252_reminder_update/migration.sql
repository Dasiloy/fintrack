-- AlterTable
ALTER TABLE "RecurringItem" ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
