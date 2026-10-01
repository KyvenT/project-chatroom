import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    chatroomMember: { findUnique: vi.fn() },
    message: { create: vi.fn() },
    attachment: { findUnique: vi.fn() },
  },
}));

import Prisma from "../../src/prisma.js";
import {
  MessageError,
  createAttachmentMessage,
  getAttachment,
} from "../../src/services/messageService.js";

const db = Prisma as any;
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

beforeEach(() => vi.clearAllMocks());

describe("createAttachmentMessage", () => {
  it("stores the file with its MIME type as a message", async () => {
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
    db.message.create.mockResolvedValue({ id: "m1" });

    await createAttachmentMessage("u1", "c1", {
      fileName: "../cat.png",
      mimeType: "image/png",
      data: png,
    });

    const { data, include } = db.message.create.mock.calls[0][0];
    expect(data).toMatchObject({
      content: "",
      chatroomId: "c1",
      senderUserId: "u1",
      attachment: {
        create: { fileName: "cat.png", mimeType: "image/png", size: 9 },
      },
    });
    // the file's bytes aren't sent back with the message
    expect(include.attachment.select).not.toHaveProperty("data");
  });

  it("refuses files that fail the type check before touching the database", async () => {
    await expect(
      createAttachmentMessage("u1", "c1", {
        fileName: "x.html",
        mimeType: "text/html",
        data: Buffer.from("<script>"),
      }),
    ).rejects.toMatchObject({ status: 415 });
    expect(db.message.create).not.toHaveBeenCalled();
  });

  it("refuses non-members", async () => {
    db.chatroomMember.findUnique.mockResolvedValue(null);
    await expect(
      createAttachmentMessage("u1", "c1", {
        fileName: "cat.png",
        mimeType: "image/png",
        data: png,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(db.message.create).not.toHaveBeenCalled();
  });
});

describe("getAttachment", () => {
  const stored = { id: "a1", message: { chatroomId: "c1" } };

  it("returns the file to members of its chatroom", async () => {
    db.attachment.findUnique.mockResolvedValue(stored);
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
    expect(await getAttachment("u1", "a1")).toBe(stored);
  });

  it("answers not found to non-members and for missing files alike", async () => {
    db.attachment.findUnique.mockResolvedValue(stored);
    db.chatroomMember.findUnique.mockResolvedValue(null);
    const notMember = getAttachment("u2", "a1");
    await expect(notMember).rejects.toBeInstanceOf(MessageError);
    await expect(notMember).rejects.toMatchObject({ status: 404 });

    db.attachment.findUnique.mockResolvedValue(null);
    await expect(getAttachment("u1", "missing")).rejects.toMatchObject({
      status: 404,
    });
  });
});
