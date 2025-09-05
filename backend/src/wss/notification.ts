import Prisma from "../prisma/prisma.js";
import type {
  Notification,
  NotificationType,
  Message,
  Invite,
} from "@prisma/client";
import { socketMap } from "../lib/socketMaps.js";
import { InvitePayload } from "../types/payloads.js";

export interface NotificationOptions {
  chatroomId?: string;
  senderId?: string;
  messageId?: string;
  invite?: InvitePayload;
}

export const createNotification = async (
  type: NotificationType,
  userId: string,
  options: NotificationOptions = {}
) => {
  const queryOptions: any = {};
  switch (type) {
    case "INVITE":
      if (!options.invite) {
        console.error("Invite is required for INVITE notification");
      }
      queryOptions.inviteId = options.invite?.id;
      break;
    case "MESSAGE":
      if (!options.messageId) {
        console.error("Message is required for MESSAGE notification");
      }
      queryOptions.messageId = options.messageId;
      break;
    default:
      console.error("Invalid notification type");
  }

  const newNotification: Notification = await Prisma.notification.create({
    data: {
      type,
      userId,
      ...queryOptions,
    },
  });

  return newNotification;
};

export const sendNotification = async (
  notification: Notification,
  options: NotificationOptions = {}
) => {
  try {
    const recipientSocket = socketMap.getByKey(notification.userId);
    if (recipientSocket) {
      recipientSocket.send(
        JSON.stringify({
          type: "notification",
          notification: {
            id: notification.id,
            type: notification.type,
            createdAt: notification.createdAt,
            payload: {
              chatroom: options.chatroomId,
              sender: options.senderId,
              messageId: options.messageId,
              invite: options.invite,
            },
          },
        })
      );
    }
  } catch (err) {
    console.error("Failed to send notification via WebSocket: " + err);
  }
};

export const handleNewNotification = async (
  type: NotificationType,
  userId: string,
  options: NotificationOptions = {}
) => {
  try {
    const notification = await createNotification(type, userId, options);
    await sendNotification(notification, options);
    return notification;
  } catch (err) {
    console.error("Error handling new notification: " + err);
  }
};
