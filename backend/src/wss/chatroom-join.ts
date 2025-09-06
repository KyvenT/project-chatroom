import { socketMap } from "../lib/socketMaps.js";
import Prisma from "../prisma/prisma.js";

export const sendJoinChatroomEvent = async (
  chatroomId: string,
  memberId: string
) => {
  const chatroom = await Prisma.chatroomMember.findUnique({
    where: {
      chatroomId_memberId: {
        chatroomId,
        memberId,
      },
    },
    select: {
      chatroomId: true,
      lastViewedAt: true,
      chatroom: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!chatroom) {
    console.error("chatroom not found for sending join event");
    return;
  }

  const recipientSocket = socketMap.getByKey(memberId);
  try {
    recipientSocket?.send(JSON.stringify({ type: "join-chatroom", chatroom }));
  } catch (err) {
    console.error("failed to send join event" + err);
  }
};
