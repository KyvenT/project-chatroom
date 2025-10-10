import { ChatroomPrivacy } from "@prisma/client";
import z from "zod";

export const chatroomSetOptionsSchema = z.object({
  title: z.string().min(1).max(30),
  privacy: z.enum(ChatroomPrivacy),
});

export const chatroomIdSchema = z.object({
  chatroomId: z.uuid(),
});

export const chatroomModifyIndexSchema = chatroomIdSchema.extend({
  newIndex: z.int().min(1),
});

export const chatroomPinSchema = chatroomIdSchema.extend({
  pin: z.boolean(),
});

export const chatroomModifyOptionsSchema = chatroomIdSchema.extend({
  ...chatroomSetOptionsSchema.shape,
});
