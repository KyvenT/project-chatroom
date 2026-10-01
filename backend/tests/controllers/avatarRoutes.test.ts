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
    $transaction: vi.fn((ops) => Promise.all(ops)),
    avatar: { upsert: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn() },
    user: { update: vi.fn() },
    chatroomMember: { findMany: vi.fn(() => []) },
  },
}));

import Prisma from "../../src/prisma.js";
import { avatarsRouter } from "../../src/routes/avatars/avatars.js";
import { usersRouter } from "../../src/routes/users/users.js";

const db = Prisma as any;
const userId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

let base: string;
let server: ReturnType<express.Express["listen"]>;

beforeAll(async () => {
  const app = express();
  app.use("/api/avatars", avatarsRouter);
  // stands in for authMiddleware
  app.use(
    "/api/users",
    (req, _res, next) => {
      req.userId = userId;
      req.isGuest = false;
      next();
    },
    usersRouter,
  );
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(() => {
  server.close();
});
beforeEach(() => vi.clearAllMocks());

describe("profile picture routes", () => {
  it("uploads a picture sent as the body with its MIME type", async () => {
    const res = await fetch(`${base}/users/me/avatar`, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: png,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).avatarUpdatedAt).toEqual(expect.any(String));
    expect(db.avatar.upsert.mock.calls[0][0].create.mimeType).toBe("image/png");
  });

  it("serves a picture without a token, cacheable and safe", async () => {
    db.avatar.findUnique.mockResolvedValue({
      userId,
      mimeType: "image/png",
      data: new Uint8Array(png),
    });

    const res = await fetch(`${base}/avatars/${userId}?v=123`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(res.headers.get("content-security-policy")).toContain("sandbox");
    expect(Buffer.from(await res.arrayBuffer()).equals(png)).toBe(true);
  });

  it("answers 404 for users without a picture and 400 for bad ids", async () => {
    db.avatar.findUnique.mockResolvedValue(null);
    expect((await fetch(`${base}/avatars/${userId}`)).status).toBe(404);
    expect((await fetch(`${base}/avatars/not-an-id`)).status).toBe(400);
  });
});
