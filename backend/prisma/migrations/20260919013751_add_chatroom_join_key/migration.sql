-- AlterTable: add the column as nullable so existing chatrooms can be backfilled
ALTER TABLE "Chatroom" ADD COLUMN "joinKey" TEXT;

-- Backfill existing chatrooms with a random key (16 hex chars from a CSPRNG-backed UUID)
UPDATE "Chatroom"
SET "joinKey" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)
WHERE "joinKey" IS NULL;

-- Now that every row has a key, make it required
ALTER TABLE "Chatroom" ALTER COLUMN "joinKey" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Chatroom_joinKey_key" ON "Chatroom"("joinKey");
