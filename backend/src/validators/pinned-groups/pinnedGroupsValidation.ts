import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";
import z from "zod";

export const pinGroupIdSchema = z.object({
  pinGroupId: z.uuid(),
});

export const chatroomPinSchema = chatroomIdSchema.extend({
  pin: z.boolean(),
  ...pinGroupIdSchema.shape,
});

export const PinnedGroupNameSchema = z.object({
  name: z.string().trim().min(1).max(30),
});

export const editPinnedGroupSchema = PinnedGroupNameSchema.extend({
  ...pinGroupIdSchema.shape,
});

export const reorderPinnedGroupChatroomsSchema = z.object({
  chatroomId1: z.string(),
  chatroomId2: z.string(),
  pinGroupId: z.uuid(),
});

// every chatroom pinned in the group, in their new order
export const pinnedGroupOrderSchema = pinGroupIdSchema.extend({
  chatroomIds: z
    .array(z.uuid())
    .min(1)
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate chatroom"),
});
