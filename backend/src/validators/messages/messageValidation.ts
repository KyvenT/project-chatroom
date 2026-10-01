import z from "zod";
import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";
import { MAX_MESSAGE_LENGTH } from "../ws/wsValidation.js";

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

export const messageIdSchema = z.object({
  messageId: z.uuid(),
});

// a single emoji, as Unicode recommends it (including skin tones and
// sequences like 👩‍💻), so reactions can't be arbitrary text
const EMOJI = /^\p{RGI_Emoji}$/v;

export const reactionSchema = messageIdSchema.extend({
  emoji: z.string().max(64).regex(EMOJI, "Must be a single emoji"),
});

export const editMessageSchema = messageIdSchema.extend({
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});
