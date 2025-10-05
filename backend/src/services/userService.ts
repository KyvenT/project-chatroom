import z from "zod";
import Prisma from "../prisma/prisma.js";
import { UserDetailsPayload } from "../types/payloads.js";
import { updateUserStatusSchema } from "../validators/users/userValidation.js";
import { sendStatusUpdate } from "../wss/outgoing-messages/status-update.js";

export const getUserDetails = async (
  userId: string
): Promise<UserDetailsPayload> => {
  const user = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      passwordHash: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUserStatus = async (
  userId: string,
  data: z.infer<typeof updateUserStatusSchema>
) => {
  const { status } = data;

  const user = await Prisma.user.update({
    select: {
      id: true,
      username: true,
      status: true,
    },
    data: {
      status,
    },
    where: {
      id: userId,
    },
  });

  sendStatusUpdate(user);
};
