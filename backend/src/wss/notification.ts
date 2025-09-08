import Prisma from "../prisma/prisma.js";
import { Notification, NotificationType } from "@prisma/client";
import { socketMap } from "../lib/socketMaps.js";
import { InvitePayload } from "../types/payloads.js";

// TODO:
// figure out mentions (use notifications array on each msg), need to add on frontend

export interface MentionPayload {
  chatroomId: string;
  senderId: string;
  messageId: string;
}

export interface NotificationOptions {
  mention?: MentionPayload;
  invite?: InvitePayload;
}

export const createNotification = async (
  type: NotificationType,
  userId: string,
  options: NotificationOptions
) => {
  const queryOptions: any = {};
  switch (type) {
    case NotificationType.INVITE:
      if (!options.invite) {
        console.error("Invite is required for INVITE notification");
      }
      queryOptions.inviteId = options.invite?.id;
      break;
    case NotificationType.MENTION:
      if (!options.mention?.messageId) {
        console.error("Message is required for MENTION notification");
      }
      queryOptions.messageId = options.mention?.messageId;
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
  options: NotificationOptions
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
              mention: options.mention,
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
  options: NotificationOptions
) => {
  try {
    const notification = await createNotification(type, userId, options);
    await sendNotification(notification, options);
    return notification;
  } catch (err) {
    console.error("Error handling new notification: " + err);
  }
};
