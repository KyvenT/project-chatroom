import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";
import z from "zod";

export const chatroomPinSchema = chatroomIdSchema.extend({
  pin: z.boolean(),
  pinGroupId: z.uuid(),
});

export const setPinnedGroupSchema = z.object({
  name: z.string().min(1).max(30),
});
