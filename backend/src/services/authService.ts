import z from "zod";
import { guestSchema, userSchema } from "../validators/auth/authValidation.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { socketSessions } from "../lib/socketSessions.js";
import Prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import env from "../env.js";
import type { StringValue } from "ms";
import { AuthPayload } from "../types/payloads.js";
import crypto from "crypto";
import { sendUpdateChatrooms } from "../wss/outgoing-messages/update-chatrooms.js";

export const REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// login failures don't say whether the username exists
export const INVALID_LOGIN = "Invalid username or password";

// checked against when the username doesn't exist, so a failed login takes
// as long either way and timing doesn't reveal which usernames exist
const dummyPasswordHash = hashPassword(crypto.randomBytes(16).toString("hex"));

// helpers
const getNewAccessToken = (
  userId: string,
  isGuest: boolean,
  sessionId: string,
): string => {
  const token = jwt.sign({ userId, isGuest, sid: sessionId }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRATION as StringValue,
  });
  return token;
};

const hashRefreshToken = (refreshToken: string): string => {
  return crypto.createHash("sha256").update(refreshToken).digest("hex");
};

const revokeSession = async (refreshToken: string) => {
  try {
    const session = await Prisma.session.update({
      where: {
        refreshToken: hashRefreshToken(refreshToken),
      },
      data: {
        revokedAt: new Date(),
      },
    });
    socketSessions.endSessions([session.id]);
  } catch (error: any) {
    console.error("Failed to revoke session:", error);
    throw new Error("Failed to revoke session");
  }
};

export const createUser = async (
  data: z.infer<typeof userSchema>,
): Promise<AuthPayload> => {
  const { username, password } = data;
  const hashedPassword = await hashPassword(password);

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

  const session = await createSession(user.id, user.isGuest);

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

  const { ok, needsRehash } = await verifyPassword(
    password,
    user?.passwordHash ?? (await dummyPasswordHash),
  );

  // guest accounts have random passwords and can't be logged into
  if (!user || !ok || user.isGuest) {
    throw new Error(INVALID_LOGIN);
  }

  // upgrade hashes from before long passwords were supported
  if (needsRehash) {
    await Prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }

  const session = await createSession(user.id, user.isGuest);

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
  const { joinKey, username } = data;
  const randomlyGeneratedPassword = crypto.randomBytes(32).toString("hex");

  const chatroom = await Prisma.chatroom.findUnique({
    where: {
      joinKey,
    },
  });

  if (chatroom?.privacy !== "PUBLIC") {
    throw new Error("Guests are not allowed to join this chatroom");
  }

  const chatroomId = chatroom.id;

  const passwordHash = await hashPassword(randomlyGeneratedPassword);

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

  const session = await createSession(guest.id, guest.isGuest);

  sendUpdateChatrooms(chatroomId, guest.id, "JOIN");

  return {
    token: session.accessToken,
    refreshToken: session.refreshToken,
    userId: guest.id,
    username,
    isGuest: guest.isGuest,
  };
};

export const useRefreshToken = async (refreshToken: string) => {
  const hashed = hashRefreshToken(refreshToken);

  const token = await Prisma.session.findUnique({
    where: {
      refreshToken: hashed,
    },
    include: {
      user: {
        select: {
          username: true,
          isGuest: true,
        },
      },
    },
  });

  if (!token || token.expiresAt < new Date()) {
    throw new Error("Invalid refresh token");
  }

  // each refresh token works once; seeing a used one again means it was
  // copied, so end every session of that user to lock the copy out too
  if (token.revokedAt !== null) {
    const active = await Prisma.session.findMany({
      where: { userId: token.userId, revokedAt: null },
      select: { id: true },
    });
    await Prisma.session.updateMany({
      where: { userId: token.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    socketSessions.endSessions(active.map((session) => session.id));
    throw new Error("Invalid refresh token");
  }

  const newRefreshToken = crypto.randomBytes(32).toString("hex");

  const rotated = await Prisma.$transaction(async (tx) => {
    // only one of two simultaneous refreshes with the same token wins
    const { count } = await tx.session.updateMany({
      where: { refreshToken: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count !== 1) return null;

    return tx.session.create({
      data: {
        userId: token.userId,
        refreshToken: hashRefreshToken(newRefreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRATION),
      },
      select: { id: true },
    });
  });

  if (!rotated) {
    throw new Error("Invalid refresh token");
  }

  // sockets signed in with the old session carry on with the new one
  socketSessions.rename(token.id, rotated.id);

  const accessToken = getNewAccessToken(
    token.userId,
    token.user.isGuest,
    rotated.id,
  );

  return {
    token: accessToken,
    refreshToken: newRefreshToken,
    username: token.user.username,
    userId: token.userId,
    isGuest: token.user.isGuest,
  };
};

export const createSession = async (userId: string, isGuest: boolean) => {
  const refreshToken = crypto.randomBytes(32).toString("hex");
  const hashedRefreshToken = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION);

  const session = await Prisma.session.create({
    data: {
      userId,
      refreshToken: hashedRefreshToken,
      expiresAt,
    },
    select: { id: true },
  });

  const accessToken = getNewAccessToken(userId, isGuest, session.id);

  return { refreshToken, accessToken };
};

export const logoutUser = async (refreshToken: string) => {
  try {
    await revokeSession(refreshToken);
  } catch (error: any) {
    console.error("Failed to revoke session:", error);
    throw new Error("Failed to revoke session");
  }
};
