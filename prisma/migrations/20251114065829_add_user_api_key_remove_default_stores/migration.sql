/*
  Warnings:

  - You are about to drop the column `defaultStoreNames` on the `UserSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "geminiApiKey" TEXT;

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "defaultStoreNames";
