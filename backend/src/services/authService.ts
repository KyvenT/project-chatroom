import z from "zod";
import { guestSchema, userSchema } from "../validators/auth/authValidation.js";
import bcrypt from "bcryptjs";
import Prisma from "../prisma/prisma.js";
import jwt from "jsonwebtoken";
import env from "../env.js";
import type { StringValue } from "ms";
import { AuthPayload } from "../types/payloads.js";
import crypto from "crypto";

export const createUser = async (
  data: z.infer<typeof userSchema>
): Promise<AuthPayload> => {
  const { username, password } = data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await Prisma.user.create({
    data: {
      username,
      passwordHash: hashedPassword,
      isGuest: false,
    },
  });

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION as StringValue,
  });

  return { token, userId: user.id, username, isGuest: user.isGuest };
};

export const loginUser = async (
  data: z.infer<typeof userSchema>
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
  data: z.infer<typeof guestSchema>
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

  const guest = await Prisma.user.create({
    data: {
      username,
      passwordHash: randomlyGeneratedPassword,
      isGuest: true,
    },
  });

  const guestMember = await Prisma.chatroomMember.create({
    data: {
      memberId: guest.id,
      chatroomId,
      chatroomIndex: 1,
    },
  });

  const token = jwt.sign({ userId: guest.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION as StringValue,
  });

  return { token, userId: guest.id, username, isGuest: guest.isGuest };
};
