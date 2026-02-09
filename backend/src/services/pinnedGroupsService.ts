import { PinnedGroupsPayload } from "../types/payloads.js";
import Prisma from "../prisma.js";
import {
  chatroomPinSchema,
  editPinnedGroupSchema,
  PinnedGroupNameSchema,
} from "../validators/pinned-groups/pinnedGroupsValidation.js";
import z from "zod";

export const getPinnedGroups = async (
  userId: string,
): Promise<PinnedGroupsPayload[]> => {
  const pinnedGroups = await Prisma.pinGroup.findMany({
    where: {
      userId,
    },
    include: {
      chatrooms: {
        select: {
          chatroomId: true,
          chatroom: {
            select: {
              title: true,
            },
          },
          pinnedIndex: true,
        },
        orderBy: {
          pinnedIndex: "asc",
        },
      },
    },
  });

  return pinnedGroups;
};

export const createPinnedGroup = async (userId: string) => {
  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (verifyUser?.isGuest === true) {
    throw new Error("Only users can create pinned groups");
  }

  const existingPinnedGroupIndex = await Prisma.pinGroup.findFirst({
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

  const index = (existingPinnedGroupIndex?.index || 0) + 1;

  const pinnedGroup = await Prisma.pinGroup.create({
    data: {
      name: "Untitled " + index,
      index,
      userId,
    },
  });

  return pinnedGroup;
};

export const editPinnedGroup = async (
  userId: string,
  data: z.infer<typeof editPinnedGroupSchema>,
) => {
  const { name, pinGroupId } = data;

  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (verifyUser?.isGuest === true) {
    throw new Error("Only users can edit pinned groups");
  }

  if (!name) {
    throw new Error("Tried to edit pinned group with empty title");
  }

  const pinGroup = await Prisma.pinGroup.findUnique({
    where: {
      id: pinGroupId,
    },
  });

  if (pinGroup?.userId !== userId) {
    throw new Error("Not detected as owner of pin group");
  }

  await Prisma.pinGroup.update({
    where: {
      id: pinGroupId,
    },
    data: {
      name,
    },
  });
};

export const pinChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomPinSchema>,
) => {
  const { chatroomId, pinGroupId, pin } = data;

  const verify = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        memberId: userId,
        chatroomId,
      },
    },
  });

  if (!verify) {
    throw new Error(
      "Attempted pinning a chatroom that user is not a member of",
    );
  }

  if (pin) {
    const existingPinnedIndex = await Prisma.memberPinnedGroups.findFirst({
      select: {
        pinnedIndex: true,
      },
      where: {
        pinGroupId: pinGroupId,
      },
      orderBy: {
        pinnedIndex: "desc",
      },
    });

    await Prisma.memberPinnedGroups.create({
      data: {
        pinGroupId,
        chatroomId,
        pinnedIndex: (existingPinnedIndex?.pinnedIndex || 0) + 1,
      },
    });
  } else {
    await Prisma.memberPinnedGroups.delete({
      where: {
        chatroomId_pinGroupId: {
          chatroomId,
          pinGroupId,
        },
      },
    });
  }
};
