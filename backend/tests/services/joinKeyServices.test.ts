import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/wss/outgoing-messages/update-chatrooms.js", () => ({
  sendUpdateChatrooms: vi.fn(),
}));
vi.mock("../../src/prisma.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    chatroom: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    chatroomMember: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import Prisma from "../../src/prisma.js";
import { sendUpdateChatrooms } from "../../src/wss/outgoing-messages/update-chatrooms.js";
import {
  createChatroom,
  getChatroomDetails,
  getJoinInfo,
  regenerateJoinKey,
} from "../../src/services/chatroomService.js";
import { joinChatroom } from "../../src/services/memberService.js";

const db = Prisma as any;

beforeEach(() => vi.clearAllMocks());

describe("getJoinInfo", () => {
  it("looks a chatroom up by join key and returns public info", async () => {
    db.chatroom.findUnique.mockResolvedValue({
      id: "c1",
      title: "Room",
      privacy: "PUBLIC",
    });

    expect(await getJoinInfo({ joinKey: "k" })).toEqual({
      chatroomId: "c1",
      title: "Room",
      privacy: "PUBLIC",
    });
    expect(db.chatroom.findUnique.mock.calls[0][0].where).toEqual({
      joinKey: "k",
    });
  });

  it("throws for an unknown key", async () => {
    db.chatroom.findUnique.mockResolvedValue(null);
    await expect(getJoinInfo({ joinKey: "bad" })).rejects.toThrow(
      "Invalid or expired join link",
    );
  });
});

describe("joinChatroom (by join key)", () => {
  const chatroom = (privacy: string) => ({ id: "c1", privacy });

  beforeEach(() => {
    db.chatroomMember.findUnique.mockResolvedValue(null);
    db.chatroomMember.findFirst.mockResolvedValue({ chatroomIndex: 2 });
    db.chatroomMember.create.mockResolvedValue({});
  });

  it("rejects an unknown key", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: false });
    db.chatroom.findUnique.mockResolvedValue(null);
    await expect(joinChatroom("u1", { joinKey: "bad" })).rejects.toThrow(
      "Invalid or expired join link",
    );
    expect(db.chatroomMember.create).not.toHaveBeenCalled();
  });

  it.each(["JOINABLE", "PUBLIC"])(
    "lets a registered user join a %s chatroom",
    async (privacy) => {
      db.user.findUnique.mockResolvedValue({ isGuest: false });
      db.chatroom.findUnique.mockResolvedValue(chatroom(privacy));

      expect(await joinChatroom("u1", { joinKey: "k" })).toBe("c1");
      expect(db.chatroomMember.create).toHaveBeenCalledWith({
        data: { memberId: "u1", chatroomId: "c1", chatroomIndex: 3 },
      });
      expect(sendUpdateChatrooms).toHaveBeenCalledWith("c1", "u1", "JOIN");
    },
  );

  it.each(["INVITE_ONLY", "INVITE_PLUS"])(
    "requires an invite for %s chatrooms even with a valid key",
    async (privacy) => {
      db.user.findUnique.mockResolvedValue({ isGuest: false });
      db.chatroom.findUnique.mockResolvedValue(chatroom(privacy));

      await expect(joinChatroom("u1", { joinKey: "k" })).rejects.toThrow(
        "requires an invite",
      );
      expect(db.chatroomMember.create).not.toHaveBeenCalled();
    },
  );

  it("only lets guests join PUBLIC chatrooms", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: true });

    db.chatroom.findUnique.mockResolvedValue(chatroom("JOINABLE"));
    await expect(joinChatroom("g1", { joinKey: "k" })).rejects.toThrow(
      "Only users can join this chatroom",
    );

    db.chatroom.findUnique.mockResolvedValue(chatroom("PUBLIC"));
    await expect(joinChatroom("g1", { joinKey: "k" })).resolves.toBe("c1");
  });

  it("is idempotent for existing members", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: false });
    db.chatroom.findUnique.mockResolvedValue(chatroom("JOINABLE"));
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });

    expect(await joinChatroom("u1", { joinKey: "k" })).toBe("c1");
    expect(db.chatroomMember.create).not.toHaveBeenCalled();
    expect(sendUpdateChatrooms).not.toHaveBeenCalled();
  });
});

describe("regenerateJoinKey", () => {
  it("lets the owner replace the key and returns the new one", async () => {
    db.chatroom.findUnique.mockResolvedValue({ id: "c1", ownerId: "u1" });
    db.chatroom.update.mockResolvedValue({ joinKey: "newkeynewkey1234" });

    const key = await regenerateJoinKey("u1", { chatroomId: "c1" });

    expect(key).toBe("newkeynewkey1234");
    const arg = db.chatroom.update.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "c1" });
    expect(arg.data.joinKey).toMatch(/^[A-Za-z0-9_-]{16}$/);
  });

  it("rejects non-owners", async () => {
    db.chatroom.findUnique.mockResolvedValue({ id: "c1", ownerId: "owner" });
    await expect(
      regenerateJoinKey("intruder", { chatroomId: "c1" }),
    ).rejects.toThrow("Not detected as owner of chatroom");
    expect(db.chatroom.update).not.toHaveBeenCalled();
  });

  it("rejects unknown chatrooms", async () => {
    db.chatroom.findUnique.mockResolvedValue(null);
    await expect(
      regenerateJoinKey("u1", { chatroomId: "nope" }),
    ).rejects.toThrow("Not detected as owner of chatroom");
  });
});

describe("getChatroomDetails", () => {
  const details = {
    id: "c1",
    joinKey: "secretsecret1234",
    title: "Room",
    privacy: "JOINABLE",
    ownerId: "owner",
    createdAt: new Date(0),
    owner: { username: "o" },
  };

  beforeEach(() => {
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "x" });
    db.chatroom.findUnique.mockResolvedValue(details);
  });

  it("includes the join key for the owner", async () => {
    const result = await getChatroomDetails("owner", { chatroomId: "c1" });
    expect(result.joinKey).toBe("secretsecret1234");
  });

  it("hides the join key from other members", async () => {
    const result = await getChatroomDetails("member", { chatroomId: "c1" });
    expect(result).not.toHaveProperty("joinKey");
    expect(result.title).toBe("Room");
  });
});

describe("createChatroom", () => {
  it("assigns a generated join key to new chatrooms", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u1", isGuest: false });
    db.chatroomMember.findFirst.mockResolvedValue(null);
    db.chatroom.create.mockResolvedValue({ id: "c1" });
    db.chatroomMember.create.mockResolvedValue({});

    await createChatroom("u1", { title: "Room", privacy: "JOINABLE" });

    expect(db.chatroom.create.mock.calls[0][0].data.joinKey).toMatch(
      /^[A-Za-z0-9_-]{16}$/,
    );
  });
});
