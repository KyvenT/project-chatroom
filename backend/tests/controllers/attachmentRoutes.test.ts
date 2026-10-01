import express from "express";
import type { AddressInfo } from "net";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    chatroomMember: { findUnique: vi.fn(), findMany: vi.fn(() => []) },
    message: { create: vi.fn() },
    attachment: { findUnique: vi.fn() },
  },
}));

import Prisma from "../../src/prisma.js";
import { messagesRouter } from "../../src/routes/messages/messages.js";
import { MAX_ATTACHMENT_SIZE } from "../../src/lib/attachments.js";

const db = Prisma as any;
const chatroomId = "6f1c1b3e-8a3a-4c55-9d38-8a5a2b1d7f10";
const attachmentId = "0d9f4a55-1b2c-4f6e-8a7d-3c2b1a0f9e8d";
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 7]);

let base: string;
let server: ReturnType<express.Express["listen"]>;
let isGuest = false;

beforeAll(async () => {
  const app = express();
  app.use(express.json({ limit: "16kb" }));
  // stands in for authMiddleware
  app.use((req, _res, next) => {
    req.userId = "u1";
    req.isGuest = isGuest;
    next();
  });
  app.use("/api/messages", messagesRouter);
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  base = `http://127.0.0.1:${port}/api/messages`;
});
afterAll(() => {
  server.close();
});
beforeEach(() => {
  vi.clearAllMocks();
  isGuest = false;
  db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
});

const upload = (body: Buffer, type: string, name = "cat.png") =>
  fetch(`${base}/${chatroomId}/attachments?name=${encodeURIComponent(name)}`, {
    method: "POST",
    headers: { "Content-Type": type },
    body,
  });

describe("POST /messages/:chatroomId/attachments", () => {
  it("stores the body with the Content-Type it was sent as", async () => {
    db.message.create.mockResolvedValue({ id: "m1", chatroomId });

    const res = await upload(png, "image/png");
    expect(res.status).toBe(201);
    const stored = db.message.create.mock.calls[0][0].data.attachment.create;
    expect(stored.mimeType).toBe("image/png");
    expect(stored.fileName).toBe("cat.png");
    expect(Buffer.from(stored.data).equals(png)).toBe(true);
  });

  it("answers in JSON when the file is too large", async () => {
    const res = await upload(
      Buffer.alloc(MAX_ATTACHMENT_SIZE + 1),
      "image/png",
    );
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ message: "The file is too large" });
  });

  it("refuses disguised files and guests", async () => {
    let res = await upload(Buffer.from("<script>"), "image/png");
    expect(res.status).toBe(415);

    isGuest = true;
    res = await upload(png, "image/png");
    expect(res.status).toBe(403);
    expect(db.message.create).not.toHaveBeenCalled();
  });
});

describe("GET /messages/attachments/:attachmentId", () => {
  it("sends the file with its MIME type and safe headers", async () => {
    db.attachment.findUnique.mockResolvedValue({
      id: attachmentId,
      fileName: "notes.pdf",
      mimeType: "application/pdf",
      data: new Uint8Array(Buffer.from("%PDF-1.7")),
      message: { chatroomId },
    });

    const res = await fetch(`${base}/attachments/${attachmentId}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toMatch(
      /^attachment; filename="notes.pdf"/,
    );
    expect(res.headers.get("content-security-policy")).toContain("sandbox");
    expect(await res.text()).toBe("%PDF-1.7");
  });
});
