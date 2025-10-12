import { PinnedGroupsPayload } from "../types/payloads.js";
import Prisma from "../prisma/prisma.js";
import {
  chatroomPinSchema,
  setPinnedGroupSchema,
} from "../validators/pinned-groups/pinnedGroupsValidation.js";
import z from "zod";

export const getPinnedGroups = async (
  userId: string
): Promise<PinnedGroupsPayload[]> => {
  const pinnedGroups = await Prisma.pinGroup.findMany({
    where: {
      userId,
    },
    include: {
      pinnedChatrooms: {
        select: {
          chatroomId: true,
          chatroom: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          pinnedIndex: "asc",
        },
      },
    },
  });

  return pinnedGroups;
};

export const createPinnedGroup = async (
  userId: string,
  data: z.infer<typeof setPinnedGroupSchema>
) => {
  const { name } = data;

  const verifyUser = await Prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (verifyUser?.isGuest === true) {
    throw new Error("Only users can create chatrooms");
  }

  if (!name) {
    throw new Error("Tried to create chatroom with empty title");
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

  await Prisma.pinGroup.create({
    data: {
      name,
      index: (existingPinnedGroupIndex?.index || 0) + 1,
      userId,
    },
  });
};

export const pinChatroom = async (
  userId: string,
  data: z.infer<typeof chatroomPinSchema>
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
      "Attempted pinning a chatroom that user is not a member of"
    );
  }

  if (pin) {
    const existingPinnedIndex = await Prisma.chatroomMember.findFirst({
      select: {
        pinnedIndex: true,
      },
      where: {
        memberId: userId,
      },
      orderBy: {
        chatroomIndex: "desc",
      },
    });

    await Prisma.chatroomMember.update({
      where: {
        chatroomId_memberId: {
          chatroomId,
          memberId: userId,
        },
      },
      data: {
        pinGroupId,
        pinnedIndex: (existingPinnedIndex?.pinnedIndex || 0) + 1,
      },
    });
  } else {
    await Prisma.chatroomMember.update({
      where: {
        chatroomId_memberId: {
          chatroomId,
          memberId: userId,
        },
      },
      data: {
        pinGroupId: null,
        pinnedIndex: null,
      },
    });
  }
};
