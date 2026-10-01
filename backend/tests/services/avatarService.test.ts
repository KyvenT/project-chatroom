import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    $transaction: vi.fn((ops) => Promise.all(ops)),
    avatar: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: { update: vi.fn() },
  },
}));

import Prisma from "../../src/prisma.js";
import {
  getAvatar,
  removeAvatar,
  setAvatar,
} from "../../src/services/avatarService.js";
import { checkAvatar, MAX_AVATAR_SIZE } from "../../src/lib/avatars.js";

const db = Prisma as any;
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

beforeEach(() => vi.clearAllMocks());

describe("checkAvatar", () => {
  it("accepts still images whose bytes match their type", () => {
    expect(checkAvatar("image/png", png)).toEqual({ ok: true });
  });

  it("refuses other types, disguised files and large pictures", () => {
    expect(checkAvatar("image/gif", Buffer.from("GIF89a"))).toMatchObject({
      ok: false,
      status: 415,
    });
    expect(checkAvatar("image/svg+xml", Buffer.from("<svg/>"))).toMatchObject({
      ok: false,
    });
    expect(checkAvatar("image/png", Buffer.from("<html>"))).toMatchObject({
      ok: false,
      status: 415,
    });
    expect(
      checkAvatar(
        "image/png",
        Buffer.concat([png, Buffer.alloc(MAX_AVATAR_SIZE)]),
      ),
    ).toMatchObject({ ok: false, status: 413 });
  });
});

describe("setAvatar", () => {
  it("stores the picture and records when it changed", async () => {
    const when = await setAvatar("u1", false, "image/png", png);

    expect(db.avatar.upsert.mock.calls[0][0]).toMatchObject({
      where: { userId: "u1" },
      create: { userId: "u1", mimeType: "image/png" },
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { avatarUpdatedAt: when },
    });
  });

  it("refuses guests and bad pictures without storing anything", async () => {
    await expect(setAvatar("g1", true, "image/png", png)).rejects.toMatchObject(
      { status: 403 },
    );
    await expect(
      setAvatar("u1", false, "text/html", Buffer.from("<b>")),
    ).rejects.toMatchObject({ status: 415 });
    expect(db.avatar.upsert).not.toHaveBeenCalled();
  });
});

describe("removeAvatar and getAvatar", () => {
  it("removes the picture and clears its version", async () => {
    await removeAvatar("u1");
    expect(db.avatar.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { avatarUpdatedAt: null },
    });
  });

  it("answers not found when there's no picture", async () => {
    db.avatar.findUnique.mockResolvedValue(null);
    await expect(getAvatar("u1")).rejects.toMatchObject({ status: 404 });
  });
});
