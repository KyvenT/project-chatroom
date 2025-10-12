import { PinnedGroupsPayload } from "../types/payloads.js";
import Prisma from "../prisma/prisma.js";

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
              messages: {
                include: {
                  senderUser: {
                    select: {
                      username: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 5,
              },
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
