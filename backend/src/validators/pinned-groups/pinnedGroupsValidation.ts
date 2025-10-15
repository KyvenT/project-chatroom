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
  name: z.string().min(1).max(30),
});

export const editPinnedGroupSchema = PinnedGroupNameSchema.extend({
  ...pinGroupIdSchema.shape,
});
