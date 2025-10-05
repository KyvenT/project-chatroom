import z from "zod";
import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";
import { InviteStatus } from "@prisma/client";

export const sendInviteSchema = chatroomIdSchema.extend({
  receiverUsername: z.string().min(3).max(20),
});

export const inviteIdSchema = z.object({
  inviteId: z.uuid(),
});

export const updateInviteStatusSchema = inviteIdSchema.extend({
  status: z.enum(InviteStatus),
});
