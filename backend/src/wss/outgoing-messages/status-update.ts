import { Status } from "@prisma/client";
import { socketMap, userActiveChatroomMap } from "../../lib/socketMaps.js";
import Prisma from "../../prisma.js";

export const sendStatusUpdate = async (user: {
  username: string;
  id: string;
  status: Status;
}) => {
  const affectedChatrooms = await Prisma.chatroomMember.findMany({
    select: {
      chatroomId: true,
    },
    where: {
      memberId: user.id,
    },
  });

  affectedChatrooms.forEach((chatroom) => {
    const recipients = userActiveChatroomMap.getByValue(chatroom.chatroomId);
    recipients?.forEach((recipient) => {
      const socket = socketMap.getByKey(recipient);
      socket?.send(
        JSON.stringify({
          type: "status-update",
          chatroomId: chatroom.chatroomId,
          member: {
            memberId: user.id,
            member: {
              username: user.username,
              status: user.status,
            },
          },
        }),
      );
    });
  });
};
