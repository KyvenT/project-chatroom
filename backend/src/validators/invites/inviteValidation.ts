import z from "zod";
import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";
import { InviteStatus } from "@prisma/client";

export const sendInviteSchema = chatroomIdSchema.extend({
  receiverUsername: z.string().min(3).max(20),
});

export const inviteIdSchema = z.object({
  inviteId: z.uuid(),
});

// an invite can only be accepted or rejected
export const updateInviteStatusSchema = inviteIdSchema.extend({
  status: z.enum([InviteStatus.ACCEPTED, InviteStatus.REJECTED]),
});
