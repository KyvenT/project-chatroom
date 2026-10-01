import { Status } from "@prisma/client";
import { socketMap } from "../../lib/socketMaps.js";
import Prisma from "../../prisma.js";
import { chatroomViewers } from "./chat-message.js";

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
    // users with the chatroom open, or watching it (e.g. in a pop-out)
    const recipients = chatroomViewers(chatroom.chatroomId);
    recipients.forEach((recipient) => {
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
