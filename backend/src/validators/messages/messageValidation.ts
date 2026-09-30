import z from "zod";
import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";

export const retrieveMessageSchema = chatroomIdSchema.extend({
  getBefore: z.iso.datetime(),
  limit: z.coerce.number().max(25),
});

export const uploadAttachmentSchema = chatroomIdSchema.extend({
  name: z.string().min(1).max(1000),
});

export const attachmentIdSchema = z.object({
  attachmentId: z.uuid(),
});
