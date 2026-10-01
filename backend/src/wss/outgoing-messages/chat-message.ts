import {
  socketMap,
  userActiveChatroomMap,
  userWatchedChatroomsMap,
} from "../../lib/socketMaps.js";
import { MessagePayload } from "../../types/payloads.js";
import { handleNewNotification } from "./notification.js";
import { sendUpdateUnreadMessage } from "./update-unread-count.js";
import Prisma from "../../prisma.js";

// users with the chatroom open, or watching it (e.g. in a pop-out)
export const chatroomViewers = (chatroomId: string) =>
  new Set([
    ...(userActiveChatroomMap.getByValue(chatroomId) ?? []),
    ...userWatchedChatroomsMap.getWatchers(chatroomId),
  ]);

// Sends each member not in `skip` how many messages in the chatroom they
// haven't read
export const sendUnreadCounts = async (
  chatroomId: string,
  skip: Set<string>,
) => {
  const members = await Prisma.chatroomMember.findMany({
    where: { chatroomId },
    select: { memberId: true },
  });

  await Promise.all(
    members
      .filter(({ memberId }) => !skip.has(memberId))
      .map(async ({ memberId }) => {
        const member = await Prisma.chatroomMember.findUnique({
          where: { chatroomId_memberId: { chatroomId, memberId } },
          select: { lastViewedAt: true },
        });
        if (!member) return;

        const unreadMessages = await Prisma.message.count({
          where: {
            chatroomId,
            // `not` alone would skip messages from deleted users, whose
            // sender is null
            OR: [{ senderUserId: null }, { senderUserId: { not: memberId } }],
            createdAt: { gt: member.lastViewedAt },
          },
        });

        sendUpdateUnreadMessage(chatroomId, memberId, unreadMessages);
      }),
  );
};

export const sendChatMessage = async (message: MessagePayload) => {
  try {
    // users with the chatroom open, or watching it (e.g. in a pop-out), get
    // the message live and don't count it as unread
    const activeRecipients = chatroomViewers(message.chatroomId);

    console.log("activeRecipients before filter: ", activeRecipients);
    activeRecipients.forEach((activeUserId) => {
      const recipientSocket = socketMap.getByKey(activeUserId);
      if (!recipientSocket) return;
      console.log(
        "Active user in chatroom " + message.chatroomId + ": " + activeUserId,
      );
      recipientSocket.send(
        JSON.stringify({
          type: "chat-message",
          message: message,
        }),
      );
    });

    await sendUnreadCounts(message.chatroomId, activeRecipients);

    /*
    handleNewNotification(NotificationType.MENTION, recipient.memberId, {
      mention: {
        chatroomId: message.chatroomId,
        senderId: message.senderUserId,
        messageId: message.id,
      },
    });
    */
  } catch (err) {
    console.error(err);
  }
};
