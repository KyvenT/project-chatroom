import {
  socketMap,
  userActiveChatroomMap,
  userWatchedChatroomsMap,
} from "../../lib/socketMaps.js";
import Prisma from "../../prisma.js";

export const sendTypingPresence = async (
  chatroomId: string,
  memberId: string,
) => {
  const user = await Prisma.user.findUnique({
    where: {
      id: memberId,
    },
  });

  if (!user) {
    console.error("user not found for typing presence");
    return;
  }

  // users with the chatroom open, or watching it in a pop-out
  const recipients = new Set([
    ...(userActiveChatroomMap.getByValue(chatroomId) ?? []),
    ...userWatchedChatroomsMap.getWatchers(chatroomId),
  ]);

  recipients.forEach((recipient) => {
    if (recipient === memberId) return;
    const socket = socketMap.getByKey(recipient);
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "typing-presence",
          userId: memberId,
          username: user?.username,
          chatroomId,
        }),
      );
    }
  });
};
