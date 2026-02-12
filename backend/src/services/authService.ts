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

export const REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const createUser = async (
  data: z.infer<typeof userSchema>,
): Promise<AuthPayload> => {
  const { username, password } = data;
  const hashedPassword = await bcrypt.hash(password, 12);

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

  const session = await createSession(user.id);

  return {
    token: session.accessToken,
    refreshToken: session.refreshToken,
    userId: user.id,
    username,
    isGuest: user.isGuest,
  };
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

  const session = await createSession(user.id);

  return {
    token: session.accessToken,
    refreshToken: session.refreshToken,
    userId: user.id,
    username,
    isGuest: user.isGuest,
  };
};

export const createGuest = async (
  data: z.infer<typeof guestSchema>,
): Promise<AuthPayload> => {
  const { chatroomId, username } = data;
  const randomlyGeneratedPassword = crypto.randomBytes(32).toString("hex");

  const verifyPrivacy = await Prisma.chatroom.findUnique({
    where: {
      id: chatroomId,
    },
  });

  if (verifyPrivacy?.privacy !== "PUBLIC") {
    throw new Error("Guests are not allowed to join this chatroom");
  }

  const passwordHash = await bcrypt.hash(randomlyGeneratedPassword, 12);

  let guest;
  try {
    guest = await Prisma.user.create({
      data: {
        username,
        passwordHash,
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

  const session = await createSession(guest.id);

  sendUpdateChatrooms(chatroomId, guest.id, "JOIN");

  return {
    token: session.accessToken,
    refreshToken: session.refreshToken,
    userId: guest.id,
    username,
    isGuest: guest.isGuest,
  };
};

const getNewAccessToken = (userId: string): string => {
  const token = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION as StringValue,
  });
  return token;
};

const hashRefreshToken = (refreshToken: string): string => {
  return crypto.createHash("sha256").update(refreshToken).digest("hex");
};

export const useRefreshToken = async (refreshToken: string) => {
  try {
    const token = await Prisma.session.findUnique({
      where: {
        refreshToken: hashRefreshToken(refreshToken),
      },
    });

    if (!token || token.expiresAt < new Date() || token.revokedAt !== null) {
      throw new Error("Invalid refresh token");
    }

    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    const hashedNewRefreshToken = hashRefreshToken(newRefreshToken);

    await Prisma.$transaction([
      Prisma.session.update({
        where: {
          refreshToken: hashRefreshToken(refreshToken),
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      Prisma.session.create({
        data: {
          userId: token.userId,
          refreshToken: hashedNewRefreshToken,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION),
        },
      }),
    ]);

    const accessToken = getNewAccessToken(token.userId);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

export const createSession = async (userId: string) => {
  const refreshToken = crypto.randomBytes(32).toString("hex");
  const hashedRefreshToken = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION);

  await Prisma.session.create({
    data: {
      userId,
      refreshToken: hashedRefreshToken,
      expiresAt,
    },
  });

  const accessToken = getNewAccessToken(userId);

  return { refreshToken, accessToken };
};

export const revokeSession = async (refreshToken: string) => {
  await Prisma.session.update({
    where: {
      refreshToken: hashRefreshToken(refreshToken),
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const logoutUser = async (refreshToken: string) => {
  try {
    await revokeSession(refreshToken);
  } catch (error: any) {
    console.error("Failed to revoke session:", error);
    throw new Error("Failed to revoke session");
  }
};
