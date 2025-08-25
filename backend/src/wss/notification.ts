import Prisma from "../prisma/prisma.js";
import type { Notification, NotificationType, Message } from "@prisma/client";
import { socketMap } from "../lib/socketMaps.js";

export interface NotificationOptions {
    message?: Message;
}

export const createNotification = async (type: NotificationType, 
    userId: string, options: NotificationOptions={}) => {
    
    const queryOptions: any = {};
    switch (type) {
        case "INVITE":
            break;
        case "MESSAGE":
            if (!options.message) {
                console.error("Message is required for MESSAGE notification");
            }
            queryOptions.messageId = options.message?.id;
            break;
        default:
            console.error("Invalid notification type");
    }

    const newNotification: Notification = await Prisma.notification.create({
        data: {
            type,
            userId,
            ...queryOptions
        }
    })

    return newNotification;
}

export const sendNotification = async (notification: Notification, 
    options: NotificationOptions={}
) => {
    try {
        const recipientSocket = socketMap.getByKey(notification.userId);
        if (recipientSocket) {
            recipientSocket.send(JSON.stringify({
                type: "notification",
                notification: {
                    id: notification.id,
                    type: notification.type,
                    createdAt: notification.createdAt,
                    chatroom: options.message?.chatroomId,
                    sender: options.message?.senderUserId,
                    messageId: options.message?.id,
                }
            }))
        }
    } catch (err) {
        console.error("Failed to send notification via WebSocket: " + err);
    }
}

export const handleNewNotification = async (type: NotificationType, 
    userId: string, options: NotificationOptions={}) => {
    try {
        const notification = await createNotification(type, userId, options);
        await sendNotification(notification, options);
        return notification;
    } catch (err) {
        console.error("Error handling new notification: " + err);
    }
}