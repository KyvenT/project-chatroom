import { PinnedGroupsPayload } from "../types/payloads.js";
import Prisma from "../prisma.js";
import {
  chatroomPinSchema,
  editPinnedGroupSchema,
  PinnedGroupNameSchema,
  pinGroupIdSchema,
  pinnedGroupOrderSchema,
  reorderPinnedGroupChatroomsSchema,
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
    orderBy: {
      index: "asc",
    },
  });

  return pinnedGroups;
};

// throws unless the pin group exists and belongs to the user
const verifyPinGroupOwner = async (userId: string, pinGroupId: string) => {
  const pinGroup = await Prisma.pinGroup.findUnique({
    where: {
      id: pinGroupId,
    },
  });

  if (!pinGroup) {
    throw new Error("Pinned group not found");
  }

  if (pinGroup.userId !== userId) {
    throw new Error("Not detected as owner of pin group");
  }
};

export const createPinnedGroup = async (
  userId: string,
  data: z.infer<typeof PinnedGroupNameSchema>,
): Promise<PinnedGroupsPayload> => {
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
      name: data.name,
      index,
      userId,
    },
  });

  return { ...pinnedGroup, chatrooms: [] };
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

  await verifyPinGroupOwner(userId, pinGroupId);

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

  await verifyPinGroupOwner(userId, pinGroupId);

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

    try {
      await Prisma.memberPinnedGroups.create({
        data: {
          pinGroupId,
          chatroomId,
          pinnedIndex: (existingPinnedIndex?.pinnedIndex || 0) + 1,
        },
      });
    } catch (error: any) {
      // already pinned in this group
      if (error.code !== "P2002") throw error;
    }
  } else {
    // deleteMany so unpinning something that isn't pinned is a no-op
    await Prisma.memberPinnedGroups.deleteMany({
      where: {
        chatroomId,
        pinGroupId,
      },
    });
  }
};

export const deletePinnedGroup = async (
  userId: string,
  data: z.infer<typeof pinGroupIdSchema>,
) => {
  const { pinGroupId } = data;

  await verifyPinGroupOwner(userId, pinGroupId);

  // pinned chatrooms in the group are removed by the cascade
  await Prisma.pinGroup.delete({
    where: {
      id: pinGroupId,
    },
  });
};

export const swapPinnedChatrooms = async (
  userId: string,
  data: z.infer<typeof reorderPinnedGroupChatroomsSchema>,
) => {
  const { pinGroupId, chatroomId1, chatroomId2 } = data;

  const verifyPinGroup = await Prisma.pinGroup.findUnique({
    where: {
      id: pinGroupId,
    },
  });

  if (verifyPinGroup?.userId !== userId) {
    throw new Error("Not detected as owner of pin group");
  }

  const pinnedChatroom1 = await Prisma.memberPinnedGroups.findUnique({
    where: {
      chatroomId_pinGroupId: {
        chatroomId: chatroomId1,
        pinGroupId,
      },
    },
  });

  const pinnedChatroom2 = await Prisma.memberPinnedGroups.findUnique({
    where: {
      chatroomId_pinGroupId: {
        chatroomId: chatroomId2,
        pinGroupId,
      },
    },
  });

  if (!pinnedChatroom1 || !pinnedChatroom2) {
    throw new Error("One or both pinned chatrooms not found");
  }

  await Prisma.$transaction([
    Prisma.memberPinnedGroups.update({
      where: {
        chatroomId_pinGroupId: {
          chatroomId: pinnedChatroom1.chatroomId,
          pinGroupId,
        },
      },
      data: {
        pinnedIndex: pinnedChatroom2.pinnedIndex,
      },
    }),
    Prisma.memberPinnedGroups.update({
      where: {
        chatroomId_pinGroupId: {
          chatroomId: pinnedChatroom2.chatroomId,
          pinGroupId,
        },
      },
      data: {
        pinnedIndex: pinnedChatroom1.pinnedIndex,
      },
    }),
  ]);
};

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && new Set([...a, ...b]).size === a.length;

export const setPinnedGroupOrder = async (
  userId: string,
  data: z.infer<typeof pinnedGroupOrderSchema>,
) => {
  const { pinGroupId, chatroomIds } = data;

  await verifyPinGroupOwner(userId, pinGroupId);

  const pinned = await Prisma.memberPinnedGroups.findMany({
    where: { pinGroupId },
    select: { chatroomId: true },
  });

  // the new order has to cover exactly what's pinned, so nothing is lost
  // when a pin changed meanwhile
  if (
    !sameIds(
      pinned.map((p) => p.chatroomId),
      chatroomIds,
    )
  ) {
    throw new Error("Order doesn't match the group's pinned chatrooms");
  }

  await Prisma.$transaction(
    chatroomIds.map((chatroomId, i) =>
      Prisma.memberPinnedGroups.update({
        where: { chatroomId_pinGroupId: { chatroomId, pinGroupId } },
        data: { pinnedIndex: i + 1 },
      }),
    ),
  );
};
