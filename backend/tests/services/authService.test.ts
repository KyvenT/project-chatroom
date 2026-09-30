import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/env.js", () => ({
  default: { JWT_SECRET: "test-secret", JWT_EXPIRATION: "15m" },
}));
vi.mock("../../src/wss/outgoing-messages/update-chatrooms.js", () => ({
  sendUpdateChatrooms: vi.fn(),
}));
vi.mock("../../src/prisma.js", () => ({
  default: {
    user: { create: vi.fn(), findUnique: vi.fn() },
    session: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
    chatroom: { findUnique: vi.fn() },
    chatroomMember: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import Prisma from "../../src/prisma.js";
import { sendUpdateChatrooms } from "../../src/wss/outgoing-messages/update-chatrooms.js";
import {
  INVALID_LOGIN,
  REFRESH_TOKEN_EXPIRATION,
  createGuest,
  createUser,
  loginUser,
  logoutUser,
  useRefreshToken,
} from "../../src/services/authService.js";

// The mocked client is only ever called with the shapes asserted below.
const db = Prisma as any;
const sha256 = (s: string) =>
  crypto.createHash("sha256").update(s).digest("hex");

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.session.create.mockResolvedValue({});
  });

  describe("createUser", () => {
    it("hashes the password, creates a session and returns a signed token", async () => {
      db.user.create.mockResolvedValue({ id: "u1", isGuest: false });

      const result = await createUser({
        username: "alice",
        password: "secret1",
      });

      const { passwordHash } = db.user.create.mock.calls[0][0].data;
      expect(passwordHash).not.toBe("secret1");
      expect(await bcrypt.compare("secret1", passwordHash)).toBe(true);

      expect(result).toMatchObject({
        userId: "u1",
        username: "alice",
        isGuest: false,
      });
      expect(jwt.verify(result.token, "test-secret")).toMatchObject({
        userId: "u1",
        isGuest: false,
      });
    });

    it("stores only a hash of the refresh token", async () => {
      db.user.create.mockResolvedValue({ id: "u1", isGuest: false });
      const result = await createUser({
        username: "alice",
        password: "secret1",
      });

      const stored = db.session.create.mock.calls[0][0].data;
      expect(stored.refreshToken).toBe(sha256(result.refreshToken));
      expect(stored.refreshToken).not.toBe(result.refreshToken);
      expect(stored.userId).toBe("u1");
    });

    it("maps a unique-constraint error to 'Username already exists'", async () => {
      db.user.create.mockRejectedValue({ code: "P2002" });
      await expect(
        createUser({ username: "alice", password: "secret1" }),
      ).rejects.toThrow("Username already exists");
    });

    it("wraps other database errors", async () => {
      db.user.create.mockRejectedValue(new Error("boom"));
      await expect(
        createUser({ username: "alice", password: "secret1" }),
      ).rejects.toThrow("Failed to create user");
    });
  });

  describe("loginUser", () => {
    it("gives the same error for unknown users and wrong passwords", async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(
        loginUser({ username: "ghost", password: "secret1" }),
      ).rejects.toThrow(INVALID_LOGIN);

      db.user.findUnique.mockResolvedValue({
        id: "u1",
        isGuest: false,
        passwordHash: await bcrypt.hash("right-pass", 4),
      });
      await expect(
        loginUser({ username: "alice", password: "wrong-pass" }),
      ).rejects.toThrow(INVALID_LOGIN);
      expect(db.session.create).not.toHaveBeenCalled();
    });

    it("still checks a password for unknown users, so timing gives nothing away", async () => {
      const compare = vi.spyOn(bcrypt, "compare");
      db.user.findUnique.mockResolvedValue(null);

      await expect(
        loginUser({ username: "ghost", password: "secret1" }),
      ).rejects.toThrow(INVALID_LOGIN);
      expect(compare).toHaveBeenCalledOnce();
      compare.mockRestore();
    });

    it("refuses logging into guest accounts", async () => {
      db.user.findUnique.mockResolvedValue({
        id: "g1",
        isGuest: true,
        passwordHash: await bcrypt.hash("guessed", 4),
      });
      await expect(
        loginUser({ username: "guest", password: "guessed" }),
      ).rejects.toThrow(INVALID_LOGIN);
    });

    it("returns tokens on success", async () => {
      db.user.findUnique.mockResolvedValue({
        id: "u1",
        isGuest: false,
        passwordHash: await bcrypt.hash("right-pass", 4),
      });
      const result = await loginUser({
        username: "alice",
        password: "right-pass",
      });
      expect(result.userId).toBe("u1");
      expect(result.token).toBeTruthy();
      expect(result.refreshToken).toHaveLength(64);
    });
  });

  describe("createGuest", () => {
    it("refuses non-public chatrooms", async () => {
      db.chatroom.findUnique.mockResolvedValue({ privacy: "INVITE_ONLY" });
      await expect(
        createGuest({ joinKey: "key", username: "guest" }),
      ).rejects.toThrow("Guests are not allowed to join this chatroom");
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it("refuses when the join key matches no chatroom", async () => {
      db.chatroom.findUnique.mockResolvedValue(null);
      await expect(
        createGuest({ joinKey: "nope", username: "guest" }),
      ).rejects.toThrow("Guests are not allowed to join this chatroom");
    });

    it("creates a guest, adds them to the chatroom and notifies members", async () => {
      db.chatroom.findUnique.mockResolvedValue({ id: "c1", privacy: "PUBLIC" });
      db.user.create.mockResolvedValue({ id: "g1", isGuest: true });
      db.chatroomMember.create.mockResolvedValue({});

      const result = await createGuest({ joinKey: "key", username: "guest" });

      expect(db.chatroom.findUnique).toHaveBeenCalledWith({
        where: { joinKey: "key" },
      });
      expect(db.user.create.mock.calls[0][0].data.isGuest).toBe(true);
      expect(db.chatroomMember.create).toHaveBeenCalledWith({
        data: { memberId: "g1", chatroomId: "c1", chatroomIndex: 1 },
      });
      expect(sendUpdateChatrooms).toHaveBeenCalledWith("c1", "g1", "JOIN");
      expect(result).toMatchObject({ userId: "g1", isGuest: true });
    });

    it("maps duplicate guest usernames", async () => {
      db.chatroom.findUnique.mockResolvedValue({ id: "c1", privacy: "PUBLIC" });
      db.user.create.mockRejectedValue({ code: "P2002" });
      await expect(
        createGuest({ joinKey: "key", username: "guest" }),
      ).rejects.toThrow("Username already exists");
    });
  });

  describe("useRefreshToken", () => {
    const validSession = (overrides = {}) => ({
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: { username: "alice", isGuest: false },
      ...overrides,
    });

    // run the interactive transaction against the mocked client
    const runTransactions = () =>
      db.$transaction.mockImplementation(async (fn: any) => fn(db));

    it("looks the session up by the token's hash", async () => {
      db.session.findUnique.mockResolvedValue(validSession());
      db.session.updateMany.mockResolvedValue({ count: 1 });
      runTransactions();
      await useRefreshToken("raw-token");

      expect(db.session.findUnique.mock.calls[0][0].where.refreshToken).toBe(
        sha256("raw-token"),
      );
    });

    it.each([
      ["missing", null],
      ["expired", validSession({ expiresAt: new Date(Date.now() - 1000) })],
    ])("rejects a %s session", async (_label, session) => {
      db.session.findUnique.mockResolvedValue(session);
      await expect(useRefreshToken("raw-token")).rejects.toThrow(
        "Invalid refresh token",
      );
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("ends all of the user's sessions when a used token comes back", async () => {
      db.session.findUnique.mockResolvedValue(
        validSession({ revokedAt: new Date() }),
      );
      db.session.updateMany.mockResolvedValue({ count: 2 });

      await expect(useRefreshToken("raw-token")).rejects.toThrow(
        "Invalid refresh token",
      );
      expect(db.session.updateMany.mock.calls[0][0].where).toEqual({
        userId: "u1",
        revokedAt: null,
      });
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("rotates the refresh token and issues a new access token", async () => {
      db.session.findUnique.mockResolvedValue(validSession());
      db.session.updateMany.mockResolvedValue({ count: 1 });
      runTransactions();

      const result = await useRefreshToken("raw-token");

      expect(db.session.updateMany.mock.calls[0][0].where).toEqual({
        refreshToken: sha256("raw-token"),
        revokedAt: null,
      });
      expect(result.refreshToken).not.toBe("raw-token");
      expect(result.username).toBe("alice");
      expect(jwt.verify(result.token, "test-secret")).toMatchObject({
        userId: "u1",
      });

      const created = db.session.create.mock.calls[0][0].data;
      expect(created.refreshToken).toBe(sha256(result.refreshToken));
      expect(created.expiresAt.getTime()).toBeGreaterThan(
        Date.now() + REFRESH_TOKEN_EXPIRATION - 5000,
      );
    });

    it("lets only one of two simultaneous refreshes succeed", async () => {
      db.session.findUnique.mockResolvedValue(validSession());
      // the other request already used the token
      db.session.updateMany.mockResolvedValue({ count: 0 });
      runTransactions();

      await expect(useRefreshToken("raw-token")).rejects.toThrow(
        "Invalid refresh token",
      );
      expect(db.session.create).not.toHaveBeenCalled();
    });
  });

  describe("logoutUser", () => {
    it("revokes the session by hashed token", async () => {
      db.session.update.mockResolvedValue({});
      await logoutUser("raw-token");

      const arg = db.session.update.mock.calls[0][0];
      expect(arg.where.refreshToken).toBe(sha256("raw-token"));
      expect(arg.data.revokedAt).toBeInstanceOf(Date);
    });

    it("throws when revoking fails", async () => {
      db.session.update.mockRejectedValue(new Error("nope"));
      await expect(logoutUser("raw-token")).rejects.toThrow(
        "Failed to revoke session",
      );
    });
  });
});
