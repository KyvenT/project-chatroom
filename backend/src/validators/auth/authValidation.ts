import z from "zod";
import { joinKeySchema } from "../chatrooms/chatroomValidation.js";

export const userSchema = z.object({
  username: z.string().min(3).max(20),
  // any length counts in full (see lib/passwords); the cap only keeps
  // requests reasonable
  password: z.string().min(6).max(1024),
});

export const guestSchema = z.object({
  joinKey: joinKeySchema.shape.joinKey,
  username: z.string().min(3).max(20),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});
