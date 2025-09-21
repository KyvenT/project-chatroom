import { socketMap } from "../../lib/socketMaps.js";
import Prisma from "../../prisma/prisma.js";

export const updateLastViewedAt = async (
  chatroomId: string,
  userId: string
) => {
  return Prisma.chatroomMember.update({
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
        type: "notification",
        notification: {
          type: "NEW_MESSAGE",
          payload: {
            chatroomId,
            unreadMessages: unreadMessageCount,
          },
        },
      })
    );
  }
};
