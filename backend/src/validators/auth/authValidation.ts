import z from "zod";

export const userSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(20),
});

export const guestSchema = z.object({
  chatroomId: z.string(),
  username: z.string(),
});
