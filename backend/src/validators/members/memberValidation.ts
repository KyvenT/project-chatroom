import z from "zod";
import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";

export const memberLeaveSchema = chatroomIdSchema.extend({
  memberId: z.uuid(),
});
