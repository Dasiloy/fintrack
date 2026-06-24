-- CreateEnum
CREATE TYPE "AdvisorChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "AdvisorConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorChatMessage" (
    "id" TEXT NOT NULL,
    "role" "AdvisorChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisorChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvisorConversation_userId_updatedAt_idx" ON "AdvisorConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "AdvisorChatMessage_conversationId_createdAt_idx" ON "AdvisorChatMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdvisorConversation" ADD CONSTRAINT "AdvisorConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorChatMessage" ADD CONSTRAINT "AdvisorChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AdvisorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
