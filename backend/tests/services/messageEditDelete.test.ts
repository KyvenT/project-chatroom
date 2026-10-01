import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    chatroomMember: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
    message: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import type WebSocket from "ws";
import Prisma from "../../src/prisma.js";
import {
  deleteMessage,
  editMessage,
} from "../../src/services/messageService.js";
import {
  sendMessageDelete,
  sendMessageEdit,
} from "../../src/wss/outgoing-messages/message-changes.js";
import { socketMap, userActiveChatroomMap } from "../../src/lib/socketMaps.js";
import { editMessageSchema } from "../../src/validators/messages/messageValidation.js";

const db = Prisma as any;
const messageId = "2b0c7a4e-5f7d-4c1e-9a3b-6d8e0f1a2b3c";
const own = {
  id: messageId,
  chatroomId: "c1",
  senderUserId: "u1",
  attachment: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  userActiveChatroomMap.deleteByKey("u1");
  userActiveChatroomMap.deleteByKey("u2");
});

describe("editMessageSchema", () => {
  it("trims the text and keeps it within the message limit", () => {
    expect(
      editMessageSchema.parse({ messageId, content: "  hi  " }).content,
    ).toBe("hi");
    expect(
      editMessageSchema.safeParse({ messageId, content: "   " }).success,
    ).toBe(false);
    expect(
      editMessageSchema.safeParse({ messageId, content: "x".repeat(61) })
        .success,
    ).toBe(false);
  });
});

describe("editMessage", () => {
  it("lets the sender change the text and marks it edited", async () => {
    db.message.findUnique.mockResolvedValue(own);
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
    db.message.update.mockResolvedValue({ id: messageId });

    await editMessage("u1", { messageId, content: "fixed" });

    const { where, data } = db.message.update.mock.calls[0][0];
    expect(where).toEqual({ id: messageId });
    expect(data.content).toBe("fixed");
    expect(data.editedAt).toBeInstanceOf(Date);
  });

  it("refuses anyone but the sender, even the chatroom owner", async () => {
    db.message.findUnique.mockResolvedValue(own);
    db.chatroomMember.findUnique.mockResolvedValue({ role: "OWNER" });

    await expect(
      editMessage("u2", { messageId, content: "hacked" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(db.message.update).not.toHaveBeenCalled();
  });

  it("refuses files, deleted users' messages and missing messages", async () => {
    db.message.findUnique.mockResolvedValue({
      ...own,
      attachment: { id: "a1" },
    });
    await expect(
      editMessage("u1", { messageId, content: "x" }),
    ).rejects.toMatchObject({ status: 400 });

    db.message.findUnique.mockResolvedValue({ ...own, senderUserId: null });
    await expect(
      editMessage("u1", { messageId, content: "x" }),
    ).rejects.toMatchObject({ status: 403 });

    db.message.findUnique.mockResolvedValue(null);
    await expect(
      editMessage("u1", { messageId, content: "x" }),
    ).rejects.toMatchObject({ status: 404 });
    expect(db.message.update).not.toHaveBeenCalled();
  });

  it("refuses a sender who has left the chatroom", async () => {
    db.message.findUnique.mockResolvedValue(own);
    db.chatroomMember.findUnique.mockResolvedValue(null);
    await expect(
      editMessage("u1", { messageId, content: "x" }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("deleteMessage", () => {
  it("lets the sender delete their message", async () => {
    db.message.findUnique.mockResolvedValue(own);
    db.chatroomMember.findUnique.mockResolvedValue({ role: "MEMBER" });

    expect(await deleteMessage("u1", messageId)).toEqual({
      chatroomId: "c1",
      messageId,
    });
    expect(db.message.delete).toHaveBeenCalledWith({
      where: { id: messageId },
    });
  });

  it("lets owners and admins delete anyone's message", async () => {
    for (const role of ["OWNER", "ADMIN"]) {
      db.message.findUnique.mockResolvedValue({ ...own, senderUserId: null });
      db.chatroomMember.findUnique.mockResolvedValue({ role });
      await deleteMessage("mod", messageId);
    }
    expect(db.message.delete).toHaveBeenCalledTimes(2);
  });

  it("refuses other members and non-members", async () => {
    db.message.findUnique.mockResolvedValue(own);
    db.chatroomMember.findUnique.mockResolvedValue({ role: "MEMBER" });
    await expect(deleteMessage("u2", messageId)).rejects.toMatchObject({
      status: 403,
    });

    // even a message's sender can't delete it once they've left
    db.chatroomMember.findUnique.mockResolvedValue(null);
    await expect(deleteMessage("u1", messageId)).rejects.toMatchObject({
      status: 403,
    });
    expect(db.message.delete).not.toHaveBeenCalled();
  });
});

describe("message change broadcasts", () => {
  const socket = () =>
    ({ send: vi.fn() }) as unknown as WebSocket & {
      send: ReturnType<typeof vi.fn>;
    };

  it("sends edits and deletes to users viewing the chatroom", async () => {
    const viewer = socket();
    const elsewhere = socket();
    socketMap.set("u1", viewer);
    socketMap.set("u2", elsewhere);
    userActiveChatroomMap.set("u1", "c1");
    userActiveChatroomMap.set("u2", "c2");

    const message = { id: messageId, chatroomId: "c1", content: "new" } as any;
    sendMessageEdit(message);
    await sendMessageDelete("c1", messageId);

    expect(viewer.send.mock.calls.map(([d]) => JSON.parse(d))).toEqual([
      { type: "message-edited", message },
      { type: "message-deleted", chatroomId: "c1", messageId },
    ]);
    expect(elsewhere.send).not.toHaveBeenCalled();
  });

  it("sends new unread counts to members not viewing it after a delete", async () => {
    const away = socket();
    socketMap.set("u2", away);
    db.chatroomMember.findMany.mockResolvedValue([{ memberId: "u2" }]);
    db.chatroomMember.findUnique.mockResolvedValue({
      lastViewedAt: new Date(0),
    });
    db.message.count.mockResolvedValue(3);

    await sendMessageDelete("c1", messageId);

    expect(JSON.parse(away.send.mock.calls[0][0])).toMatchObject({
      type: "notification",
      notification: {
        type: "NEW_MESSAGE",
        payload: { chatroomId: "c1", unreadMessages: 3 },
      },
    });
  });
});
