import z from "zod";
import { guestSchema, userSchema } from "../validators/auth/authValidation.js";
import bcrypt from "bcryptjs";
import Prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import env from "../env.js";
import type { StringValue } from "ms";
import { AuthPayload } from "../types/payloads.js";
import crypto from "crypto";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";

export const createUser = async (
  data: z.infer<typeof userSchema>,
): Promise<AuthPayload> => {
  const { username, password } = data;
  const hashedPassword = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await Prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        isGuest: false,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Username already exists");
    }
    throw new Error("Failed to create user");
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION as StringValue,
  });

  return { token, userId: user.id, username, isGuest: user.isGuest };
};

export const loginUser = async (
  data: z.infer<typeof userSchema>,
): Promise<AuthPayload> => {
  const { username, password } = data;
  const user = await Prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION as StringValue,
  });

  return { token, userId: user.id, username, isGuest: user.isGuest };
};

export const createGuest = async (
  data: z.infer<typeof guestSchema>,
): Promise<AuthPayload> => {
  const { chatroomId, username } = data;
  const randomlyGeneratedPassword = crypto.randomBytes(16).toString("hex");

  const verifyPrivacy = await Prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
  });

  if (verifyPrivacy?.privacy !== "PUBLIC") {
    throw new Error("Guests are not allowed to join this chatroom");
  }

  let guest;
  try {
    guest = await Prisma.user.create({
      data: {
        username,
        passwordHash: randomlyGeneratedPassword,
        isGuest: true,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Username already exists");
    }
    throw new Error("Failed to create guest user");
  }

  try {
    await Prisma.chatroomMember.create({
      data: {
        memberId: guest.id,
        chatroomId,
        chatroomIndex: 1,
      },
    });
  } catch (error: any) {
    console.error("Failed to add guest to chatroom:", error);
    throw new Error("Failed to add guest to chatroom");
  }

  const token = jwt.sign({ userId: guest.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION as StringValue,
  });

  sendUpdateChatrooms(chatroomId, guest.id, "JOIN");

  return { token, userId: guest.id, username, isGuest: guest.isGuest };
};
