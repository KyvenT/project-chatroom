import z from "zod";

export const userSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const guestSchema = z.object({
  chatroomId: z.string(),
  username: z.string(),
});
