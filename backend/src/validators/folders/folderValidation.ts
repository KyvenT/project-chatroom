import z from "zod";
import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";

export const folderIdSchema = z.object({
  folderId: z.uuid(),
});

export const folderNameSchema = z.object({
  name: z.string().trim().min(1).max(30),
});

export const renameFolderSchema = folderNameSchema.extend({
  ...folderIdSchema.shape,
});

// folderId null moves the chatroom out of any folder
export const moveChatroomToFolderSchema = chatroomIdSchema.extend({
  folderId: z.uuid().nullable(),
});
