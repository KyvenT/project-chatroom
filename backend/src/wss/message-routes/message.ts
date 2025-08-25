import Prisma from "../../prisma/prisma.js";
import WebSocket from "ws";
import { ChatMessage } from "../../types/ws-messages.js";
import { socketMap, userActiveChatroomMap } from "../../lib/socketMaps.js";
import type { Message } from "@prisma/client";

const createMessage = async (userId: string, 
    message: ChatMessage, ws: WebSocket): Promise<Message & {senderUser :{ username: string}} | undefined> => {
    try {
        const createdMessage = await Prisma.message.create({
            data: {
                content: message.content,
                chatroomId: message.chatroomId,
                senderUserId: userId
            },
            include: {
                senderUser: {
                    select: {
                        username: true
                    }
                },
            },
        }) as Message & {senderUser: { username: string}};

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
        message: Message & {senderUser :{ username: string}}, ws: WebSocket) => {
    try {
        const activeRecipients = userActiveChatroomMap.getByValue(message.chatroomId);

        activeRecipients?.forEach((activeUserId) => {
            const recipientSocket = socketMap.getByKey(activeUserId);
            if (recipientSocket) {
                console.log("Active user in chatroom " + message.chatroomId + ": " + activeUserId);
                recipientSocket.send(JSON.stringify({
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