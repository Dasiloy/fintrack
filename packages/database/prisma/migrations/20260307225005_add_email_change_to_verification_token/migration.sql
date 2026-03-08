-- AlterEnum
ALTER TYPE "VerificationIdentifier" ADD VALUE 'EMAIL_CHANGE';

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "newEmail" TEXT;
