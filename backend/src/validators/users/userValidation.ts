import { Status } from "@prisma/client";
import z from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(Status),
});
