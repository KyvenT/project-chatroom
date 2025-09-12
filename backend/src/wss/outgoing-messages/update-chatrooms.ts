import { socketMap } from "../../lib/socketMaps.js";
import Prisma from "../../prisma/prisma.js";
import { ChatroomPayload } from "../../types/payloads.js";

export const sendUpdateChatrooms = async (
  chatroomId: string,
  memberId: string,
  actionType: "JOIN" | "LEAVE"
) => {
  const messageOptions: any = {};
  switch (actionType) {
    case "JOIN":
      const chatroom = (await Prisma.chatroomMember.findUnique({
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
              allowMembersToInvite: true,
            },
          },
        },
      })) as ChatroomPayload;

      if (!chatroom) {
        console.error("chatroom not found for sending join event");
        return;
      }

      messageOptions.action = "join-chatroom";
      messageOptions.chatroom = chatroom;
      break;
    case "LEAVE":
      messageOptions.action = "leave-chatroom";
      messageOptions.chatroomId = chatroomId;
      break;
    default:
      return;
  }

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
};
