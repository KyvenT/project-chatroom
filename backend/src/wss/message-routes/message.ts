import Prisma from "../../prisma/prisma.js";
import WebSocket from "ws";
import { ChatMessage } from "../../types/ws-messages.js";
import { socketMap } from "../../lib/socketMaps.js";
import type { Message } from "@prisma/client";

const createMessage = async (userId: string, 
    message: ChatMessage, ws: WebSocket): Promise<Message | undefined> => {
    try {
        const createdMessage = await Prisma.message.create({
            data: {
                content: message.content,
                chatroomId: message.chatroomId,
                senderUserId: userId
            }
        }) as Message;

        ws.send(JSON.stringify({
            type: "feedback", 
            message: "message sent (" + createdMessage.id + ", " + createdMessage.createdAt + ")"
        }))
        return createdMessage;
    } catch (err) {
        console.error(err);
        ws.send(JSON.stringify({
            type: "feedback",
            message: "message failed to send (" + err + ")"
        }))
    }
}

const sendToRecipients = async (userId: string,
        message: Message, ws: WebSocket) => {
    try {
        const recipients = await Prisma.chatroomMember.findMany({
            where: {
                chatroomId: message.chatroomId
            }
        })

        recipients.forEach((recipient) => {
            const recipientSocket = socketMap.getByKey(recipient.memberId);
            if (recipientSocket) {
                recipientSocket.send(JSON.stringify({
                    type: "chat-message",
                    message: {
                        id: message.id,
                        content: message.content,
                        chatroomId: message.chatroomId,
                        senderUserId: message.senderUserId,
                        createdAt: message.createdAt.toISOString()
                    }
                }));
            }
        })


    } catch (err) {
        console.error(err);
    }
}

export const handleChatMessage = async (message: ChatMessage, ws: WebSocket) => {
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
    sendToRecipients(user, createdMessage, ws);

    
}