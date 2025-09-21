import { socketMap } from "../../lib/socketMaps.js";
import Prisma from "../../prisma/prisma.js";
import { sendUpdateMembers } from "./update-members.js";

export type chatroomUpdateActions = "JOIN" | "LEAVE" | "UPDATE";

export const sendUpdateChatrooms = async (
  chatroomId: string,
  memberId: string,
  actionType: chatroomUpdateActions
) => {
  const messageOptions: any = {};
  switch (actionType) {
    case "JOIN":
    case "UPDATE":
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
              ownerId: true,
              privacy: true,
            },
          },
        },
      });

      messageOptions.chatroom = chatroom;
      break;
    case "LEAVE":
      messageOptions.chatroomId = chatroomId;
      break;
    default:
      return;
  }

  messageOptions.action = actionType;

  const recipientSocket = socketMap.getByKey(memberId);
  try {
    recipientSocket?.send(
      JSON.stringify({
        type: "update-chatrooms",
        ...messageOptions,
      })
    );
  } catch (err) {
    console.error("failed to send join event" + err);
  }

  if (actionType === "UPDATE") return;

  sendUpdateMembers(chatroomId, memberId, actionType);
};
