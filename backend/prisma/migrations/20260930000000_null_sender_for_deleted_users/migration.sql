-- Messages whose sender's account is deleted now keep a null sender, instead
-- of being handed to a placeholder "Deleted User" account.

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderUserId_fkey";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "senderUserId" DROP NOT NULL,
ALTER COLUMN "senderUserId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Messages already given to the placeholder account lose their sender
UPDATE "Message"
SET "senderUserId" = NULL
WHERE "senderUserId" = 'b532df46-e953-415c-b9c0-5489ce777e70';

-- The placeholder account is no longer needed. It's left alone if it somehow
-- owns a chatroom, since deleting it would take the chatroom's owner away.
DELETE FROM "User"
WHERE "id" = 'b532df46-e953-415c-b9c0-5489ce777e70'
  AND NOT EXISTS (
    SELECT 1 FROM "Chatroom"
    WHERE "ownerId" = 'b532df46-e953-415c-b9c0-5489ce777e70'
  );
