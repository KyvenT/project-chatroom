import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    chatroomMember: { findUnique: vi.fn() },
    message: { findUnique: vi.fn() },
    reaction: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import type WebSocket from "ws";
import Prisma from "../../src/prisma.js";
import {
  addReaction,
  MAX_REACTION_EMOJIS,
  removeReaction,
} from "../../src/services/messageService.js";
import { sendMessageReactions } from "../../src/wss/outgoing-messages/message-changes.js";
import { socketMap, userActiveChatroomMap } from "../../src/lib/socketMaps.js";
import { reactionSchema } from "../../src/validators/messages/messageValidation.js";

const db = Prisma as any;
const messageId = "2b0c7a4e-5f7d-4c1e-9a3b-6d8e0f1a2b3c";
const message = {
  id: messageId,
  chatroomId: "c1",
  senderUserId: "u2",
  attachment: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  userActiveChatroomMap.deleteByKey("u1");
  userActiveChatroomMap.deleteByKey("u2");
});

describe("reactionSchema", () => {
  const valid = (emoji: string) =>
    reactionSchema.safeParse({ messageId, emoji }).success;

  it("takes a single emoji, including skin tones and sequences", () => {
    for (const emoji of ["👍", "❤️", "👍🏽", "👩‍💻", "🏳️‍🌈", "🇨🇦"]) {
      expect(valid(emoji)).toBe(true);
    }
  });

  it("refuses text, several emojis and nothing", () => {
    for (const emoji of ["", "a", "lol", "👍👍", "👍 ", ":+1:", "<b>"]) {
      expect(valid(emoji)).toBe(false);
    }
  });
});

describe("addReaction", () => {
  it("adds the reaction and returns all the message's reactions", async () => {
    db.message.findUnique.mockResolvedValue(message);
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
    db.reaction.findMany
      .mockResolvedValueOnce([{ emoji: "🎉" }])
      .mockResolvedValueOnce([
        { emoji: "🎉", userId: "u2" },
        { emoji: "👍", userId: "u1" },
      ]);

    expect(await addReaction("u1", { messageId, emoji: "👍" })).toEqual({
      chatroomId: "c1",
      messageId,
      reactions: [
        { emoji: "🎉", userId: "u2" },
        { emoji: "👍", userId: "u1" },
      ],
    });
    expect(db.reaction.createMany).toHaveBeenCalledWith({
      data: [{ messageId, userId: "u1", emoji: "👍" }],
      skipDuplicates: true,
    });
  });

  it("refuses non-members and missing messages", async () => {
    db.message.findUnique.mockResolvedValue(message);
    db.chatroomMember.findUnique.mockResolvedValue(null);
    await expect(
      addReaction("u3", { messageId, emoji: "👍" }),
    ).rejects.toMatchObject({ status: 403 });

    db.message.findUnique.mockResolvedValue(null);
    await expect(
      addReaction("u1", { messageId, emoji: "👍" }),
    ).rejects.toMatchObject({ status: 404 });
    expect(db.reaction.createMany).not.toHaveBeenCalled();
  });

  it("refuses a new emoji once a message has the most it can", async () => {
    db.message.findUnique.mockResolvedValue(message);
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
    const full = Array.from({ length: MAX_REACTION_EMOJIS }, (_, i) => ({
      emoji: String.fromCodePoint(0x1f600 + i),
    }));
    db.reaction.findMany.mockResolvedValue(full);

    await expect(
      addReaction("u1", { messageId, emoji: "🦀" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(db.reaction.createMany).not.toHaveBeenCalled();

    // but anyone can still add to one that's already there
    await addReaction("u1", { messageId, emoji: full[0].emoji });
    expect(db.reaction.createMany).toHaveBeenCalled();
  });
});

describe("removeReaction", () => {
  it("only takes back the user's own reaction", async () => {
    db.message.findUnique.mockResolvedValue(message);
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
    db.reaction.findMany.mockResolvedValue([]);

    await removeReaction("u1", { messageId, emoji: "👍" });
    expect(db.reaction.deleteMany).toHaveBeenCalledWith({
      where: { messageId, userId: "u1", emoji: "👍" },
    });
  });

  it("refuses non-members", async () => {
    db.message.findUnique.mockResolvedValue(message);
    db.chatroomMember.findUnique.mockResolvedValue(null);
    await expect(
      removeReaction("u1", { messageId, emoji: "👍" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(db.reaction.deleteMany).not.toHaveBeenCalled();
  });
});

describe("sendMessageReactions", () => {
  it("sends the reactions to users viewing the chatroom", () => {
    const socket = () =>
      ({ send: vi.fn() }) as unknown as WebSocket & {
        send: ReturnType<typeof vi.fn>;
      };
    const viewer = socket();
    const elsewhere = socket();
    socketMap.set("u1", viewer);
    socketMap.set("u2", elsewhere);
    userActiveChatroomMap.set("u1", "c1");
    userActiveChatroomMap.set("u2", "c2");

    const change = {
      chatroomId: "c1",
      messageId,
      reactions: [{ emoji: "👍", userId: "u1" }],
    };
    sendMessageReactions(change);

    expect(JSON.parse(viewer.send.mock.calls[0][0])).toEqual({
      type: "message-reactions",
      ...change,
    });
    expect(elsewhere.send).not.toHaveBeenCalled();
  });
});
