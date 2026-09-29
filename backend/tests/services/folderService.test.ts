import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/prisma.js", () => ({
  default: {
    user: { findUnique: vi.fn() },
    chatroomMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn((args) => args),
    },
    $transaction: vi.fn(),
    sidebarFolder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import Prisma from "../../src/prisma.js";
import {
  createFolder,
  deleteFolder,
  getFolders,
  moveChatroomToFolder,
  renameFolder,
  setFolderOrder,
} from "../../src/services/folderService.js";

const db = Prisma as any;
const ownFolder = { id: "f1", userId: "u1" };
const othersFolder = { id: "f1", userId: "other" };

beforeEach(() => vi.clearAllMocks());

describe("getFolders", () => {
  it("returns the user's folders in order", async () => {
    db.sidebarFolder.findMany.mockResolvedValue([]);
    await getFolders("u1");

    const query = db.sidebarFolder.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ userId: "u1" });
    expect(query.orderBy).toEqual({ index: "asc" });
  });
});

describe("createFolder", () => {
  it("creates a named folder after the user's last one", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: false });
    db.sidebarFolder.findFirst.mockResolvedValue({ index: 2 });
    db.sidebarFolder.create.mockResolvedValue({
      id: "f3",
      name: "Work",
      index: 3,
    });

    expect(await createFolder("u1", { name: "Work" })).toEqual({
      id: "f3",
      name: "Work",
      index: 3,
    });
    expect(db.sidebarFolder.create.mock.calls[0][0].data).toEqual({
      userId: "u1",
      name: "Work",
      index: 3,
    });
  });

  it("starts at index 1 for the first folder", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: false });
    db.sidebarFolder.findFirst.mockResolvedValue(null);

    await createFolder("u1", { name: "Work" });
    expect(db.sidebarFolder.create.mock.calls[0][0].data.index).toBe(1);
  });

  it("rejects guests", async () => {
    db.user.findUnique.mockResolvedValue({ isGuest: true });
    await expect(createFolder("u1", { name: "Work" })).rejects.toThrow(
      "Only users can create folders",
    );
    expect(db.sidebarFolder.create).not.toHaveBeenCalled();
  });
});

describe("renameFolder", () => {
  it("renames the user's own folder", async () => {
    db.sidebarFolder.findUnique.mockResolvedValue(ownFolder);
    await renameFolder("u1", { folderId: "f1", name: "Friends" });

    expect(db.sidebarFolder.update.mock.calls[0][0]).toEqual({
      where: { id: "f1" },
      data: { name: "Friends" },
    });
  });

  it("rejects someone else's folder", async () => {
    db.sidebarFolder.findUnique.mockResolvedValue(othersFolder);
    await expect(
      renameFolder("u1", { folderId: "f1", name: "Mine" }),
    ).rejects.toThrow("Not detected as owner of folder");
    expect(db.sidebarFolder.update).not.toHaveBeenCalled();
  });
});

describe("deleteFolder", () => {
  it("deletes the user's own folder", async () => {
    db.sidebarFolder.findUnique.mockResolvedValue(ownFolder);
    await deleteFolder("u1", { folderId: "f1" });
    expect(db.sidebarFolder.delete.mock.calls[0][0].where).toEqual({
      id: "f1",
    });
  });

  it("rejects a folder that doesn't exist", async () => {
    db.sidebarFolder.findUnique.mockResolvedValue(null);
    await expect(deleteFolder("u1", { folderId: "f1" })).rejects.toThrow(
      "Folder not found",
    );
    expect(db.sidebarFolder.delete).not.toHaveBeenCalled();
  });
});

describe("moveChatroomToFolder", () => {
  beforeEach(() => {
    db.chatroomMember.findUnique.mockResolvedValue({ memberId: "u1" });
  });

  it("moves a chatroom into the user's folder", async () => {
    db.sidebarFolder.findUnique.mockResolvedValue(ownFolder);
    await moveChatroomToFolder("u1", { chatroomId: "c1", folderId: "f1" });

    expect(db.chatroomMember.update.mock.calls[0][0]).toEqual({
      where: { chatroomId_memberId: { chatroomId: "c1", memberId: "u1" } },
      data: { folderId: "f1" },
    });
  });

  it("moves a chatroom out of its folder with a null folderId", async () => {
    await moveChatroomToFolder("u1", { chatroomId: "c1", folderId: null });

    expect(db.sidebarFolder.findUnique).not.toHaveBeenCalled();
    expect(db.chatroomMember.update.mock.calls[0][0].data).toEqual({
      folderId: null,
    });
  });

  it("rejects moving into someone else's folder", async () => {
    db.sidebarFolder.findUnique.mockResolvedValue(othersFolder);
    await expect(
      moveChatroomToFolder("u1", { chatroomId: "c1", folderId: "f1" }),
    ).rejects.toThrow("Not detected as owner of folder");
    expect(db.chatroomMember.update).not.toHaveBeenCalled();
  });

  it("rejects chatrooms the user isn't a member of", async () => {
    db.chatroomMember.findUnique.mockResolvedValue(null);
    await expect(
      moveChatroomToFolder("u1", { chatroomId: "c1", folderId: null }),
    ).rejects.toThrow("Not a member of chatroom");
    expect(db.chatroomMember.update).not.toHaveBeenCalled();
  });
});

describe("setFolderOrder", () => {
  beforeEach(() => {
    db.sidebarFolder.findUnique.mockResolvedValue(ownFolder);
    // sidebar positions 2, 5 and 9 belong to the folder's chatrooms
    db.chatroomMember.findMany.mockResolvedValue([
      { chatroomId: "a", chatroomIndex: 2 },
      { chatroomId: "b", chatroomIndex: 5 },
      { chatroomId: "c", chatroomIndex: 9 },
    ]);
  });

  it("gives the folder's chatrooms their positions in the new order", async () => {
    await setFolderOrder("u1", {
      folderId: "f1",
      chatroomIds: ["c", "a", "b"],
    });

    const updates = db.$transaction.mock.calls[0][0].map((u: any) => [
      u.where.chatroomId_memberId.chatroomId,
      u.data.chatroomIndex,
    ]);
    // parked on unused negative indexes first, then placed
    expect(updates.slice(0, 3).every(([, i]: [string, number]) => i < 0)).toBe(
      true,
    );
    expect(updates.slice(3)).toEqual([
      ["c", 2],
      ["a", 5],
      ["b", 9],
    ]);
  });

  it("rejects an order that doesn't match the folder", async () => {
    await expect(
      setFolderOrder("u1", { folderId: "f1", chatroomIds: ["a", "b"] }),
    ).rejects.toThrow("Order doesn't match the folder's chatrooms");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects someone else's folder", async () => {
    db.sidebarFolder.findUnique.mockResolvedValue(othersFolder);
    await expect(
      setFolderOrder("u1", { folderId: "f1", chatroomIds: ["a", "b", "c"] }),
    ).rejects.toThrow("Not detected as owner of folder");
  });
});
