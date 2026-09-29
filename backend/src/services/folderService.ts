import z from "zod";
import Prisma from "../prisma.js";
import { FolderPayload } from "../types/payloads.js";
import {
  folderIdSchema,
  folderNameSchema,
  folderOrderSchema,
  moveChatroomToFolderSchema,
  renameFolderSchema,
} from "../validators/folders/folderValidation.js";

const folderSelect = { id: true, name: true, index: true } as const;

// throws unless the folder exists and belongs to the user
const verifyFolderOwner = async (userId: string, folderId: string) => {
  const folder = await Prisma.sidebarFolder.findUnique({
    where: {
      id: folderId,
    },
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  if (folder.userId !== userId) {
    throw new Error("Not detected as owner of folder");
  }
};

export const getFolders = async (userId: string): Promise<FolderPayload[]> => {
  return Prisma.sidebarFolder.findMany({
    where: {
      userId,
    },
    select: folderSelect,
    orderBy: {
      index: "asc",
    },
  });
};

export const createFolder = async (
  userId: string,
  data: z.infer<typeof folderNameSchema>,
): Promise<FolderPayload> => {
  const user = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user || user.isGuest) {
    throw new Error("Only users can create folders");
  }

  const lastFolder = await Prisma.sidebarFolder.findFirst({
    select: {
      index: true,
    },
    where: {
      userId,
    },
    orderBy: {
      index: "desc",
    },
  });

  return Prisma.sidebarFolder.create({
    data: {
      userId,
      name: data.name,
      index: (lastFolder?.index ?? 0) + 1,
    },
    select: folderSelect,
  });
};

export const renameFolder = async (
  userId: string,
  data: z.infer<typeof renameFolderSchema>,
) => {
  const { folderId, name } = data;

  await verifyFolderOwner(userId, folderId);

  await Prisma.sidebarFolder.update({
    where: {
      id: folderId,
    },
    data: {
      name,
    },
  });
};

export const deleteFolder = async (
  userId: string,
  data: z.infer<typeof folderIdSchema>,
) => {
  const { folderId } = data;

  await verifyFolderOwner(userId, folderId);

  // chatrooms in the folder go back to Chats (folderId is set to null)
  await Prisma.sidebarFolder.delete({
    where: {
      id: folderId,
    },
  });
};

export const moveChatroomToFolder = async (
  userId: string,
  data: z.infer<typeof moveChatroomToFolderSchema>,
) => {
  const { chatroomId, folderId } = data;

  const membership = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        chatroomId,
        memberId: userId,
      },
    },
  });

  if (!membership) {
    throw new Error("Not a member of chatroom");
  }

  if (folderId) {
    await verifyFolderOwner(userId, folderId);
  }

  await Prisma.chatroomMember.update({
    where: {
      chatroomId_memberId: {
        chatroomId,
        memberId: userId,
      },
    },
    data: {
      folderId,
    },
  });
};

// Reorders the chatrooms in a folder. They trade the sidebar positions they
// already hold, so chatrooms outside the folder keep their places.
export const setFolderOrder = async (
  userId: string,
  data: z.infer<typeof folderOrderSchema>,
) => {
  const { folderId, chatroomIds } = data;

  await verifyFolderOwner(userId, folderId);

  const members = await Prisma.chatroomMember.findMany({
    where: { memberId: userId, folderId },
    select: { chatroomId: true, chatroomIndex: true },
  });

  const current = members.map((m) => m.chatroomId);
  if (
    current.length !== chatroomIds.length ||
    new Set([...current, ...chatroomIds]).size !== current.length
  ) {
    throw new Error("Order doesn't match the folder's chatrooms");
  }

  const positions = members.map((m) => m.chatroomIndex).sort((a, b) => a - b);
  const where = (chatroomId: string) => ({
    chatroomId_memberId: { chatroomId, memberId: userId },
  });

  // (memberId, chatroomIndex) is unique, so park them on unused negative
  // indexes before giving each its new position
  await Prisma.$transaction([
    ...chatroomIds.map((chatroomId, i) =>
      Prisma.chatroomMember.update({
        where: where(chatroomId),
        data: { chatroomIndex: -1_000_000 - i },
      }),
    ),
    ...chatroomIds.map((chatroomId, i) =>
      Prisma.chatroomMember.update({
        where: where(chatroomId),
        data: { chatroomIndex: positions[i] },
      }),
    ),
  ]);
};
