import WebSocket from "ws";
import { socketMap, userActiveChatroomMap } from "../../lib/socketMaps.js";
import { UpdateActiveChatroomMessage } from "../../types/ws-messages.js";
import {
  sendUpdateUnreadMessage,
  updateLastViewedAt,
} from "../update-unread-count.js";
import Prisma from "../../prisma/prisma.js";

export const updateActiveChatroom = async (
  message: UpdateActiveChatroomMessage,
  ws: WebSocket
) => {
  try {
    const userId = socketMap.getByValue(ws);
    if (!userId) {
      ws.send(JSON.stringify({ error: "User not authenticated" }));
      return;
    }
    const { chatroomId } = message;

    const prevChatroom = userActiveChatroomMap.getByKey(userId);
    userActiveChatroomMap.set(userId, chatroomId);

    if (!prevChatroom) return;

    const verifyPrevPromise = Prisma.chatroomMember.findUnique({
      where: {
        chatroomId_memberId: {
          chatroomId: prevChatroom,
          memberId: userId,
        },
      },
    });

    const verifyNextPromise = Prisma.chatroomMember.findUnique({
      where: {
        chatroomId_memberId: {
          chatroomId: prevChatroom,
          memberId: userId,
        },
      },
    });

    const [verifyPrev, verifyNext] = await Promise.all([
      verifyPrevPromise,
      verifyNextPromise,
    ]);

    if (verifyPrev) {
      updateLastViewedAt(prevChatroom, userId);
    }
    if (verifyNext) {
      updateLastViewedAt(chatroomId, userId);
    }
    sendUpdateUnreadMessage(chatroomId, userId, 0);

    console.log(
      "Updated active chatroom for user " + userId + " to " + chatroomId
    );
    console.log("Current active chatrooms: ");
    userActiveChatroomMap.forEach((value, key) => {
      console.log(key + ": " + value);
    });
    ws.send(
      JSON.stringify({
        type: "feedback",
        message: "Active chatroom updated to " + chatroomId,
      })
    );
  } catch (err) {
    console.error(err);
    ws.send(
      JSON.stringify({ error: "Failed to update active chatroom: " + err })
    );
  }
};
