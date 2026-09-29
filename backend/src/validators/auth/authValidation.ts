import z from "zod";
import { joinKeySchema } from "../chatrooms/chatroomValidation.js";

export const userSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(128),
});

export const guestSchema = z.object({
  joinKey: joinKeySchema.shape.joinKey,
  username: z.string().min(3).max(20),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});
