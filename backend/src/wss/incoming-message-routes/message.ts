import Prisma from "../../prisma/prisma.js";
import WebSocket from "ws";
import { ChatMessage } from "../../types/ws-messages.js";
import { socketMap, userActiveChatroomMap } from "../../lib/socketMaps.js";
import { NotificationType, type Message } from "@prisma/client";
import { handleNewNotification } from "../outgoing-messages/notification.js";
import { sendUpdateUnreadMessage } from "../outgoing-messages/update-unread-count.js";
import { MessagePayload } from "../../types/payloads.js";

const createMessage = async (
  userId: string,
  message: ChatMessage,
  ws: WebSocket
): Promise<MessagePayload | undefined> => {
  try {
    const createdMessage = (await Prisma.message.create({
      data: {
        content: message.content,
        chatroomId: message.chatroomId,
        senderUserId: userId,
      },
      include: {
        senderUser: {
          select: {
            username: true,
          },
        },
      },
    })) as Message & { senderUser: { username: string } };

    ws.send(
      JSON.stringify({
        type: "feedback",
        message:
          "message sent (" +
          createdMessage.id +
          ", " +
          createdMessage.createdAt +
          ")",
      })
    );
    return createdMessage;
  } catch (err) {
    console.error(err);
    ws.send(
      JSON.stringify({
        type: "feedback",
        message: "message failed to send (" + err + ")",
      })
    );
  }
};

const sendToRecipients = async (message: MessagePayload) => {
  try {
    const activeRecipients = userActiveChatroomMap.getByValue(
      message.chatroomId
    );

    console.log("activeRecipients before filter: ", activeRecipients);
    activeRecipients?.forEach((activeUserId) => {
      const recipientSocket = socketMap.getByKey(activeUserId);
      if (recipientSocket) {
        console.log(
          "Active user in chatroom " + message.chatroomId + ": " + activeUserId
        );
        recipientSocket.send(
          JSON.stringify({
            type: "chat-message",
            message: {
              id: message.id,
              content: message.content,
              chatroomId: message.chatroomId,
              senderUserId: message.senderUserId,
              createdAt: message.createdAt,
              senderUser: {
                username: message.senderUser.username,
              },
              editedAt: message.editedAt,
            },
          })
        );
      }
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
        unreadMessages
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

export const handleChatMessage = async (
  message: ChatMessage,
  ws: WebSocket
) => {
  console.log(message.content);
  const user = socketMap.getByValue(ws);

  if (!user) {
    console.error("uh oh socket not mapped to a user");
    return;
  }
  const createdMessage = await createMessage(user, message, ws);
  if (!createdMessage) {
    console.error("message creation failed");
    return;
  }
  sendToRecipients(createdMessage);
};
