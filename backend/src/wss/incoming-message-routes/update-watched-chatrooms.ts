import WebSocket from "ws";
import Prisma from "../../prisma.js";
import { socketMap, userWatchedChatroomsMap } from "../../lib/socketMaps.js";
import { UpdateWatchedChatroomsMessage } from "../../types/ws-messages.js";

// Replaces the chatrooms the user watches besides their active one. Only
// chatrooms they're a member of are kept.
export const updateWatchedChatrooms = async (
  message: UpdateWatchedChatroomsMessage,
  ws: WebSocket,
) => {
  const userId = socketMap.getByValue(ws);
  if (!userId) return;

  try {
    const memberships = await Prisma.chatroomMember.findMany({
      where: {
        memberId: userId,
        chatroomId: { in: message.chatroomIds },
      },
      select: { chatroomId: true },
    });

    userWatchedChatroomsMap.set(
      userId,
      memberships.map((m) => m.chatroomId),
    );
  } catch (err) {
    console.error("failed to update watched chatrooms", err);
  }
};
