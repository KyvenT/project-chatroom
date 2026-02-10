/*
  Warnings:

  - Added the required column `pinnedIndex` to the `MemberPinnedGroups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MemberPinnedGroups" ADD COLUMN     "pinnedIndex" INTEGER NOT NULL;
