-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Avatar" (
    "userId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "Avatar" ADD CONSTRAINT "Avatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

