import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    chatroomMember: { findUnique: vi.fn() },
    pinGroup: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    memberPinnedGroups: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn((args) => args),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import Prisma from "../../src/prisma.js";
import {
  createPinnedGroup,
  deletePinnedGroup,
  editPinnedGroup,
  getPinnedGroups,
  pinChatroom,
  setPinnedGroupOrder,
} from "../../src/services/pinnedGroupsService.js";

const db = Prisma as any;

beforeEach(() => vi.clearAllMocks());

describe("getPinnedGroups", () => {
  it("returns groups in their saved order", async () => {
    db.pinGroup.findMany.mockResolvedValue([]);
    await getPinnedGroups("u1");
    expect(db.pinGroup.findMany.mock.calls[0][0].orderBy).toEqual({
      index: "asc",
    });
  });
});

describe("createPinnedGroup", () => {
  it("creates a group with the given name after the last one", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: false });
    db.pinGroup.findFirst.mockResolvedValue({ index: 2 });
    db.pinGroup.create.mockResolvedValue({ id: "g1", name: "Work", index: 3 });

    expect(await createPinnedGroup("u1", { name: "Work" })).toEqual({
      id: "g1",
      name: "Work",
      index: 3,
      chatrooms: [],
    });
    expect(db.pinGroup.create.mock.calls[0][0].data).toEqual({
      name: "Work",
      index: 3,
      userId: "u1",
    });
  });

  it("rejects guests", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: true });
    await expect(createPinnedGroup("u1", { name: "Work" })).rejects.toThrow(
      "Only users can create pinned groups",
    );
    expect(db.pinGroup.create).not.toHaveBeenCalled();
  });
});

describe("editPinnedGroup", () => {
  it("rejects renaming someone else's group", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: false });
    db.pinGroup.findUnique.mockResolvedValue({ id: "g1", userId: "other" });

    await expect(
      editPinnedGroup("u1", { pinGroupId: "g1", name: "Mine" }),
    ).rejects.toThrow("Not detected as owner of pin group");
    expect(db.pinGroup.update).not.toHaveBeenCalled();
  });
});

describe("pinChatroom", () => {
  const pin = (pin: boolean) => ({ chatroomId: "c1", pinGroupId: "g1", pin });

  beforeEach(() => {
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
    db.pinGroup.findUnique.mockResolvedValue({ id: "g1", userId: "u1" });
  });

  it("pins into the user's own group after the last pinned chatroom", async () => {
    db.memberPinnedGroups.findFirst.mockResolvedValue({ pinnedIndex: 4 });

    await pinChatroom("u1", pin(true));
    expect(db.memberPinnedGroups.create.mock.calls[0][0].data).toEqual({
      pinGroupId: "g1",
      chatroomId: "c1",
      pinnedIndex: 5,
    });
  });

  it("rejects pinning into someone else's group", async () => {
    db.pinGroup.findUnique.mockResolvedValue({ id: "g1", userId: "other" });

    await expect(pinChatroom("u1", pin(true))).rejects.toThrow(
      "Not detected as owner of pin group",
    );
    expect(db.memberPinnedGroups.create).not.toHaveBeenCalled();
  });

  it("rejects a group that doesn't exist", async () => {
    db.pinGroup.findUnique.mockResolvedValue(null);
    await expect(pinChatroom("u1", pin(true))).rejects.toThrow(
      "Pinned group not found",
    );
  });

  it("rejects chatrooms the user isn't a member of", async () => {
    db.chatroomMember.findUnique.mockResolvedValue(null);
    await expect(pinChatroom("u1", pin(true))).rejects.toThrow(
      "Attempted pinning a chatroom that user is not a member of",
    );
  });

  it("treats pinning an already pinned chatroom as done", async () => {
    db.memberPinnedGroups.findFirst.mockResolvedValue(null);
    db.memberPinnedGroups.create.mockRejectedValue({ code: "P2002" });

    await expect(pinChatroom("u1", pin(true))).resolves.toBeUndefined();
  });

  it("unpins without failing when the chatroom wasn't pinned", async () => {
    db.memberPinnedGroups.deleteMany.mockResolvedValue({ count: 0 });

    await expect(pinChatroom("u1", pin(false))).resolves.toBeUndefined();
    expect(db.memberPinnedGroups.deleteMany.mock.calls[0][0].where).toEqual({
      chatroomId: "c1",
      pinGroupId: "g1",
    });
  });
});

describe("deletePinnedGroup", () => {
  it("deletes the user's own group", async () => {
    db.pinGroup.findUnique.mockResolvedValue({ id: "g1", userId: "u1" });

    await deletePinnedGroup("u1", { pinGroupId: "g1" });
    expect(db.pinGroup.delete.mock.calls[0][0].where).toEqual({ id: "g1" });
  });

  it("rejects deleting someone else's group", async () => {
    db.pinGroup.findUnique.mockResolvedValue({ id: "g1", userId: "other" });

    await expect(deletePinnedGroup("u1", { pinGroupId: "g1" })).rejects.toThrow(
      "Not detected as owner of pin group",
    );
    expect(db.pinGroup.delete).not.toHaveBeenCalled();
  });
});

describe("setPinnedGroupOrder", () => {
  beforeEach(() => {
    db.pinGroup.findUnique.mockResolvedValue({ id: "g1", userId: "u1" });
    db.memberPinnedGroups.findMany.mockResolvedValue([
      { chatroomId: "a" },
      { chatroomId: "b" },
      { chatroomId: "c" },
    ]);
  });

  it("numbers the group's chatrooms in the new order", async () => {
    await setPinnedGroupOrder("u1", {
      pinGroupId: "g1",
      chatroomIds: ["c", "a", "b"],
    });

    const updates = db.$transaction.mock.calls[0][0];
    expect(
      updates.map((u: any) => [
        u.where.chatroomId_pinGroupId.chatroomId,
        u.data.pinnedIndex,
      ]),
    ).toEqual([
      ["c", 1],
      ["a", 2],
      ["b", 3],
    ]);
  });

  it("rejects an order that leaves out or adds a chatroom", async () => {
    await expect(
      setPinnedGroupOrder("u1", { pinGroupId: "g1", chatroomIds: ["a", "b"] }),
    ).rejects.toThrow("Order doesn't match the group's pinned chatrooms");
    await expect(
      setPinnedGroupOrder("u1", {
        pinGroupId: "g1",
        chatroomIds: ["a", "b", "x"],
      }),
    ).rejects.toThrow("Order doesn't match the group's pinned chatrooms");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects someone else's group", async () => {
    db.pinGroup.findUnique.mockResolvedValue({ id: "g1", userId: "other" });
    await expect(
      setPinnedGroupOrder("u1", {
        pinGroupId: "g1",
        chatroomIds: ["a", "b", "c"],
      }),
    ).rejects.toThrow("Not detected as owner of pin group");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
