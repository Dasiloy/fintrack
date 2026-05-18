/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Split` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Split_userId_name_key" ON "Split"("userId", "name");
