import z from "zod";
import { chatroomIdSchema } from "../chatrooms/chatroomValidation.js";

export const retrieveMessageSchema = chatroomIdSchema.extend({
  getBefore: z.iso.datetime(),
});
