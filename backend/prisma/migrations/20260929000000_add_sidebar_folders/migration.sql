-- AlterTable
ALTER TABLE "ChatroomMember" ADD COLUMN     "folderId" TEXT;

-- CreateTable
CREATE TABLE "SidebarFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SidebarFolder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChatroomMember" ADD CONSTRAINT "ChatroomMember_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "SidebarFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidebarFolder" ADD CONSTRAINT "SidebarFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

