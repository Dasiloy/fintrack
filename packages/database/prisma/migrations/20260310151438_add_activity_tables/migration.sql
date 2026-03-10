-- CreateEnum
CREATE TYPE "LoginActivityType" AS ENUM ('PASSWORD', 'MFA');

-- CreateEnum
CREATE TYPE "LoginActivityStatus" AS ENUM ('FALED', 'SUCCESS');

-- CreateTable
CREATE TABLE "LoginActivity" (
    "id" TEXT NOT NULL,
    "type" "LoginActivityType" NOT NULL,
    "status" "LoginActivityStatus" NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLogs" (
    "id" TEXT NOT NULL,

    CONSTRAINT "ActivityLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LoginActivity" ADD CONSTRAINT "LoginActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
