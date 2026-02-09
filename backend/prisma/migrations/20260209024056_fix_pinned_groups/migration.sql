/*
  Warnings:

  - The primary key for the `MemberPinnedGroups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `memberChatroomId` on the `MemberPinnedGroups` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `MemberPinnedGroups` table. All the data in the column will be lost.
  - Added the required column `chatroomId` to the `MemberPinnedGroups` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."MemberPinnedGroups" DROP CONSTRAINT "MemberPinnedGroups_memberChatroomId_memberId_fkey";

-- AlterTable
ALTER TABLE "MemberPinnedGroups" DROP CONSTRAINT "MemberPinnedGroups_pkey",
DROP COLUMN "memberChatroomId",
DROP COLUMN "memberId",
ADD COLUMN     "chatroomId" TEXT NOT NULL,
ADD CONSTRAINT "MemberPinnedGroups_pkey" PRIMARY KEY ("chatroomId", "pinGroupId");

-- AddForeignKey
ALTER TABLE "MemberPinnedGroups" ADD CONSTRAINT "MemberPinnedGroups_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "Chatroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
