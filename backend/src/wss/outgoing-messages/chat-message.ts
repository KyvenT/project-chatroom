import { socketMap, userActiveChatroomMap } from "../../lib/socketMaps.js";
import { MessagePayload } from "../../types/payloads.js";
import { handleNewNotification } from "./notification.js";
import { sendUpdateUnreadMessage } from "./update-unread-count.js";
import Prisma from "../../prisma.js";

export const sendChatMessage = async (message: MessagePayload) => {
  try {
    const activeRecipients = userActiveChatroomMap.getByValue(
      message.chatroomId,
    );

    console.log("activeRecipients before filter: ", activeRecipients);
    activeRecipients?.forEach((activeUserId) => {
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

    const recipients = await Prisma.chatroomMember.findMany({
      where: {
        chatroomId: message.chatroomId,
      },
      select: { memberId: true },
    });
    const nonActiveRecipients = new Set(recipients);
    nonActiveRecipients.forEach((activeUserId) => {
      if (activeRecipients?.has(activeUserId.memberId)) {
        nonActiveRecipients.delete(activeUserId);
      }
    });

    nonActiveRecipients.forEach(async (recipient) => {
      const member = await Prisma.chatroomMember.findUnique({
        where: {
          chatroomId_memberId: {
            chatroomId: message.chatroomId,
            memberId: recipient.memberId,
          },
        },
        select: {
          lastViewedAt: true,
        },
      });

      if (!member) {
        console.error("member not found");
        return;
      }

      // handle unread message count sends
      const unreadMessages = await Prisma.message.count({
        where: {
          chatroomId: message.chatroomId,
          senderUserId: {
            not: recipient.memberId,
          },
          createdAt: {
            gt: member.lastViewedAt,
          },
        },
      });

      sendUpdateUnreadMessage(
        message.chatroomId,
        recipient.memberId,
        unreadMessages,
      );

      /*
      handleNewNotification(NotificationType.MENTION, recipient.memberId, {
        mention: {
          chatroomId: message.chatroomId,
          senderId: message.senderUserId,
          messageId: message.id,
        },
      });
      */
    });
  } catch (err) {
    console.error(err);
  }
};
