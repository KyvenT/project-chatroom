import { socketMap } from "../lib/socketMaps.js";
import Prisma from "../prisma/prisma.js";

export const updateLastViewedAt = async (
  chatroomId: string,
  userId: string
) => {
  const update = await Prisma.chatroomMember.update({
    data: { lastViewedAt: new Date() },
    where: {
      chatroomId_memberId: {
        chatroomId,
        memberId: userId,
      },
    },
  });
};

export const sendUpdateUnreadMessage = (
  chatroomId: string,
  userId: string,
  unreadMessageCount: number
) => {
  const recipientSocket = socketMap.getByKey(userId);
  if (recipientSocket) {
    recipientSocket.send(
      JSON.stringify({
        type: "unread-update",
        chatroomId,
        unreadMessages: unreadMessageCount,
      })
    );
  }
};
