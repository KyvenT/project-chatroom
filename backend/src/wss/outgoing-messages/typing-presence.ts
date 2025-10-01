import { socketMap, userActiveChatroomMap } from "../../lib/socketMaps.js";
import Prisma from "../../prisma/prisma.js";

export const sendTypingPresence = async (
  chatroomId: string,
  memberId: string
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

  const activeRecipients = userActiveChatroomMap.getByValue(chatroomId);

  activeRecipients?.forEach((recipient) => {
    if (recipient === memberId) return;
    const socket = socketMap.getByKey(recipient);
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "typing-presence",
          userId: memberId,
          username: user?.username,
        })
      );
    }
  });
};
